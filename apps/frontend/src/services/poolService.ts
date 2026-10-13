/**
 * Lecture pools $TRO / EGLD — xExchange + API MultiversX.
 * Cache localStorage TTL 300s · fallback gracieux sur 429.
 */
import { TRO_TOKEN_ID } from '../config/troPools'
import { fetchMexTroPairs, fetchPoolAccountTvl, type PoolLive } from '../lib/troPoolStats'

const CACHE_KEY = 'xartists_pool_tro_egld_v1'
const TTL_MS = 300_000

export type TroEgldPoolSnapshot = {
  pair: string
  troId: string
  tvlUsd: number | null
  volume24h: number | null
  priceTroInEgld: number | null
  priceTroUsd: number | null
  egldUsd: number | null
  depthHint: number | null
  source: 'xexchange' | 'cache' | 'fallback'
  updatedAt: number
  stale: boolean
}

type CacheBlob = { at: number; data: TroEgldPoolSnapshot }

function readCache(): TroEgldPoolSnapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const j = JSON.parse(raw) as CacheBlob
    if (!j?.data) return null
    const age = Date.now() - (j.at || 0)
    return { ...j.data, stale: age > TTL_MS, source: age > TTL_MS ? 'cache' : j.data.source }
  } catch {
    return null
  }
}

function writeCache(data: TroEgldPoolSnapshot) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }))
  } catch {
    /* */
  }
}

async function fetchEgldUsd(): Promise<number | null> {
  try {
    const r = await fetch('https://api.multiversx.com/economics', { cache: 'no-store' })
    if (!r.ok) return null
    const j = (await r.json()) as { price?: number }
    return typeof j.price === 'number' ? j.price : null
  } catch {
    return null
  }
}

/** Snapshot agrégé TRO/EGLD pour écran YIELD holo. */
export async function fetchTroEgldPool(): Promise<TroEgldPoolSnapshot> {
  const cached = readCache()
  try {
    const [pairs, egldUsd] = await Promise.all([fetchMexTroPairs(), fetchEgldUsd()])
    const best =
      pairs.find(p => (p.tvlUsd || 0) > 0) ||
      pairs[0] ||
      ({ id: 'tro-egld', tvlUsd: null, volume24h: null, state: 'unknown' } as PoolLive)

    let tvl = best.tvlUsd
    if ((tvl == null || tvl === 0) && best.address) {
      tvl = await fetchPoolAccountTvl(best.address)
    }

    // Ratio approximatif via economics + tvl heuristic (pas un oracle de trading)
    const priceTroUsd =
      tvl != null && tvl > 0 ? Math.min(tvl / 1e6, 5) : cached?.priceTroUsd ?? null
    const priceTroInEgld =
      priceTroUsd != null && egldUsd
        ? priceTroUsd / egldUsd
        : cached?.priceTroInEgld ?? null

    const snap: TroEgldPoolSnapshot = {
      pair: 'TRO/EGLD',
      troId: TRO_TOKEN_ID || 'TRO-94c925',
      tvlUsd: tvl,
      volume24h: best.volume24h,
      priceTroInEgld,
      priceTroUsd,
      egldUsd,
      depthHint: tvl != null ? tvl * 0.02 : null,
      source: 'xexchange',
      updatedAt: Date.now(),
      stale: false,
    }
    writeCache(snap)
    return snap
  } catch (e) {
    const status = (e as { status?: number })?.status
    if (cached) {
      return { ...cached, stale: true, source: 'cache' }
    }
    return {
      pair: 'TRO/EGLD',
      troId: TRO_TOKEN_ID || 'TRO-94c925',
      tvlUsd: null,
      volume24h: null,
      priceTroInEgld: null,
      priceTroUsd: null,
      egldUsd: null,
      depthHint: null,
      source: 'fallback',
      updatedAt: Date.now(),
      stale: true,
    }
  }
}

export function formatUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}k`
  return `$${n.toFixed(2)}`
}
