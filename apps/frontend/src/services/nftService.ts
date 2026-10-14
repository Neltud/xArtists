/**
 * Interrogation MultiversX — NFTs Agent Packs (1 pack = 1 ESDT dans le wallet).
 * GET /accounts/{address}/nfts?collections=...
 */
import { PACK_COLLECTIONS } from '../config/packNftMetadata'
import type { PackId as AgentPackId } from '../config/agentPacks'
import {
  matchOnChainPacks,
  ownedPackIdsFromChain,
  type OnChainPackHit,
} from '../lib/nftPacks'

const API = 'https://api.multiversx.com'

export type MxNft = {
  identifier: string
  collection?: string
  name?: string
  nonce?: number
  url?: string
  media?: { url?: string }[]
  attributes?: string
  tags?: string[]
}

/** Tickers collection packs (env override + defaults xAiAx / xAiAy / xAiAs). */
export function packCollectionTickers(): string[] {
  const fromEnv = (() => {
    try {
      const raw = (import.meta.env.VITE_AGENT_PACK_COLLECTIONS as string | undefined) || ''
      return raw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    } catch {
      return [] as string[]
    }
  })()
  const defaults = [
    PACK_COLLECTIONS.pulse.ticker,
    PACK_COLLECTIONS.yield.ticker,
    PACK_COLLECTIONS.sentinel.ticker,
  ]
  return [...new Set([...fromEnv, ...defaults])]
}

export function tickerToPackId(ticker: string): AgentPackId | null {
  const t = ticker.toUpperCase()
  if (t === PACK_COLLECTIONS.pulse.ticker.toUpperCase() || t.includes('PULSE') || t === 'XAIAX')
    return 'pulse'
  if (t === PACK_COLLECTIONS.yield.ticker.toUpperCase() || t.includes('YIELD') || t === 'XAIAY')
    return 'yield'
  if (
    t === PACK_COLLECTIONS.sentinel.ticker.toUpperCase() ||
    t.includes('SENTINEL') ||
    t === 'XAIAS'
  )
    return 'sentinel'
  return null
}

/**
 * Fetch NFTs for an address, optionally filtered by pack collections.
 */
export async function fetchAccountNfts(
  address: string,
  opts?: { collections?: string[]; size?: number },
): Promise<MxNft[]> {
  if (!address?.startsWith('erd1')) return []
  const size = opts?.size ?? 100
  const cols = opts?.collections?.length ? opts.collections : packCollectionTickers()
  const qs = new URLSearchParams({
    size: String(size),
    type: 'NonFungibleESDT,SemiFungibleESDT',
  })
  if (cols.length) qs.set('collections', cols.join(','))

  try {
    const r = await fetch(`${API}/accounts/${address}/nfts?${qs}`, { cache: 'no-store' })
    if (!r.ok) return []
    const data = (await r.json()) as MxNft[]
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/** Hits pack on-chain pour une adresse (API live). */
export async function fetchOnChainPackHits(address: string): Promise<OnChainPackHit[]> {
  const nfts = await fetchAccountNfts(address)
  const hits = matchOnChainPacks(nfts)
  for (const n of nfts) {
    const pid = tickerToPackId(n.collection || '')
    if (!pid) continue
    if (hits.some(h => h.identifier === n.identifier)) continue
    hits.push({
      packId: pid,
      identifier: n.identifier,
      name: n.name || n.identifier,
      collection: n.collection || '',
      nonce: n.nonce ?? 0,
      url: n.url || n.media?.[0]?.url,
    })
  }
  return hits
}

export async function fetchOwnedPackIdsOnChain(address: string): Promise<AgentPackId[]> {
  const hits = await fetchOnChainPackHits(address)
  return ownedPackIdsFromChain(hits) as AgentPackId[]
}

/** Poll until pack NFT appears in wallet (post-mint) or timeout. */
export async function waitForPackNft(
  address: string,
  packId: AgentPackId,
  opts?: { timeoutMs?: number; intervalMs?: number },
): Promise<OnChainPackHit | null> {
  const timeout = opts?.timeoutMs ?? 90_000
  const interval = opts?.intervalMs ?? 4_000
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const hits = await fetchOnChainPackHits(address)
    const found = hits.find(h => h.packId === packId)
    if (found) return found
    await new Promise(r => setTimeout(r, interval))
  }
  return null
}

export type { AgentPackId as PackId, OnChainPackHit }
