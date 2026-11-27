/**
 * SMART-UNLOCK — Mode REAL sans secret Pages si explorer confirme le codeHash.
 * Fail-closed: live/mainnet never pre-authorizes; missing explorer data = locked.
 * Freshness: a prior true cache cannot reopen after a later failed refresh.
 * Source: config/contracts.ts (hashes vérifiés 2026-10-01).
 */

import { UNLOCK_JOBS, type UnlockKey } from '../config/contracts'

export type { UnlockKey }

type Cache = Partial<Record<UnlockKey, boolean>> & {
  slotBalance?: number
  /** Epoch ms of last successful full refresh write */
  refreshedAt?: number
  /** Monotonic generation; bumps on every refresh attempt */
  generation?: number
  /** Fingerprint of UNLOCK_JOBS addresses/hashes — invalidates on config change */
  jobsFp?: string
}

// Readiness is an in-memory observation, never hydrated from editable browser
// storage. This is a UI gate, not a substitute for on-chain authorization.
let currentCache: Cache = {}
function readCache(): Cache { return currentCache }
function writeCache(c: Cache) {
  currentCache = Object.freeze({...c})
}
function notify(cache: Cache) {
  try {
    window.dispatchEvent(new CustomEvent('xartists-codehash', { detail: {...cache} }))
  } catch { /* non-browser runtime */ }
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
  if (!Number.isFinite(c.refreshedAt) || !c.refreshedAt) return false
  const age = Date.now() - c.refreshedAt
  if (age < 0 || age > RUNTIME_CODEHASH_MAX_AGE_MS) return false
  if (c.jobsFp !== jobsFingerprint()) return false
  return c[key] === true
}

export function runtimeSlotBalance(): number {
  return Number(readCache().slotBalance || 0)
}

export function runtimeUnlockSnapshot(): Cache {
  return {...readCache()}
}

export function runtimeRefreshGeneration(): number {
  return Number(readCache().generation || 0)
}

async function fetchAccount(
  addr: string,
): Promise<{ address?: string; codeHash?: string; code?: string; balance?: string; isPayable?: boolean } | null> {
  if (!addr?.startsWith('erd1')) return null
  // Older mobile WebViews support AbortController but not AbortSignal.timeout.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const r = await fetch(`https://api.multiversx.com/accounts/${addr}`, { cache: 'no-store', redirect: 'error', signal: controller.signal })
    if (!r.ok) return null
    const account = await r.json()
    if (!account || account.address !== addr || typeof account.code !== 'string' || !account.code) return null
    return account
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function matchHash(expected: string, got?: string): boolean {
  if (typeof got !== 'string' || !got || !expected) return false
  return got === expected || got.replace(/=+$/, '') === expected.replace(/=+$/, '')
}

/**
 * Refresh unlocks from on-chain reads only.
 * Always rewrites the whole cache: a previous true cannot survive a failed observation.
 * Concurrent: claim generation first; a late success never overwrites a newer failure.
 */
export async function refreshRuntimeCodehashes(): Promise<Cache> {
  const prev = readCache()
  const generation = Number(prev.generation || 0) + 1
  // Close old observations immediately while new verification is pending.
  writeCache({ generation, jobsFp: jobsFingerprint() })
  notify(readCache())
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
      } else if (j.key === 'marketplace') {
        // MAINNET P0: buyNft and placeBid carry EGLD; an account-level
        // non-payable contract will reject funds even when endpoint and codeHash match.
        // Missing isPayable metadata must also fail closed, not default to true.
        cache.marketplace = okHash && acc.isPayable === true
      } else {
        cache[j.key] = okHash
      }
    }),
  )

  // Discard if a newer refresh already committed (stale success must not erase recent failure)
  const latest = readCache()
  if (Number(latest.generation || 0) > generation) {
    return {...latest}
  }
  writeCache(cache)
  notify(readCache())
  if (cache.slot) {
    console.info('[xArtists] SMART-UNLOCK slot REAL — codeHash OK · bal', cache.slotBalance)
  }
  return {...readCache()}
}
