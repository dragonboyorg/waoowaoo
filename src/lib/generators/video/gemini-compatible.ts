/**
 * Gemini Compatible 视频生成器
 *
 * 直接调用 LocalProviderPro 的 Gemini 兼容 API
 * 格式：/v1beta/models/video-{model}:generateContent
 */

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

function dataUrlToInlineData(dataUrl: string): { mimeType: string; data: string } | null {
    const base64Start = dataUrl.indexOf(';base64,')
    if (base64Start === -1) return null
    const mimeType = dataUrl.substring(5, base64Start)
    const data = dataUrl.substring(base64Start + 8)
    return { mimeType, data }
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

        const {
            modelId,
            aspectRatio,
            resolution,
            duration,
            fps,
            lastFrameImageUrl,
        } = options as GeminiCompatibleVideoOptions

        const resolvedModelId = this.modelId || modelId || 'ltx-2.3'
        // LocalProviderPro 要求 video model 带 video- 前缀
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

        // 构造 Gemini generateContent 请求格式
        const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = []

        // 添加图片（首帧）
        if (imageUrl) {
            const dataUrl = imageUrl.startsWith('data:') ? imageUrl : await normalizeToBase64ForGeneration(imageUrl)
            const inlineData = dataUrlToInlineData(dataUrl)
            if (inlineData) {
                parts.push({ inlineData })
            }
        }

        // 添加提示词
        if (prompt.trim()) {
            parts.push({ text: prompt.trim() })
        }

        const contents = [{ role: 'user', parts }]

        // 构造 generationConfig
        const generationConfig: Record<string, unknown> = {}
        if (aspectRatio) generationConfig.aspectRatio = aspectRatio
        if (resolution) generationConfig.resolution = resolution
        if (typeof duration === 'number') generationConfig.durationSeconds = duration
        if (typeof fps === 'number') generationConfig.fps = fps

        // 🔥 首尾帧模式：添加 lastFrame
        if (lastFrameImageUrl) {
            const dataUrl = lastFrameImageUrl.startsWith('data:')
                ? lastFrameImageUrl
                : await normalizeToBase64ForGeneration(lastFrameImageUrl)
            const inlineData = dataUrlToInlineData(dataUrl)
            if (inlineData) {
                generationConfig.lastFrame = inlineData
            }
        }

        const requestBody = {
            contents,
            ...(Object.keys(generationConfig).length > 0 ? { generationConfig } : {}),
        }

        // 构造请求 URL
        const baseUrl = providerConfig.baseUrl.replace(/\/+$/, '')
        const endpointUrl = `${baseUrl}/v1beta/models/${encodeURIComponent(videoModelId)}:generateContent`

        _ulogInfo(`[GeminiCompatVideo] endpoint=${endpointUrl}`)
        _ulogInfo(`[GeminiCompatVideo] body keys: ${Object.keys(requestBody).join(',')}`)

        try {
            const response = await fetch(endpointUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': providerConfig.apiKey,
                },
                body: JSON.stringify(requestBody),
            })

            const responseText = await response.text()
            _ulogInfo(`[GeminiCompatVideo] response status=${response.status}`)

            if (!response.ok) {
                _ulogError(`[GeminiCompatVideo] error: ${responseText.slice(0, 200)}`)
                throw new Error(`GEMINI_COMPAT_VIDEO_FAILED: ${response.status} ${responseText.slice(0, 100)}`)
            }

            const responseData = JSON.parse(responseText) as unknown
            const operationName = extractOperationName(responseData)

            if (!operationName) {
                // 检查是否是同步返回的视频
                const obj = asRecord(responseData)
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

            _ulogInfo(`[GeminiCompatVideo] operationName=${operationName}`)
            return {
                success: true,
                async: true,
                requestId: operationName,
                externalId: `GOOGLE:VIDEO:${operationName}`,
            }
        } catch (error) {
            if (error instanceof Error) throw error
            throw new Error(`GEMINI_COMPAT_VIDEO_ERROR: ${String(error)}`)
        }
    }
}