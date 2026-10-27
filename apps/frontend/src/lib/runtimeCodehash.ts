/**
 * SMART-UNLOCK — Mode REAL sans secret Pages si explorer confirme le codeHash.
 * Fail-closed: live/mainnet never pre-authorizes; missing explorer data = locked.
 * Freshness: a prior true cache cannot reopen after a later failed refresh.
 * Source: config/contracts.ts (hashes vérifiés 2026-10-01).
 */

import { UNLOCK_JOBS, type UnlockKey } from '../config/contracts'

export type { UnlockKey }

const STORAGE = 'xartists_runtime_codehash_v6'

type Cache = Partial<Record<UnlockKey, boolean>> & {
  slotBalance?: number
  /** Epoch ms of last successful full refresh write */
  refreshedAt?: number
  /** Monotonic generation; bumps on every refresh attempt */
  generation?: number
  /** Fingerprint of UNLOCK_JOBS addresses/hashes — invalidates on config change */
  jobsFp?: string
}

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

/** Max age for a positive observation (ms). Stale cache never opens gates. */
export const RUNTIME_CODEHASH_MAX_AGE_MS = 5 * 60 * 1000

function jobsFingerprint(): string {
  return UNLOCK_JOBS.map(j => `${j.key}:${j.addr}:${j.expected}`).join('|')
}

/**
 * True only when this key was observed true on a fresh refresh for the current job set.
 * Missing refresh / false / absent / stale / address change → not ok (fail-closed).
 */
export function runtimeCodehashOk(key: UnlockKey): boolean {
  const c = readCache()
  if (!c.refreshedAt || typeof c.refreshedAt !== 'number') return false
  if (Date.now() - c.refreshedAt > RUNTIME_CODEHASH_MAX_AGE_MS) return false
  if (c.jobsFp && c.jobsFp !== jobsFingerprint()) return false
  return c[key] === true
}

export function runtimeSlotBalance(): number {
  return Number(readCache().slotBalance || 0)
}

export function runtimeUnlockSnapshot(): Cache {
  return readCache()
}

export function runtimeRefreshGeneration(): number {
  return Number(readCache().generation || 0)
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
 * Always rewrites the whole cache: a previous true cannot survive a failed observation.
 */
export async function refreshRuntimeCodehashes(): Promise<Cache> {
  const prev = readCache()
  const generation = Number(prev.generation || 0) + 1
  const cache: Cache = { generation, refreshedAt: Date.now(), jobsFp: jobsFingerprint() }

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
