/**
 * SMART-UNLOCK — Mode REAL sans secret Pages si explorer confirme le codeHash.
 * Fail-closed: live/mainnet never pre-authorizes; missing explorer data = locked.
 * Source: config/contracts.ts (hashes vérifiés 2026-10-01).
 */

import { UNLOCK_JOBS, type UnlockKey } from '../config/contracts'

export type { UnlockKey }

const STORAGE = 'xartists_runtime_codehash_v5'

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

export function runtimeUnlockSnapshot(): Cache {
  return readCache()
}

async function fetchAccount(
  addr: string,
): Promise<{ codeHash?: string; balance?: string; isPayable?: boolean } | null> {
  if (!addr?.startsWith('erd1')) return null
  try {
    const r = await fetch(`https://api.multiversx.com/accounts/${addr}`, { cache: 'no-store' })
    if (!r.ok) return null
    return (await r.json()) as { codeHash?: string; balance?: string; isPayable?: boolean }
  } catch {
    return null
  }
}

function matchHash(expected: string, got?: string): boolean {
  if (!got || !expected) return false
  return got === expected || got.replace(/=+$/, '') === expected.replace(/=+$/, '')
}

/**
 * Refresh unlocks from on-chain reads only.
 * Never sets keys to true because VITE_LIVE_MODE / mainnet is set.
 * If explorer fetch fails for a job, that key is forced false (fail-closed).
 */
export async function refreshRuntimeCodehashes(): Promise<Cache> {
  const cache: Cache = {}

  await Promise.all(
    UNLOCK_JOBS.map(async j => {
      const acc = await fetchAccount(j.addr)
      if (!acc) {
        cache[j.key] = false
        return
      }
      const okHash = matchHash(j.expected, acc.codeHash)
      if (j.key === 'slot') {
        const bal = Number(acc.balance || 0) / 1e18
        cache.slotBalance = bal
        // Hash match is not enough: isPayable=false rejects spinEgld.
        cache.slot = okHash && acc.isPayable === true
      } else {
        cache[j.key] = okHash
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
