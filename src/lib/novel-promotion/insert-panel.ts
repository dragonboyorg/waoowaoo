import { buildPrompt, PROMPT_IDS } from '@/lib/prompt-i18n'
import type { PromptLocale } from '@/lib/prompt-i18n/types'

function readTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeLocale(locale: string | undefined): PromptLocale {
  if (typeof locale === 'string' && locale.toLowerCase().startsWith('zh')) return 'zh'
  return 'en'
}

export function resolveInsertPanelUserInput(payload: Record<string, unknown>, locale?: string): string {
  const explicitInput = readTrimmedString(payload.userInput)
  if (explicitInput) return explicitInput

  const promptInput = readTrimmedString(payload.prompt)
  if (promptInput) return promptInput

  // 从模板加载默认提示词
  try {
    return buildPrompt({
      promptId: PROMPT_IDS.INLINE_INSERT_PANEL,
      locale: normalizeLocale(locale),
      variables: {},
    })
  } catch {
    // 如果模板加载失败，返回硬编码的默认值作为 fallback
    return locale?.toLowerCase().startsWith('zh')
      ? '请根据前后镜头自动分析并插入一个自然衔接的新分镜。'
      : 'Automatically analyze the surrounding panels and insert a naturally connected new panel.'
  }
}