/**
 * Aggregateur liquidité & farming $TRO — xExchange + OneDex.
 * Lectures API publiques MultiversX (paper-safe). Pas de TX auto.
 */
import {
  TRO_TOKEN_ID,
  TRO_YIELD_POOLS,
  TRO_VOTE_POOLS,
  type TroPool,
  type TroDex,
  DEX_LABEL,
} from '../../config/troPools'
import { fetchMexTroPairs, fetchPoolAccountTvl, matchLive, type PoolLive } from '../../lib/troPoolStats'

const API = 'https://api.multiversx.com'
const TTL_MS = 45_000

export type TroFarmMetric = {
  poolId: string
  dex: TroDex
  pair: string
  role: TroPool['role']
  address: string
  lpTokenId?: string
  swapUrl: string
  dexscreener?: string
  /** TVL approximatif USD */
  tvlUsd: number | null
  volume24h: number | null
  /** APR indicatif (null si non dispo API) */
  aprPct: number | null
  state: string
  source: string
}

export type TroLiquiditySnapshot = {
  tokenId: string
  egldUsd: number | null
  troUsd: number | null
  farms: TroFarmMetric[]
  totalTvlUsd: number
  fetchedAt: string
  notes: string[]
}

const mem = new Map<string, { at: number; data: unknown }>()

async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = mem.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data as T
  const data = await fn()
  mem.set(key, { at: Date.now(), data })
  return data
}

async function fetchEgldUsd(): Promise<number | null> {
  try {
    const r = await fetch(`${API}/economics`, { cache: 'no-store' })
    if (!r.ok) return null
    const j = (await r.json()) as { price?: number }
    return typeof j.price === 'number' && j.price > 0 ? j.price : null
  } catch {
    return null
  }
}

async function fetchTroUsd(): Promise<number | null> {
  for (const id of [TRO_TOKEN_ID, 'TRO-3bc587']) {
    try {
      const r = await fetch(`${API}/tokens/${id}`, { cache: 'no-store' })
      if (!r.ok) continue
      const j = (await r.json()) as { price?: number }
      const p = Number(j.price)
      if (Number.isFinite(p) && p > 0) return p
    } catch {
      /* next */
    }
  }
  return null
}

/**
 * Best-effort farm APR from xExchange mex farms endpoint (if present).
 * OneDex has no public APR API — returns null.
 */
async function fetchMexFarmAprByLp(lpTokenId?: string): Promise<number | null> {
  if (!lpTokenId) return null
  try {
    const r = await fetch(`${API}/mex/farms?size=200`, { cache: 'no-store' })
    if (!r.ok) return null
    const list = (await r.json()) as Array<{
      farmingToken?: { identifier?: string }
      farmToken?: { identifier?: string }
      apr?: number
      aprYearly?: number
      estimatedApr?: number
    }>
    if (!Array.isArray(list)) return null
    const hit = list.find(f => {
      const id =
        f.farmingToken?.identifier ||
        f.farmToken?.identifier ||
        ''
      return id === lpTokenId || id.includes(lpTokenId.split('-')[0] || '___')
    })
    if (!hit) return null
    const apr = hit.aprYearly ?? hit.estimatedApr ?? hit.apr
    return typeof apr === 'number' && Number.isFinite(apr) ? apr * (apr < 2 ? 100 : 1) : null
  } catch {
    return null
  }
}

function uniquePools(): TroPool[] {
  const map = new Map<string, TroPool>()
  for (const p of [...TRO_YIELD_POOLS, ...TRO_VOTE_POOLS]) {
    if (!map.has(p.id)) map.set(p.id, p)
  }
  return Array.from(map.values())
}

/**
 * Snapshot liquidité $TRO : TVL / volume / APR (quand dispo) pour xExchange + OneDex.
 */
export async function fetchTroLiquiditySnapshot(): Promise<TroLiquiditySnapshot> {
  return cached('tro-liq-snap', async () => {
    const notes: string[] = []
    const [egldUsd, troUsd, mexLives] = await Promise.all([
      fetchEgldUsd(),
      fetchTroUsd(),
      fetchMexTroPairs(),
    ])

    const pools = uniquePools()
    const farms: TroFarmMetric[] = []

    for (const pool of pools) {
      const live: PoolLive | undefined = matchLive(pool, mexLives)
      let tvlUsd = live?.tvlUsd ?? null
      let volume24h = live?.volume24h ?? null
      let state = live?.state || 'unknown'
      let source = live ? 'api.multiversx.com/mex/pairs' : 'static+account'

      if (tvlUsd == null && pool.address && egldUsd) {
        const approx = await fetchPoolAccountTvl(pool.address, egldUsd)
        if (approx != null) {
          tvlUsd = approx
          source = 'account-balance×2'
          notes.push(`${pool.id}: TVL approx (balance pool ×2)`)
        }
      }

      let aprPct: number | null = null
      if (pool.dex === 'xexchange') {
        aprPct = await fetchMexFarmAprByLp(pool.lpTokenId)
        if (aprPct == null) notes.push(`${pool.id}: APR xExchange non exposé`)
      } else if (pool.dex === 'onedex') {
        notes.push(`${pool.id}: OneDex — APR via UI dApp uniquement`)
      }

      farms.push({
        poolId: pool.id,
        dex: pool.dex,
        pair: pool.pair,
        role: pool.role,
        address: pool.address,
        lpTokenId: pool.lpTokenId || live?.lpTokenId,
        swapUrl: pool.swapUrl,
        dexscreener: pool.dexscreener,
        tvlUsd,
        volume24h,
        aprPct,
        state,
        source,
      })
    }

    const totalTvlUsd = farms.reduce((s, f) => s + (f.tvlUsd || 0), 0)

    return {
      tokenId: TRO_TOKEN_ID,
      egldUsd,
      troUsd,
      farms,
      totalTvlUsd,
      fetchedAt: new Date().toISOString(),
      notes,
    }
  })
}

/** Farms filtrées OneDex uniquement (pour panneau DeFi). */
export async function fetchOneDexTroFarms(): Promise<TroFarmMetric[]> {
  const snap = await fetchTroLiquiditySnapshot()
  return snap.farms.filter(f => f.dex === 'onedex')
}

/** Farms xExchange $TRO. */
export async function fetchXExchangeTroFarms(): Promise<TroFarmMetric[]> {
  const snap = await fetchTroLiquiditySnapshot()
  return snap.farms.filter(f => f.dex === 'xexchange')
}

export function formatTvl(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return '—'
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}k`
  return `$${v.toFixed(0)}`
}

export function formatApr(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return 'n/a'
  return `${v.toFixed(1)}%`
}

export { DEX_LABEL }
