import { logInfo as _ulogInfo } from '@/lib/logging/core'
/**
 * 生成器统一入口（增强版）
 * 
 * 支持：
 * - 严格使用 model_key（provider::modelId）
 * - 用户自定义模型的动态路由（仅通过配置中心）
 * - 统一错误处理
 */

import { createAudioGenerator, createImageGenerator, createVideoGenerator } from './generators/factory'
import type { GenerateResult } from './generators/base'
import { getProviderConfig, getProviderKey, resolveModelSelection } from './api-config'
import {
    generateImageViaOpenAICompatTemplate,
    generateVideoViaOpenAICompat,
    generateVideoViaOpenAICompatTemplate,
    resolveModelGatewayRoute,
} from './model-gateway'
import { generateBailianAudio, generateBailianImage, generateBailianVideo } from './providers/bailian'
import { generateSiliconFlowAudio, generateSiliconFlowImage, generateSiliconFlowVideo } from './providers/siliconflow'

const OFFICIAL_ONLY_PROVIDER_KEYS = new Set(['bailian', 'siliconflow'])

/**
 * 生成图片（简化版）
 * 
 * @param userId 用户 ID
 * @param modelKey 模型唯一键（provider::modelId）
 * @param prompt 提示词
 * @param options 生成选项
 */
export async function generateImage(
    userId: string,
    modelKey: string,
    prompt: string,
    options?: {
        referenceImages?: string[]
        aspectRatio?: string
        resolution?: string
        outputFormat?: string
        keepOriginalAspectRatio?: boolean  // 🔥 编辑时保持原图比例
        size?: string  // 🔥 直接指定像素尺寸如 "5016x3344"（优先于 aspectRatio）
    }
): Promise<GenerateResult> {
    // 🔥 DEBUG: 入口参数
    _ulogInfo(`[generateImage] ENTRY: modelKey=${modelKey}, options=${JSON.stringify({
        aspectRatio: options?.aspectRatio,
        resolution: options?.resolution,
        size: options?.size,
        outputFormat: options?.outputFormat,
        keepOriginalAspectRatio: options?.keepOriginalAspectRatio,
        referenceImagesCount: options?.referenceImages?.length ?? 0,
    })}`)

    const selection = await resolveModelSelection(userId, modelKey, 'image')
    _ulogInfo(`[generateImage] resolved model selection: ${selection.modelKey}`)
    const providerConfig = await getProviderConfig(userId, selection.provider)
    const providerKey = getProviderKey(selection.provider).toLowerCase()
    if (providerKey === 'bailian') {
        return await generateBailianImage({
            userId,
            prompt,
            referenceImages: options?.referenceImages,
            options: {
                ...(options || {}),
                provider: selection.provider,
                modelId: selection.modelId,
                modelKey: selection.modelKey,
            },
        })
    }
    if (providerKey === 'siliconflow') {
        return await generateSiliconFlowImage({
            userId,
            prompt,
            referenceImages: options?.referenceImages,
            options: {
                ...(options || {}),
                provider: selection.provider,
                modelId: selection.modelId,
                modelKey: selection.modelKey,
            },
        })
    }
    const defaultGatewayRoute = resolveModelGatewayRoute(selection.provider)
    let gatewayRoute = OFFICIAL_ONLY_PROVIDER_KEYS.has(providerKey)
        ? 'official'
        : (providerConfig.gatewayRoute || defaultGatewayRoute)

    // 🔥 gemini-compatible: 强制使用 official generator（使用 baseUrl 调用兼容 API）
    // 忽略数据库中可能存在的错误 gatewayRoute 配置
    if (providerKey === 'gemini-compatible') {
        gatewayRoute = 'official'
    }

    // 调用生成（提取 referenceImages 单独传递，其余选项合并进 options）
    const { referenceImages, ...generatorOptions } = options || {}
    _ulogInfo(`[generateImage] AFTER_SPLIT: generatorOptions=${JSON.stringify({
        aspectRatio: generatorOptions.aspectRatio,
        resolution: generatorOptions.resolution,
        size: generatorOptions.size,
        outputFormat: generatorOptions.outputFormat,
        keepOriginalAspectRatio: generatorOptions.keepOriginalAspectRatio,
    })}, gatewayRoute=${gatewayRoute}, providerKey=${providerKey}`)

    if (gatewayRoute === 'openai-compat') {
        const compatTemplate = selection.compatMediaTemplate
        _ulogInfo(`[generateImage] OPENAI_COMPAT: compatTemplate=${compatTemplate ? 'YES' : 'NO'}, will use default template if missing`)

        // 统一使用 generateImageViaOpenAICompatTemplate，它内部会自动使用默认模板
        _ulogInfo(`[generateImage] TEMPLATE_PATH: options passed to template=${JSON.stringify({
            ...generatorOptions,
            provider: selection.provider,
            modelId: selection.modelId,
            modelKey: selection.modelKey,
        })}`)
        return await generateImageViaOpenAICompatTemplate({
            userId,
            providerId: selection.provider,
            modelId: selection.modelId,
            modelKey: selection.modelKey,
            prompt,
            referenceImages,
            options: {
                ...generatorOptions,
                provider: selection.provider,
                modelId: selection.modelId,
                modelKey: selection.modelKey,
            },
            profile: 'openai-compatible',
            template: compatTemplate,
        })
    }

    const generator = createImageGenerator(selection.provider, selection.modelId)
    return await generator.generate({
        userId,
        prompt,
        referenceImages,
        options: {
            ...generatorOptions,
            provider: selection.provider,
            modelId: selection.modelId,
            modelKey: selection.modelKey,
        }
    })
}

/**
 * 生成视频（增强版）
 * 
 * @param userId 用户 ID
 * @param modelKey 模型唯一键（provider::modelId）
 * @param imageUrl 输入图片 URL
 * @param options 生成选项
 */
export async function generateVideo(
    userId: string,
    modelKey: string,
    imageUrl: string,
    options?: {
        prompt?: string
        duration?: number
        fps?: number
        resolution?: string      // '720p' | '1080p'
        aspectRatio?: string     // '16:9' | '9:16'
        generateAudio?: boolean  // 仅 Seedance 1.5 Pro 支持
        lastFrameImageUrl?: string  // 首尾帧模式的尾帧图片
        [key: string]: string | number | boolean | undefined
    }
): Promise<GenerateResult> {
    _ulogInfo(`[generateVideo] ENTRY: userId=${userId}, modelKey=${modelKey}`)
    _ulogInfo(`[generateVideo] OPTIONS: ${JSON.stringify({
        prompt: options?.prompt?.slice(0, 50),
        duration: options?.duration,
        resolution: options?.resolution,
        aspectRatio: options?.aspectRatio,
        generateAudio: options?.generateAudio,
        hasLastFrame: !!options?.lastFrameImageUrl,
    })}`)

    const selection = await resolveModelSelection(userId, modelKey, 'video')
    _ulogInfo(`[generateVideo] MODEL SELECTION: provider=${selection.provider}, modelId=${selection.modelId}, modelKey=${selection.modelKey}`)
    const providerKey = getProviderKey(selection.provider).toLowerCase()
    _ulogInfo(`[generateVideo] PROVIDER KEY: ${providerKey}`)

    if (providerKey === 'bailian') {
        _ulogInfo(`[generateVideo] ROUTING TO: bailian`)
        return await generateBailianVideo({
            userId,
            imageUrl,
            prompt: options?.prompt,
            options: {
                ...(options || {}),
                provider: selection.provider,
                modelId: selection.modelId,
                modelKey: selection.modelKey,
            },
        })
    }
    if (providerKey === 'siliconflow') {
        _ulogInfo(`[generateVideo] ROUTING TO: siliconflow`)
        return await generateSiliconFlowVideo({
            userId,
            imageUrl,
            prompt: options?.prompt,
            options: {
                ...(options || {}),
                provider: selection.provider,
                modelId: selection.modelId,
                modelKey: selection.modelKey,
            },
        })
    }
    const providerConfig = await getProviderConfig(userId, selection.provider)
    _ulogInfo(`[generateVideo] PROVIDER CONFIG: baseUrl=${providerConfig.baseUrl?.slice(0, 50) || 'none'}, gatewayRoute=${providerConfig.gatewayRoute}, apiMode=${providerConfig.apiMode}`)

    const defaultGatewayRoute = resolveModelGatewayRoute(selection.provider)
    let gatewayRoute = OFFICIAL_ONLY_PROVIDER_KEYS.has(providerKey)
        ? 'official'
        : (providerConfig.gatewayRoute || defaultGatewayRoute)

    // 🔥 gemini-compatible: 强制使用 official generator（使用 baseUrl 调用兼容 API）
    // 忽略数据库中可能存在的错误 gatewayRoute 配置
    if (providerKey === 'gemini-compatible') {
        gatewayRoute = 'official'
    }

    _ulogInfo(`[generateVideo] GATEWAY ROUTE: default=${defaultGatewayRoute}, resolved=${gatewayRoute}`)

    const { prompt, ...providerOptions } = options || {}
    if (gatewayRoute === 'openai-compat') {
        _ulogInfo(`[generateVideo] ROUTING TO: openai-compat`)
        const compatTemplate = selection.compatMediaTemplate
        _ulogInfo(`[generateVideo] COMPAT TEMPLATE: ${compatTemplate ? 'present' : 'none'}`)
        if (providerKey === 'openai-compatible' && !compatTemplate) {
            throw new Error(`MODEL_COMPAT_MEDIA_TEMPLATE_REQUIRED: ${selection.modelKey}`)
        }
        if (compatTemplate) {
            _ulogInfo(`[generateVideo] CALLING: generateVideoViaOpenAICompatTemplate`)
            return await generateVideoViaOpenAICompatTemplate({
                userId,
                providerId: selection.provider,
                modelId: selection.modelId,
                modelKey: selection.modelKey,
                imageUrl,
                prompt: prompt || '',
                options: {
                    ...providerOptions,
                    provider: selection.provider,
                    modelId: selection.modelId,
                    modelKey: selection.modelKey,
                },
                profile: 'openai-compatible',
                template: compatTemplate,
            })
        }

        _ulogInfo(`[generateVideo] CALLING: generateVideoViaOpenAICompat (no template)`)
        return await generateVideoViaOpenAICompat({
            userId,
            providerId: selection.provider,
            modelId: selection.modelId,
            modelKey: selection.modelKey,
            imageUrl,
            prompt: prompt || '',
            options: {
                ...providerOptions,
                provider: selection.provider,
                modelId: selection.modelId,
                modelKey: selection.modelKey,
            },
            profile: 'openai-compatible',
        })
    }

    _ulogInfo(`[generateVideo] ROUTING TO: official generator (provider=${selection.provider})`)
    const generator = createVideoGenerator(selection.provider)
    return await generator.generate({
        userId,
        imageUrl,
        prompt,
        options: {
            ...providerOptions,
            provider: selection.provider,
            modelId: selection.modelId,
            modelKey: selection.modelKey,
        }
    })
}

/**
 * 生成语音
 */
export async function generateAudio(
    userId: string,
    modelKey: string,
    text: string,
    options?: {
        voice?: string
        rate?: number
    }
): Promise<GenerateResult> {
    const selection = await resolveModelSelection(userId, modelKey, 'audio')
    const providerKey = getProviderKey(selection.provider).toLowerCase()
    if (providerKey === 'bailian') {
        return await generateBailianAudio({
            userId,
            text,
            voice: options?.voice,
            rate: options?.rate,
            options: {
                provider: selection.provider,
                modelId: selection.modelId,
                modelKey: selection.modelKey,
            },
        })
    }
    if (providerKey === 'siliconflow') {
        return await generateSiliconFlowAudio({
            userId,
            text,
            voice: options?.voice,
            rate: options?.rate,
            options: {
                provider: selection.provider,
                modelId: selection.modelId,
                modelKey: selection.modelKey,
            },
        })
    }
    const generator = createAudioGenerator(selection.provider)

    return generator.generate({
        userId,
        text,
        voice: options?.voice,
        rate: options?.rate,
        options: {
            provider: selection.provider,
            modelId: selection.modelId,
            modelKey: selection.modelKey,
        },
    })
}
