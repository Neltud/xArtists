/**
 * Dictionnaires FR/EN (+ autres) — core + audit + LIA Hub.
 */
import type { Dict, Lang } from './types'
import { DICTS } from './dictionariesCore'
import { auditFr, auditEn } from './auditKeys'
import { liaHubFr, liaHubEn } from './liaHubKeys'

function withExtras(lang: Lang, base: Dict): Dict {
  const audit = lang === 'en' ? auditEn : auditFr
  const lia = lang === 'en' ? liaHubEn : liaHubFr
  return { ...base, ...audit, ...lia }
}

export const dictionaries: Record<Lang, Dict> = {
  fr: withExtras('fr', DICTS.fr),
  en: withExtras('en', DICTS.en),
  es: withExtras('es', DICTS.es),
  ru: withExtras('ru', DICTS.ru),
  uk: withExtras('uk', DICTS.uk),
  zh: withExtras('zh', DICTS.zh),
  ar: withExtras('ar', DICTS.ar),
}

export function getDict(lang: Lang): Dict {
  return dictionaries[lang] || dictionaries.fr
}
