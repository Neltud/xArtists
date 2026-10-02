/**
 * Client overlay for listings after list/buy (JSON static can't update alone).
 */
import type { ListingRow } from '../types/marketplace'

const SOLD_KEY = 'xartists_listings_sold_v1'
const EXTRA_KEY = 'xartists_listings_extra_v1'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v))
  } catch {
    /* */
  }
}

export function markListingSold(listingId: number, txBuy?: string) {
  const map = readJson<Record<string, { sold: true; tx?: string }>>(SOLD_KEY, {})
  map[String(listingId)] = { sold: true, tx: txBuy }
  writeJson(SOLD_KEY, map)
}

export function rememberLocalListing(row: ListingRow) {
  const list = readJson<ListingRow[]>(EXTRA_KEY, [])
  list.unshift({ ...row, active: true })
  writeJson(EXTRA_KEY, list.slice(0, 40))
}

export function applyListingOverlay(rows: ListingRow[]): ListingRow[] {
  const sold = readJson<Record<string, { sold: true }>>(SOLD_KEY, {})
  const extra = readJson<ListingRow[]>(EXTRA_KEY, [])
  const merged = [...extra, ...rows]
  const seen = new Set<string>()
  const out: ListingRow[] = []
  for (const r of merged) {
    const id = String(r.listing_id ?? r.identifier ?? '')
    if (!id || seen.has(id)) continue
    seen.add(id)
    if (r.listing_id != null && sold[String(r.listing_id)]?.sold) continue
    if (r.active === false || r.sold) continue
    out.push(r)
  }
  return out
}

export async function fetchMarketplaceListings(): Promise<ListingRow[]> {
  const base = import.meta.env.BASE_URL || '/'
  const urls = [
    `${base}data/marketplace_listings.json`,
    `${base}data/listings_index.json`,
    '/xArtists/data/marketplace_listings.json',
    '/xArtists/data/listings_index.json',
  ]
  let rows: ListingRow[] = []
  for (const u of urls) {
    try {
      const r = await fetch(u, { cache: 'no-store' })
      if (!r.ok) continue
      const j = (await r.json()) as { listings?: ListingRow[] }
      rows = j.listings || []
      if (rows.length) break
    } catch {
      /* */
    }
  }
  return applyListingOverlay(rows)
}
