import type { PromptLocale } from './types'
import { getPromptTemplate } from './template-store'
import { PROMPT_IDS } from './prompt-ids'

export type ArtStyleValue = 'xuanji-style' | 'american-comic' | 'chinese-comic' | 'japanese-anime' | 'realistic'

const ART_STYLE_PROMPT_ID_MAP: Record<ArtStyleValue, string> = {
  'xuanji-style': PROMPT_IDS.ART_STYLE_XUANJI,
  'american-comic': PROMPT_IDS.ART_STYLE_AMERICAN_COMIC,
  'chinese-comic': PROMPT_IDS.ART_STYLE_CHINESE_COMIC,
  'japanese-anime': PROMPT_IDS.ART_STYLE_JAPANESE_ANIME,
  'realistic': PROMPT_IDS.ART_STYLE_REALISTIC,
}

export function getArtStylePromptFromTemplate(
  artStyle: ArtStyleValue,
  locale: PromptLocale,
  version?: string,
): string {
  const promptId = ART_STYLE_PROMPT_ID_MAP[artStyle]
  if (!promptId) return ''
  return getPromptTemplate(promptId as any, locale, version)
}

export function getCharacterSuffixPrompt(locale: PromptLocale, version?: string): string {
  return getPromptTemplate(PROMPT_IDS.SUFFIX_CHARACTER as any, locale, version)
}

export function getPropSuffixPrompt(locale: PromptLocale, version?: string): string {
  return getPromptTemplate(PROMPT_IDS.SUFFIX_PROP as any, locale, version)
}

export function isValidArtStyleValue(value: unknown): value is ArtStyleValue {
  return typeof value === 'string' && Object.keys(ART_STYLE_PROMPT_ID_MAP).includes(value)
}