/**
 * Frameit / Xoxno secondary-market indexing for agent pack collections.
 * Floor + depth from MultiversX API; trade deep-links to Frameit & Xoxno.
 * Collections: XAIPLS-2cf72b · XAIYLD-987e24 · XAISNT-3d8a6b
 */

import { DEFAULT_PACK_COLLECTIONS } from '../config/packNftMetadata'

const API =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_MVX_API?: string } }).env?.VITE_MVX_API) ||
  'https://api.multiversx.com'

export type PackMarketId = 'pulse' | 'yield' | 'sentinel'

export type CollectionMarketSnapshot = {
  packId: PackMarketId
  collection: string
  name: string
  nftsCount: number
  holderCount: number
  /** Best-effort floor in EGLD (from active auctions / last sale heuristics). null if illiquid */
  floorEgld: number | null
  lastSaleEgld: number | null
  frameitUrl: string
  xoxnoUrl: string
  fetchedAt: number
}

const PACK_META: { id: PackMarketId; collection: string; label: string }[] = [
  { id: 'pulse', collection: DEFAULT_PACK_COLLECTIONS.PULSE, label: 'Pulse' },
  { id: 'yield', collection: DEFAULT_PACK_COLLECTIONS.YIELD, label: 'Yield' },
  { id: 'sentinel', collection: DEFAULT_PACK_COLLECTIONS.SENTINEL, label: 'Sentinel' },
]

function frameitCollectionUrl(collection: string): string {
  return `https://www.frameit.gg/marketplace/${encodeURIComponent(collection)}`
}

function xoxnoCollectionUrl(collection: string): string {
  return `https://xoxno.com/collection/${encodeURIComponent(collection)}`
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${String(API).replace(/\/$/, '')}${path}`, { cache: 'no-store' })
    if (!r.ok) return null
    return (await r.json()) as T
  } catch {
    return null
  }
}

/** Parse atomic EGLD string/number → float EGLD */
function atomicToEgld(v: unknown): number | null {
  if (v == null) return null
  try {
    const n = typeof v === 'string' ? BigInt(v) : BigInt(Math.floor(Number(v)))
    if (n <= 0n) return null
    return Number(n) / 1e18
  } catch {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? n / (n > 1e12 ? 1e18 : 1) : null
  }
}

type CollectionDto = {
  collection?: string
  name?: string
  nftsCount?: number
  holderCount?: number
}

type NftDto = {
  identifier?: string
  saleInfo?: { minBid?: string; maxBid?: string; currentBid?: string }
  price?: string | number
  lastSale?: { price?: string | number }
}

const cache = new Map<string, CollectionMarketSnapshot>()
const TTL_MS = 60_000

export async function fetchCollectionMarket(
  packId: PackMarketId,
  force = false,
): Promise<CollectionMarketSnapshot | null> {
  const meta = PACK_META.find(p => p.id === packId)
  if (!meta) return null
  const hit = cache.get(packId)
  if (!force && hit && Date.now() - hit.fetchedAt < TTL_MS) return hit

  const col = await fetchJson<CollectionDto>(`/collections/${meta.collection}`)
  const nfts = await fetchJson<NftDto[]>(
    `/collections/${meta.collection}/nfts?size=25&withSupply=true`,
  )

  let floorEgld: number | null = null
  let lastSaleEgld: number | null = null
  if (Array.isArray(nfts)) {
    const bids: number[] = []
    for (const n of nfts) {
      const minB = atomicToEgld(n.saleInfo?.minBid ?? n.saleInfo?.currentBid)
      if (minB != null) bids.push(minB)
      const ls = atomicToEgld(n.lastSale?.price ?? n.price)
      if (ls != null) {
        lastSaleEgld = lastSaleEgld == null ? ls : Math.min(lastSaleEgld, ls)
      }
    }
    if (bids.length) floorEgld = Math.min(...bids)
  }

  const snap: CollectionMarketSnapshot = {
    packId,
    collection: meta.collection,
    name: col?.name || meta.label,
    nftsCount: Number(col?.nftsCount ?? (Array.isArray(nfts) ? nfts.length : 0)) || 0,
    holderCount: Number(col?.holderCount ?? 0) || 0,
    floorEgld,
    lastSaleEgld,
    frameitUrl: frameitCollectionUrl(meta.collection),
    xoxnoUrl: xoxnoCollectionUrl(meta.collection),
    fetchedAt: Date.now(),
  }
  cache.set(packId, snap)
  return snap
}

export async function fetchAllPackMarkets(force = false): Promise<CollectionMarketSnapshot[]> {
  const out: CollectionMarketSnapshot[] = []
  for (const p of PACK_META) {
    const s = await fetchCollectionMarket(p.id, force)
    if (s) out.push(s)
  }
  return out
}

export function formatFloor(egld: number | null): string {
  if (egld == null) return '—'
  if (egld >= 10) return `${egld.toFixed(1)} EGLD`
  if (egld >= 1) return `${egld.toFixed(2)} EGLD`
  return `${egld.toFixed(3)} EGLD`
}

export { PACK_META, frameitCollectionUrl, xoxnoCollectionUrl }
