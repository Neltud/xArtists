/**
 * Optional live catalog from Akash (or any) indexer.
 * VITE_CATALOG_API = origin only, e.g. https://xxx.ingress…
 * Tries {base}/catalog then {base}/
 */

export function getCatalogApiBase(): string {
  const raw = (import.meta.env.VITE_CATALOG_API as string | undefined) || ''
  return raw.replace(/\/$/, '').trim()
}

export function catalogApiUrls(): string[] {
  const base = getCatalogApiBase()
  if (!base) return []
  return [`${base}/catalog`, base]
}

export function isCatalogApiConfigured(): boolean {
  return Boolean(getCatalogApiBase())
}
