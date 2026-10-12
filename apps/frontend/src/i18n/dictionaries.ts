/**
 * Dictionnaires FR/EN (+ autres) — core + audit + LIA Hub.
 */
import type { Dict, Lang } from './types'
import { CORE } from './dictionariesCore'
import { auditFr, auditEn } from './auditKeys'
import { liaHubFr, liaHubEn } from './liaHubKeys'

function withAudit(lang: Lang, base: Dict): Dict {
  const audit = lang === 'en' ? auditEn : auditFr
  const lia = lang === 'en' ? liaHubEn : liaHubFr
  return { ...base, ...audit, ...lia }
}

export const dictionaries: Record<Lang, Dict> = {
  fr: withAudit('fr', CORE.fr),
  en: withAudit('en', CORE.en),
  es: withAudit('es', CORE.es),
  ru: withAudit('ru', CORE.ru),
  uk: withAudit('uk', CORE.uk),
  zh: withAudit('zh', CORE.zh),
  ar: withAudit('ar', CORE.ar),
}

export function getDict(lang: Lang): Dict {
  return dictionaries[lang] || dictionaries.fr
}
