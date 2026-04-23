import fs from 'fs'
import path from 'path'
import { PROMPT_CATALOG } from './catalog'
import type { PromptId } from './prompt-ids'
import type { PromptLocale } from './types'
import { PromptI18nError } from './errors'
import { getCurrentPromptVersion, getPromptBasePath, type PromptVersion } from './version-config'

const templateCache = new Map<string, string>()

function buildCacheKey(promptId: PromptId, locale: PromptLocale, version: PromptVersion) {
  return `${version}:${promptId}:${locale}`
}

export function getPromptTemplate(
  promptId: PromptId,
  locale: PromptLocale,
  version?: PromptVersion,
): string {
  const entry = PROMPT_CATALOG[promptId]
  if (!entry) {
    throw new PromptI18nError(
      'PROMPT_ID_UNREGISTERED',
      promptId,
      `Prompt is not registered: ${promptId}`,
    )
  }

  const resolvedVersion = version || getCurrentPromptVersion()
  const cacheKey = buildCacheKey(promptId, locale, resolvedVersion)
  const cached = templateCache.get(cacheKey)
  if (cached) return cached

  const basePath = getPromptBasePath(resolvedVersion)
  const filePath = path.join(basePath, `${entry.pathStem}.${locale}.txt`)
  let template = ''
  try {
    template = fs.readFileSync(filePath, 'utf-8')
  } catch {
    throw new PromptI18nError(
      'PROMPT_TEMPLATE_NOT_FOUND',
      promptId,
      `Prompt template not found: ${filePath}`,
      { filePath, locale, version: resolvedVersion },
    )
  }

  templateCache.set(cacheKey, template)
  return template
}

export function invalidateTemplateCache(): void {
  templateCache.clear()
}