/**
 * Live catalog from Akash indexer (with hard default) or VITE_CATALOG_API override.
 * Origin only — appends /catalog at fetch time.
 *
 * Lease 2026-09: https://kc7hfr7tb9aqreaqtst0834c2c.ingress.hurricane.akash.pub
 * (dseq 1790359855895 · provider hurricane · 4 collections / 90 NFTs)
 */

/** Default public indexer — HTTPS preferred (CORS open for neltud.github.io) */
export const DEFAULT_CATALOG_API =
  'https://kc7hfr7tb9aqreaqtst0834c2c.ingress.hurricane.akash.pub'

export function getCatalogApiBase(): string {
  const raw =
    (import.meta.env.VITE_CATALOG_API as string | undefined)?.trim() ||
    DEFAULT_CATALOG_API
  return raw.replace(/\/$/, '')
}

export function catalogApiUrls(): string[] {
  const base = getCatalogApiBase()
  if (!base) return []
  return [`${base}/catalog`, base]
}

export function isCatalogApiConfigured(): boolean {
  return Boolean(getCatalogApiBase())
}
