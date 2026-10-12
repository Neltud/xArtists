import type { Dict, Lang } from './types'
import { auditFr, auditEn } from './auditKeys'

/** Re-export pattern: load full locale tables then overlay audit keys. */
import { DICTS as CORE } from './dictionariesCore'

function withAudit(lang: Lang, base: Dict): Dict {
  if (lang === 'fr') return { ...base, ...auditFr }
  if (lang === 'en') return { ...base, ...auditEn }
  // Other langs fall back to FR audit strings for new keys via t() chain
  return { ...base, ...auditFr }
}

export const DICTS: Record<Lang, Dict> = {
  fr: withAudit('fr', CORE.fr),
  en: withAudit('en', CORE.en),
  es: withAudit('es', CORE.es),
  ru: withAudit('ru', CORE.ru),
  uk: withAudit('uk', CORE.uk),
  zh: withAudit('zh', CORE.zh),
  ar: withAudit('ar', CORE.ar),
}
