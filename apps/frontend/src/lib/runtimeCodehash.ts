/**
 * SMART-UNLOCK — Mode REAL sans secret Pages si explorer confirme le codeHash.
 * Source: config/contracts.ts (hashes vérifiés 2026-10-01).
 */

import { UNLOCK_JOBS, type UnlockKey } from '../config/contracts'

export type { UnlockKey }

const STORAGE = 'xartists_runtime_codehash_v3'

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
    for (const j of UNLOCK_JOBS) cache[j.key] = true
  }

  await Promise.all(
    UNLOCK_JOBS.map(async j => {
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
