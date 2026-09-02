/**
 * Sprint 2 — Liquidité MultiversX (lectures + taux).
 * Sources: API publique MVX / xExchange-style pools (paper-safe).
 */

const API = 'https://api.multiversx.com'

export interface PoolSnapshot {
  pair: string
  base: string
  quote: string
  /** Approximate mid price: 1 base = price quote */
  price: number
  liquidityUsd?: number
  source: string
  ts: string
}

export interface PriceFeed {
  symbol: string
  /** USD */
  usd: number
  source: string
  ts: string
}

/** Cache mémoire courte */
const cache = new Map<string, { at: number; data: unknown }>()
const TTL_MS = 30_000

async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data as T
  const data = await fn()
  cache.set(key, { at: Date.now(), data })
  return data
}

/** EGLD price from MVX economics endpoint (best effort). */
export async function fetchEgldUsd(): Promise<PriceFeed> {
  return cached('egld-usd', async () => {
    try {
      const r = await fetch(`${API}/economics`, { cache: 'no-store' })
      if (r.ok) {
        const j = (await r.json()) as { price?: number }
        if (typeof j.price === 'number' && j.price > 0) {
          return {
            symbol: 'EGLD',
            usd: j.price,
            source: 'api.multiversx.com/economics',
            ts: new Date().toISOString(),
          }
        }
      }
    } catch {
      /* fallback */
    }
    return {
      symbol: 'EGLD',
      usd: 0,
      source: 'unavailable',
      ts: new Date().toISOString(),
    }
  })
}

/**
 * Pools de référence (statique + enrichment prix EGLD).
 * Les pools xExchange on-chain réelles restent via liens externes / data repo.
 */
export async function listReferencePools(): Promise<PoolSnapshot[]> {
  const egld = await fetchEgldUsd()
  const ts = new Date().toISOString()
  const egldUsd = egld.usd || 1

  // Ratios de référence paper (à remplacer par lecture pair contracts quand SC branchés)
  const refs: { pair: string; base: string; quote: string; price: number; liq?: number }[] = [
    { pair: 'EGLD/USDC', base: 'EGLD', quote: 'USDC', price: egldUsd, liq: 1_000_000 },
    { pair: 'TRO/EGLD', base: 'TRO-94c925', quote: 'EGLD', price: 0.00001, liq: 50_000 },
    { pair: 'TRO/USDC', base: 'TRO-94c925', quote: 'USDC', price: 0.00001 * egldUsd, liq: 40_000 },
    { pair: 'MEX/EGLD', base: 'MEX-455c57', quote: 'EGLD', price: 0.000001, liq: 200_000 },
  ]

  return refs.map(r => ({
    pair: r.pair,
    base: r.base,
    quote: r.quote,
    price: r.price,
    liquidityUsd: r.liq,
    source: r.base.startsWith('EGLD') ? egld.source : 'reference-book',
    ts,
  }))
}

export function exchangeRate(
  pools: PoolSnapshot[],
  assetFrom: string,
  assetTo: string
): { rate: number; pool?: PoolSnapshot } | null {
  const a = assetFrom.toUpperCase().replace('-94C925', '-94c925')
  const b = assetTo.toUpperCase()
  const norm = (s: string) =>
    s === 'TRO' || s.includes('TRO') ? 'TRO' : s === 'EGLD' || s === 'WEGLD' ? 'EGLD' : s

  const from = norm(a)
  const to = norm(b)

  for (const p of pools) {
    const base = norm(p.base)
    const quote = norm(p.quote)
    if (base === from && quote === to) return { rate: p.price, pool: p }
    if (base === to && quote === from && p.price > 0) return { rate: 1 / p.price, pool: p }
  }
  // via EGLD
  const toEgld = pools.find(p => norm(p.base) === from && norm(p.quote) === 'EGLD')
  const fromEgld = pools.find(p => norm(p.base) === to && norm(p.quote) === 'EGLD')
  if (toEgld && fromEgld && fromEgld.price > 0) {
    return { rate: toEgld.price / fromEgld.price, pool: toEgld }
  }
  return null
}

export const liquidityService = {
  fetchEgldUsd,
  listReferencePools,
  exchangeRate,
}
