/**
 * SMART-UNLOCK — Mode REAL sans secret Pages si explorer confirme.
 * Priorité: VITE_LIVE_MODE → codeHash match → (slot) balance > 0.
 */

import {
  SLOT_CASINO_ADDRESS,
  SLOT_CASINO_CODEHASH_MAINNET,
  MARKETPLACE_ADDRESS,
  TRO_STAKING_ADDRESS,
  TRO_STAKING_CODEHASH_MAINNET,
  VENUE_SC_ADDRESS,
  VENUE_SC_CODEHASH_MAINNET,
} from '../config/scStatus'

const STORAGE = 'xartists_runtime_codehash_v2'

export type UnlockKey = 'slot' | 'marketplace' | 'tro_staking' | 'venue'

type Cache = Partial<Record<UnlockKey, boolean>> & { slotBalance?: number }

function readCache(): Cache {
  try {
    const raw = sessionStorage.getItem(STORAGE)
    if (!raw) return {}
    return JSON.parse(raw) as Cache
  } catch {
    return {}
  }
}

function writeCache(c: Cache) {
  try {
    sessionStorage.setItem(STORAGE, JSON.stringify(c))
  } catch {
    /* */
  }
}

export function runtimeCodehashOk(key: UnlockKey): boolean {
  return readCache()[key] === true
}

export function runtimeSlotBalance(): number {
  return Number(readCache().slotBalance || 0)
}

async function fetchAccount(addr: string): Promise<{ codeHash?: string; balance?: string } | null> {
  if (!addr?.startsWith('erd1')) return null
  try {
    const r = await fetch(`https://api.multiversx.com/accounts/${addr}`, { cache: 'no-store' })
    if (!r.ok) return null
    return (await r.json()) as { codeHash?: string; balance?: string }
  } catch {
    return null
  }
}

function matchHash(expected: string, got?: string): boolean {
  if (!got || !expected) return false
  return got === expected || got.replace(/=+$/, '') === expected.replace(/=+$/, '')
}

function envLiveMode(): boolean {
  try {
    const e = (import.meta as { env?: Record<string, string> }).env || {}
    if (e.VITE_LIVE_MODE === '1' || e.VITE_LIVE_MODE === 'true') return true
    const m = String(e.VITE_APP_MODE || '').toLowerCase()
    return m === 'live' || m === 'mainnet'
  } catch {
    return false
  }
}

export async function refreshRuntimeCodehashes(): Promise<Cache> {
  const cache = readCache()
  if (envLiveMode()) {
    cache.slot = true
    cache.marketplace = true
    cache.tro_staking = true
    cache.venue = true
  }

  const jobs: { key: UnlockKey; addr: string; expected: string }[] = [
    { key: 'slot', addr: SLOT_CASINO_ADDRESS, expected: SLOT_CASINO_CODEHASH_MAINNET },
    {
      key: 'marketplace',
      addr: MARKETPLACE_ADDRESS,
      expected: '8TTszCmNyPZXjrzQ/fSKXX8+QzW7wFtCfdmiKsZBgFc=',
    },
    { key: 'tro_staking', addr: TRO_STAKING_ADDRESS, expected: TRO_STAKING_CODEHASH_MAINNET },
    { key: 'venue', addr: VENUE_SC_ADDRESS, expected: VENUE_SC_CODEHASH_MAINNET },
  ]

  await Promise.all(
    jobs.map(async j => {
      const acc = await fetchAccount(j.addr)
      if (!acc) return
      const okHash = matchHash(j.expected, acc.codeHash)
      if (j.key === 'slot') {
        const bal = Number(acc.balance || 0) / 1e18
        cache.slotBalance = bal
        if (okHash) cache.slot = true
      } else if (okHash) {
        cache[j.key] = true
      }
    }),
  )

  writeCache(cache)
  try {
    window.dispatchEvent(new CustomEvent('xartists-codehash', { detail: cache }))
  } catch {
    /* */
  }
  if (cache.slot) {
    console.info('[xArtists] SMART-UNLOCK slot REAL — codeHash OK · bal', cache.slotBalance)
  }
  return cache
}
