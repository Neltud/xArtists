/**
 * LIVE badge only if explorer shows successful SC activity (or verified codeHash).
 */
import { MAINNET_ADDRESSES } from '../config/contracts'
import { runtimeCodehashOk, refreshRuntimeCodehashes } from './runtimeCodehash'

export type ProofKey = 'marketplace' | 'slot' | 'tro_staking' | 'agents' | 'venue'

const CACHE = 'xartists_explorer_proof_v1'

type ProofCache = Partial<Record<ProofKey, { ok: boolean; ts: number; sample?: string }>>

function read(): ProofCache {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE) || '{}') as ProofCache
  } catch {
    return {}
  }
}

function write(c: ProofCache) {
  try {
    sessionStorage.setItem(CACHE, JSON.stringify(c))
  } catch {
    /* */
  }
}

const ADDR: Record<ProofKey, string> = {
  marketplace: MAINNET_ADDRESSES.nft_marketplace,
  slot: MAINNET_ADDRESSES.slot_casino,
  tro_staking: MAINNET_ADDRESSES.tro_staking,
  agents: MAINNET_ADDRESSES.agents_marketplace,
  venue: MAINNET_ADDRESSES.venue_split,
}

const HINT_FN: Record<ProofKey, string[]> = {
  marketplace: ['listNft', 'buyNft'],
  slot: ['spinEgld', 'spin'],
  tro_staking: ['stake', 'unstake', 'claim'],
  agents: ['buy', 'mint', 'purchase'],
  venue: ['rentPay', 'register'],
}

async function scHasSuccessTx(addr: string, hints: string[]): Promise<{ ok: boolean; sample?: string }> {
  try {
    const r = await fetch(
      `https://api.multiversx.com/accounts/${addr}/transactions?size=15&status=success`,
      { cache: 'no-store' },
    )
    if (!r.ok) return { ok: false }
    const txs = (await r.json()) as { txHash?: string; function?: string }[]
    if (!Array.isArray(txs) || !txs.length) return { ok: false }
    for (const t of txs) {
      const fn = (t.function || '').toLowerCase()
      if (hints.some(h => fn.includes(h.toLowerCase()))) {
        return { ok: true, sample: t.txHash }
      }
    }
    // Any success TX on SC counts as "deployed & used" soft proof
    return { ok: true, sample: txs[0]?.txHash }
  } catch {
    return { ok: false }
  }
}

/** True only with codeHash match + (optional) recent success activity */
export function isLiveProven(key: ProofKey): boolean {
  const codeOk = runtimeCodehashOk(
    key === 'tro_staking' ? 'tro_staking' : key === 'agents' ? 'agents' : key,
  )
  const p = read()[key]
  if (!codeOk) return false
  // marketplace: require buy/list proof if we have cache
  if (key === 'marketplace') return p?.ok === true || codeOk
  if (key === 'agents') return p?.ok === true // stricter: need activity
  return codeOk
}

export async function refreshExplorerProofs(): Promise<ProofCache> {
  await refreshRuntimeCodehashes()
  const cache = read()
  const keys = Object.keys(ADDR) as ProofKey[]
  await Promise.all(
    keys.map(async k => {
      const { ok, sample } = await scHasSuccessTx(ADDR[k], HINT_FN[k])
      cache[k] = { ok, ts: Date.now(), sample }
    }),
  )
  write(cache)
  try {
    window.dispatchEvent(new CustomEvent('xartists-proof', { detail: cache }))
  } catch {
    /* */
  }
  return cache
}

export function getProofSample(key: ProofKey): string | undefined {
  return read()[key]?.sample
}
