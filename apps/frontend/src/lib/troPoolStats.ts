/** Live TVL / meta for TRO pools via MultiversX API */
import type { TroPool } from '../config/troPools'

const API = 'https://api.multiversx.com'

export type PoolLive = {
  id: string
  tvlUsd: number | null
  volume24h: number | null
  state: string
  lpTokenId?: string
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
      }))
  } catch {
    return []
  }
}

/** Approx TVL from account EGLD*2 for non-mex pools */
export async function fetchPoolAccountTvl(address: string, egldPrice: number): Promise<number | null> {
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
  return lives.find(l => pool.address && l.id.includes(pool.address.slice(0, 12)))
}
