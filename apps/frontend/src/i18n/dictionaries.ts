/**
 * Dictionnaires FR/EN (+ autres) — core + audit + LIA Hub.
 */
import type { Dict, Lang } from './types'
import { DICTS as CORE_DICTS } from './dictionariesCore'
import { auditFr, auditEn } from './auditKeys'
import { liaHubFr, liaHubEn } from './liaHubKeys'

function withExtras(lang: Lang, base: Dict): Dict {
  const audit = lang === 'en' ? auditEn : auditFr
  const lia = lang === 'en' ? liaHubEn : liaHubFr
  return { ...base, ...audit, ...lia }
}

export const dictionaries: Record<Lang, Dict> = {
  fr: withExtras('fr', CORE_DICTS.fr),
  en: withExtras('en', CORE_DICTS.en),
  es: withExtras('es', CORE_DICTS.es),
  ru: withExtras('ru', CORE_DICTS.ru),
  uk: withExtras('uk', CORE_DICTS.uk),
  zh: withExtras('zh', CORE_DICTS.zh),
  ar: withExtras('ar', CORE_DICTS.ar),
}

/** Alias attendu par I18nContext */
export const DICTS = dictionaries

export function getDict(lang: Lang): Dict {
  return dictionaries[lang] || dictionaries.fr
}
