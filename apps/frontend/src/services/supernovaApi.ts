/**
 * MultiversX network stats — Supernova-era cadence (refreshRate ~600 ms).
 * https://api.multiversx.com/stats
 */

export type NetworkStats = {
  shards: number
  blocks: number
  accounts: number
  transactions: number
  scResults: number
  refreshRate: number
  epoch: number
  roundsPassed: number
  roundsPerEpoch: number
  fetchedAt: number
}

const API =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_MVX_API?: string } }).env?.VITE_MVX_API) ||
  'https://api.multiversx.com'

let cache: NetworkStats | null = null
let inflight: Promise<NetworkStats | null> | null = null

export async function fetchNetworkStats(force = false): Promise<NetworkStats | null> {
  if (!force && cache && Date.now() - cache.fetchedAt < 15_000) return cache
  if (inflight) return inflight

  inflight = (async () => {
    try {
      const r = await fetch(`${String(API).replace(/\/$/, '')}/stats`, { cache: 'no-store' })
      if (!r.ok) return cache
      const j = await r.json()
      const stats: NetworkStats = {
        shards: Number(j.shards ?? 0),
        blocks: Number(j.blocks ?? 0),
        accounts: Number(j.accounts ?? 0),
        transactions: Number(j.transactions ?? 0),
        scResults: Number(j.scResults ?? 0),
        refreshRate: Number(j.refreshRate ?? 6000),
        epoch: Number(j.epoch ?? 0),
        roundsPassed: Number(j.roundsPassed ?? 0),
        roundsPerEpoch: Number(j.roundsPerEpoch ?? 0),
        fetchedAt: Date.now(),
      }
      cache = stats
      return stats
    } catch {
      return cache
    } finally {
      inflight = null
    }
  })()

  return inflight
}

export function isSupernovaCadence(stats: NetworkStats | null): boolean {
  if (!stats) return true // post-activation default
  return stats.refreshRate > 0 && stats.refreshRate <= 1000
}

export function supernovaLabel(stats: NetworkStats | null): string {
  if (!stats) return 'Supernova · probing…'
  const ms = stats.refreshRate
  return `Supernova · ${ms} ms · epoch ${stats.epoch}`
}
