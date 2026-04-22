/**
 * Gemini Compatible 视频生成器
 *
 * 使用 Google SDK 的 generateVideos 方法调用 Gemini 兼容 API
 * LocalProviderPro 支持 predictLongRunning 端点格式
 */

import { GoogleGenAI } from '@google/genai'
import { BaseVideoGenerator, VideoGenerateParams, GenerateResult } from '../base'
import { getProviderConfig } from '@/lib/api-config'
import { normalizeToBase64ForGeneration } from '@/lib/media/outbound-image'
import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'

interface GeminiCompatibleVideoOptions {
    modelId?: string
    aspectRatio?: string
    resolution?: string
    duration?: number
    fps?: number
    lastFrameImageUrl?: string
    generationMode?: 'normal' | 'firstlastframe'
}

function dataUrlToInlineData(dataUrl: string): { mimeType: string; imageBytes: string } | null {
    const base64Start = dataUrl.indexOf(';base64,')
    if (base64Start === -1) return null
    const mimeType = dataUrl.substring(5, base64Start)
    const imageBytes = dataUrl.substring(base64Start + 8)
    return { mimeType, imageBytes }
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function extractOperationName(response: unknown): string | null {
    const obj = asRecord(response)
    if (!obj) return null
    if (typeof obj.name === 'string') return obj.name
    const operation = asRecord(obj.operation)
    if (operation && typeof operation.name === 'string') return operation.name
    if (typeof obj.operationName === 'string') return obj.operationName
    if (typeof obj.id === 'string') return obj.id
    return null
}

export class GeminiCompatibleVideoGenerator extends BaseVideoGenerator {
    private readonly modelId?: string
    private readonly providerId: string

    constructor(modelId?: string, providerId?: string) {
        super()
        this.modelId = modelId
        this.providerId = providerId || 'gemini-compatible'
    }

    protected async doGenerate(params: VideoGenerateParams): Promise<GenerateResult> {
        const { userId, imageUrl, prompt = '', options = {} } = params

        const providerConfig = await getProviderConfig(userId, this.providerId)
        if (!providerConfig.baseUrl) {
            throw new Error(`PROVIDER_BASE_URL_MISSING: ${this.providerId}`)
        }

        _ulogInfo(`[GeminiCompatVideo] baseUrl=${providerConfig.baseUrl.slice(0, 50)}`)

        const ai = new GoogleGenAI({
            apiKey: providerConfig.apiKey,
            httpOptions: { baseUrl: providerConfig.baseUrl },
        })

        const {
            modelId,
            aspectRatio,
            resolution,
            duration,
            fps,
            lastFrameImageUrl,
        } = options as GeminiCompatibleVideoOptions

        const resolvedModelId = this.modelId || modelId || 'ltx-2.3'
        // LocalProviderPro 需要视频模型带 video- 前缀
        const videoModelId = resolvedModelId.startsWith('video-') ? resolvedModelId : `video-${resolvedModelId}`

        _ulogInfo(`[GeminiCompatVideo] modelId=${resolvedModelId}, videoModelId=${videoModelId}`)

        const allowedOptionKeys = new Set([
            'provider',
            'modelId',
            'modelKey',
            'aspectRatio',
            'resolution',
            'duration',
            'fps',
            'lastFrameImageUrl',
            'generationMode',
        ])
        for (const [key, value] of Object.entries(options)) {
            if (value === undefined) continue
            if (!allowedOptionKeys.has(key)) {
                throw new Error(`GEMINI_COMPAT_VIDEO_OPTION_UNSUPPORTED: ${key}`)
            }
        }

        const request: Record<string, unknown> = {
            model: videoModelId,
        }
        if (prompt.trim().length > 0) {
            request.prompt = prompt.trim()
        }

        const config: Record<string, unknown> = {}
        if (aspectRatio) config.aspectRatio = aspectRatio
        if (resolution) config.resolution = resolution
        if (typeof duration === 'number') config.durationSeconds = duration
        if (typeof fps === 'number') config.fps = fps

        let hasImageInput = false
        // 添加首帧图片（图生视频）
        if (imageUrl) {
            const dataUrl = imageUrl.startsWith('data:') ? imageUrl : await normalizeToBase64ForGeneration(imageUrl)
            const inlineData = dataUrlToInlineData(dataUrl)
            if (inlineData) {
                request.image = inlineData
                hasImageInput = true
            }
        }

        // 首尾帧模式
        if (lastFrameImageUrl && hasImageInput) {
            const dataUrl = lastFrameImageUrl.startsWith('data:')
                ? lastFrameImageUrl
                : await normalizeToBase64ForGeneration(lastFrameImageUrl)
            const inlineData = dataUrlToInlineData(dataUrl)
            if (!inlineData) {
                throw new Error('GEMINI_COMPAT_LAST_FRAME_INVALID')
            }
            config.lastFrame = inlineData
        }

        if (Object.keys(config).length > 0) {
            request.config = config
        }

        _ulogInfo(`[GeminiCompatVideo] calling ai.models.generateVideos with model=${videoModelId}`)
        _ulogInfo(`[GeminiCompatVideo] REQUEST: ${JSON.stringify({
            model: videoModelId,
            prompt: request.prompt ? (request.prompt as string).slice(0, 50) : 'none',
            hasImage: !!request.image,
            imageKeys: request.image ? Object.keys(request.image as object) : [],
            configKeys: request.config ? Object.keys(request.config as object) : [],
        })}`)

        try {
            const response = await ai.models.generateVideos(
                request as unknown as Parameters<typeof ai.models.generateVideos>[0]
            )
            const operationName = extractOperationName(response)

            _ulogInfo(`[GeminiCompatVideo] response received, operationName=${operationName || 'none'}`)

            if (!operationName) {
                // 检查是否是同步返回的视频
                const obj = asRecord(response)
                const candidates = obj?.candidates as Array<unknown> | undefined
                if (candidates && candidates.length > 0) {
                    const candidate = asRecord(candidates[0])
                    const content = asRecord(candidate?.content)
                    const parts = content?.parts as Array<unknown> | undefined
                    if (parts && parts.length > 0) {
                        const part = asRecord(parts[0])
                        const inlineData = asRecord(part?.inlineData)
                        if (inlineData?.data) {
                            const mimeType = inlineData.mimeType || 'video/mp4'
                            return {
                                success: true,
                                videoUrl: `data:${mimeType};base64,${inlineData.data}`,
                            }
                        }
                    }
                }
                throw new Error('GEMINI_COMPAT_VIDEO_NO_OPERATION_NAME')
            }

            return {
                success: true,
                async: true,
                requestId: operationName,
                externalId: `GOOGLE:VIDEO:${operationName}`,
            }
        } catch (error) {
            _ulogError(`[GeminiCompatVideo] error: ${error instanceof Error ? error.message : String(error)}`)
            throw error
        }
    }
}