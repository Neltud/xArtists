/** Live TVL / meta for TRO pools via MultiversX API */
import type { TroPool } from '../config/troPools'

const API = 'https://api.multiversx.com'

export type PoolLive = {
  id: string
  tvlUsd: number | null
  volume24h: number | null
  state: string
  lpTokenId?: string
  address?: string
}

export async function fetchMexTroPairs(): Promise<PoolLive[]> {
  try {
    const r = await fetch(`${API}/mex/pairs?size=200`, { cache: 'no-store' })
    if (!r.ok) return []
    const list = (await r.json()) as Array<{
      id?: string
      address?: string
      totalValue?: number
      volume24h?: number
      state?: string
      symbol?: string
    }>
    return (Array.isArray(list) ? list : [])
      .filter(p => {
        const id = (p.id || p.symbol || '').toUpperCase()
        return id.startsWith('TRO') && !id.startsWith('TROLL')
      })
      .map(p => ({
        id: p.id || p.address || '',
        tvlUsd: typeof p.totalValue === 'number' ? p.totalValue : null,
        volume24h: typeof p.volume24h === 'number' ? p.volume24h : null,
        state: p.state || 'unknown',
        lpTokenId: p.id,
        address: p.address,
      }))
  } catch {
    return []
  }
}

/** Approx TVL from account EGLD*2 for non-mex pools (OneDex / JEx) */
export async function fetchPoolAccountTvl(
  address: string,
  egldPrice: number
): Promise<number | null> {
  if (!address) return null
  try {
    const r = await fetch(`${API}/accounts/${address}`, { cache: 'no-store' })
    if (!r.ok) return null
    const j = (await r.json()) as { balance?: string }
    const egld = Number(j.balance || 0) / 1e18
    if (!egldPrice || egld <= 0) return null
    return egld * egldPrice * 2
  } catch {
    return null
  }
}

export function matchLive(pool: TroPool, lives: PoolLive[]): PoolLive | undefined {
  if (pool.lpTokenId) {
    const byId = lives.find(l => l.lpTokenId === pool.lpTokenId || l.id === pool.lpTokenId)
    if (byId) return byId
  }
  if (pool.address) {
    const byAddr = lives.find(
      l => l.address === pool.address || (l.id && pool.address.includes(l.id.slice(0, 16)))
    )
    if (byAddr) return byAddr
  }
  return undefined
}

/** Aggregate TVL for vote-power display */
export async function loadVotePoolTvls(
  pools: TroPool[],
  egldPrice: number
): Promise<Record<string, number | null>> {
  const mex = await fetchMexTroPairs()
  const out: Record<string, number | null> = {}
  await Promise.all(
    pools.map(async p => {
      const live = matchLive(p, mex)
      if (live?.tvlUsd != null) {
        out[p.id] = live.tvlUsd
        return
      }
      if (p.address) {
        out[p.id] = await fetchPoolAccountTvl(p.address, egldPrice)
      } else {
        out[p.id] = null
      }
    })
  )
  return out
}
