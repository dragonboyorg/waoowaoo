import { logInfo as _ulogInfo } from '@/lib/logging/core'
import type { GenerateResult } from '@/lib/generators/base'
import type { OpenAICompatImageRequest } from '../types'
import {
  buildRenderedTemplateRequest,
  buildTemplateVariables,
  extractTemplateError,
  normalizeResponseJson,
  readJsonPath,
} from '@/lib/openai-compat-template-runtime'
import { parseModelKeyStrict } from '@/lib/model-config-contract'
import type { OpenAICompatMediaTemplate } from '@/lib/openai-compat-media-template'
import { resolveOpenAICompatClientConfig } from './common'
import { resolvePixelSize, resolvePixelDimensions, DEFAULT_IMAGE_RESOLUTION } from '@/lib/constants'

const OPENAI_COMPAT_PROVIDER_PREFIX = 'openai-compatible:'
const PROVIDER_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// 标准图像生成请求格式（无需 template 时自动使用）
const STANDARD_IMAGE_BODY_TEMPLATE = {
  model: '{{model}}',
  prompt: '{{prompt}}',
  size: '{{size}}',
}

function encodeProviderToken(providerId: string): string {
  const value = providerId.trim()
  if (value.startsWith(OPENAI_COMPAT_PROVIDER_PREFIX)) {
    const uuid = value.slice(OPENAI_COMPAT_PROVIDER_PREFIX.length).trim()
    if (PROVIDER_UUID_PATTERN.test(uuid)) {
      return `u_${uuid.toLowerCase()}`
    }
  }
  return `b64_${Buffer.from(value, 'utf8').toString('base64url')}`
}

function encodeModelRef(modelRef: string): string {
  return Buffer.from(modelRef, 'utf8').toString('base64url')
}

function resolveModelRef(request: OpenAICompatImageRequest): string {
  const modelId = typeof request.modelId === 'string' ? request.modelId.trim() : ''
  if (modelId) return modelId
  const parsed = typeof request.modelKey === 'string' ? parseModelKeyStrict(request.modelKey) : null
  if (parsed?.modelId) return parsed.modelId
  throw new Error('OPENAI_COMPAT_IMAGE_MODEL_REF_REQUIRED')
}

function readTemplateOutputUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const urls: string[] = []
  for (const item of value) {
    if (typeof item === 'string' && item.trim()) {
      urls.push(item.trim())
      continue
    }
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const url = (item as { url?: unknown }).url
    if (typeof url === 'string' && url.trim()) {
      urls.push(url.trim())
    }
  }
  return urls
}

export async function generateImageViaOpenAICompatTemplate(
  request: OpenAICompatImageRequest,
): Promise<GenerateResult> {
  _ulogInfo(`[template-image] ENTRY: userId=${request.userId}, providerId=${request.providerId}, modelId=${request.modelId || '(none)'}, hasTemplate=${request.template ? 'YES' : 'NO'}`)

  const config = await resolveOpenAICompatClientConfig(request.userId, request.providerId)
  const firstReference = Array.isArray(request.referenceImages) && request.referenceImages.length > 0
    ? request.referenceImages[0]
    : ''

  // 从 options 提取 aspectRatio 和 resolution
  const aspectRatio = typeof request.options?.aspectRatio === 'string' ? request.options.aspectRatio : undefined
  const resolution = typeof request.options?.resolution === 'string' ? request.options.resolution : DEFAULT_IMAGE_RESOLUTION
  const directSize = typeof request.options?.size === 'string' ? request.options.size : undefined

  // 查表计算像素尺寸
  const computedSize = directSize || resolvePixelSize(aspectRatio, resolution)
  const computedDimensions = resolvePixelDimensions(aspectRatio, resolution)

  _ulogInfo(`[template-image] SIZE_COMPUTE: aspectRatio=${aspectRatio || '(none)'}, resolution=${resolution}, computedSize=${computedSize || '(none)'}`)

  // 简化：如果没有 template，自动使用标准格式
  const defaultTemplate: OpenAICompatMediaTemplate = {
    version: 1,
    mediaType: 'image',
    mode: 'sync',
    create: {
      method: 'POST',
      path: '/images/generations',
      bodyTemplate: STANDARD_IMAGE_BODY_TEMPLATE,
    },
    response: {
      outputUrlsPath: '$.data',
      outputUrlPath: '$.data[0].url',
    },
  }
  const effectiveTemplate: OpenAICompatMediaTemplate = (request.template as OpenAICompatMediaTemplate) || defaultTemplate

  // 如果 template 有定义但没有 size 字段，自动注入
  let enhancedEndpoint = effectiveTemplate.create
  if (effectiveTemplate.create.bodyTemplate && typeof effectiveTemplate.create.bodyTemplate === 'object') {
    const bodyKeys = Object.keys(effectiveTemplate.create.bodyTemplate)
    const hasSizeField = bodyKeys.some((key) => {
      const lowerKey = key.toLowerCase()
      return lowerKey === 'size' || lowerKey === 'width' || lowerKey === 'height'
    })
    if (!hasSizeField && computedSize) {
      enhancedEndpoint = {
        ...effectiveTemplate.create,
        bodyTemplate: {
          ...effectiveTemplate.create.bodyTemplate,
          size: '{{size}}',
        },
      }
      _ulogInfo(`[template-image] AUTO_INJECT_SIZE: bodyTemplate missing size field, injected`)
    }
  }

  const variables = buildTemplateVariables({
    model: request.modelId || 'flux-2',
    prompt: request.prompt,
    image: firstReference,
    images: request.referenceImages || [],
    aspectRatio,
    resolution,
    size: computedSize,
    extra: {
      ...request.options,
      ...(computedDimensions ? { width: computedDimensions.width, height: computedDimensions.height } : {}),
    },
  })

  const createRequest = await buildRenderedTemplateRequest({
    baseUrl: config.baseUrl,
    endpoint: enhancedEndpoint,
    variables,
    defaultAuthHeader: `Bearer ${config.apiKey}`,
  })

  _ulogInfo(`[template-image] REQUEST: endpointUrl=${createRequest.endpointUrl}, body=${createRequest.body ? (typeof createRequest.body === 'string' ? createRequest.body.substring(0, 300) : '(FormData)') : '(none)'}`)

  if (['POST', 'PUT', 'PATCH'].includes(createRequest.method) && !createRequest.body) {
    throw new Error('OPENAI_COMPAT_IMAGE_TEMPLATE_CREATE_BODY_REQUIRED')
  }

  const response = await fetch(createRequest.endpointUrl, {
    method: createRequest.method,
    headers: createRequest.headers,
    ...(createRequest.body ? { body: createRequest.body } : {}),
  })
  const rawText = await response.text().catch(() => '')
  const payload = normalizeResponseJson(rawText)
  if (!response.ok) {
    throw new Error(extractTemplateError(effectiveTemplate, payload, response.status))
  }

  // 使用 effectiveTemplate（兼容无 template 的情况）
  if (effectiveTemplate.mode === 'sync') {
    const outputUrls = readTemplateOutputUrls(
      readJsonPath(payload, effectiveTemplate.response.outputUrlsPath),
    )
    if (outputUrls.length > 0) {
      const first = outputUrls[0]
      return {
        success: true,
        imageUrl: first,
        ...(outputUrls.length > 1 ? { imageUrls: outputUrls } : {}),
      }
    }

    const outputUrlPath = effectiveTemplate.response.outputUrlPath
    if (outputUrlPath) {
      const outputUrl = readJsonPath(payload, outputUrlPath)
      if (typeof outputUrl === 'string' && outputUrl.trim().length > 0) {
        return {
          success: true,
          imageUrl: outputUrl.trim(),
        }
      }
    }
    throw new Error('OPENAI_COMPAT_IMAGE_TEMPLATE_OUTPUT_NOT_FOUND')
  }

  const taskIdRaw = readJsonPath(payload, effectiveTemplate.response.taskIdPath)
  const taskId = typeof taskIdRaw === 'string' ? taskIdRaw.trim() : ''
  if (!taskId) {
    throw new Error('OPENAI_COMPAT_IMAGE_TEMPLATE_TASK_ID_NOT_FOUND')
  }
  const providerToken = encodeProviderToken(config.providerId)
  const modelRefToken = encodeModelRef(resolveModelRef(request))
  return {
    success: true,
    async: true,
    requestId: taskId,
    externalId: `OCOMPAT:IMAGE:${providerToken}:${modelRefToken}:${taskId}`,
  }
}