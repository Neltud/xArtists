/**
 * Runtime CODEHASH verify via MultiversX API.
 * Unlocks TX when explorer codeHash matches contracts.json expected —
 * even if Pages secret VITE_*_CODEHASH_OK was missing at build.
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

const STORAGE = 'xartists_runtime_codehash_v1'

type Key = 'slot' | 'marketplace' | 'tro_staking' | 'venue'

type Cache = Partial<Record<Key, boolean>>

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

export function runtimeCodehashOk(key: Key): boolean {
  return readCache()[key] === true
}

async function fetchCodeHash(addr: string): Promise<string | null> {
  if (!addr?.startsWith('erd1')) return null
  try {
    const r = await fetch(`https://api.multiversx.com/accounts/${addr}`, { cache: 'no-store' })
    if (!r.ok) return null
    const j = (await r.json()) as { codeHash?: string }
    return j.codeHash || null
  } catch {
    return null
  }
}

function match(expected: string, got: string | null): boolean {
  if (!got || !expected) return false
  return got.replace(/=+$/, '') === expected.replace(/=+$/, '') || got === expected
}

/** Call once on app boot — best-effort */
export async function refreshRuntimeCodehashes(): Promise<Cache> {
  const cache = readCache()

  const jobs: { key: Key; addr: string; expected: string }[] = [
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
      if (!j.addr || !j.expected) return
      const got = await fetchCodeHash(j.addr)
      if (match(j.expected, got)) cache[j.key] = true
    }),
  )

  writeCache(cache)
  try {
    window.dispatchEvent(new CustomEvent('xartists-codehash', { detail: cache }))
  } catch {
    /* */
  }
  return cache
}
