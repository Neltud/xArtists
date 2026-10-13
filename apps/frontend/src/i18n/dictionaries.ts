/**
 * Dictionnaires multi-langues — core + audit + LIA Hub.
 * Fallback runtime: lang → en → fr (see I18nContext).
 */
import type { Dict, Lang } from './types'
import { DICTS as CORE_DICTS } from './dictionariesCore'
import { auditFr, auditEn } from './auditKeys'
import { liaHubFr, liaHubEn } from './liaHubKeys'

function withExtras(lang: Lang, base: Dict): Dict {
  // Audit + LIA Hub: native FR/EN; other langs inherit EN (then FR via t())
  const audit = lang === 'fr' ? auditFr : auditEn
  const lia = lang === 'fr' ? liaHubFr : liaHubEn
  return { ...base, ...audit, ...lia }
}

export const dictionaries: Record<Lang, Dict> = {
  fr: withExtras('fr', CORE_DICTS.fr),
  en: withExtras('en', CORE_DICTS.en),
  es: withExtras('es', CORE_DICTS.es),
  de: withExtras('de', CORE_DICTS.de),
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
