/**
 * NFT Pack series — metadata + optional DEV-only local cache.
 * On-chain matching via PACK_COLLECTIONS + VITE_AGENT_PACK_COLLECTIONS + name heuristics.
 * Access rights: never from localStorage (audit S-02).
 */
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { PACK_COLLECTIONS } from '../config/packNftMetadata'

export type NftPackSeries = {
  id: PackId
  name: string
  tier: string
  max_supply: number
  price_eur: number
  attributes: { trait_type: string; value: string }[]
  image: string
  description: string
}

export type NftPacksFile = {
  version: string
  collection: string
  series: NftPackSeries[]
  mint: { sc_status: string; royalties_bps: number; payment: string[] }
}

/**
 * localStorage mirror only — NEVER grant access rights from this.
 * Access = on-chain NFTs (matchOnChainPacks) or admin whitelist.
 */
const LOCAL_OWN = 'xartists_nft_pack_owned'

/** @deprecated Demo/UX cache only. Do not use for hasAgentAccess / gates. */
export function loadOwnedPacks(): PackId[] {
  if (!import.meta.env.DEV) return []
  try {
    const raw = localStorage.getItem(LOCAL_OWN)
    if (!raw) return []
    const j = JSON.parse(raw) as { packs?: string[] }
    return (j.packs || []).filter((p): p is PackId =>
      ['pulse', 'yield', 'sentinel'].includes(p),
    )
  } catch {
    return []
  }
}

/** Cache post-mint success in DEV only. Production rights = chain. */
export function markPackOwned(id: PackId) {
  if (!import.meta.env.DEV) return
  try {
    const cur = new Set(loadOwnedPacks())
    cur.add(id)
    localStorage.setItem(LOCAL_OWN, JSON.stringify({ packs: [...cur], ts: Date.now() }))
  } catch {
    /* */
  }
}

/** Build mint metadata JSON for a series (SC / IPFS later). */
export function buildMintMetadata(id: PackId, nonceHint = 1) {
  const pack = AGENT_PACKS.find(p => p.id === id)
  if (!pack) return null
  return {
    name: `${pack.name} #${nonceHint}`,
    description: pack.tagline,
    image: `ipfs://pending/${id}.png`,
    attributes: [
      { trait_type: 'Series', value: pack.name },
      { trait_type: 'Risk', value: pack.risk },
      { trait_type: 'SignalIntensity', value: String(pack.signalIntensity) },
      { trait_type: 'Strategies', value: pack.strategies.join(',') },
    ],
    royalties: 500,
    collection: 'xArtists Agent Packs',
  }
}

export async function fetchNftPacksCatalog(): Promise<NftPacksFile | null> {
  const urls = [
    `${import.meta.env.BASE_URL}data/nft_packs.json`,
    'https://raw.githubusercontent.com/Neltud/xArtists/main/data/nft_packs.json',
  ]
  for (const u of urls) {
    try {
      const r = await fetch(`${u}?t=${Date.now()}`, { cache: 'no-store' })
      if (!r.ok) continue
      return (await r.json()) as NftPacksFile
    } catch {
      /* next */
    }
  }
  return null
}

/** Collection tickers for agent packs (mainnet XAIPLS / XAIYLD / XAISNT + env). */
export function agentPackCollectionIds(): string[] {
  const defaults = [
    PACK_COLLECTIONS.pulse.ticker,
    PACK_COLLECTIONS.yield.ticker,
    PACK_COLLECTIONS.sentinel.ticker,
  ]
  try {
    const raw = (import.meta.env.VITE_AGENT_PACK_COLLECTIONS as string | undefined) || ''
    const fromEnv = raw.split(',').map(s => s.trim()).filter(Boolean)
    return [...new Set([...fromEnv, ...defaults])]
  } catch {
    return defaults
  }
}

const PACK_NAME_HINTS: Record<PackId, string[]> = {
  pulse: ['pulse'],
  yield: ['yield'],
  sentinel: ['sentinel'],
}

export type OnChainPackHit = {
  packId: PackId
  identifier: string
  name: string
  collection: string
  nonce: number
  url?: string
}

/**
 * Map user NFTs → agent packs (Pulse / Yield / Sentinel).
 * 1) Exact / prefix map XAIPLS-* · XAIYLD-* · XAISNT-* (mainnet)
 * 2) Env VITE_AGENT_PACK_COLLECTIONS + name heuristics
 */
export function matchOnChainPacks(
  nfts: Array<{
    identifier: string
    collection?: string
    name?: string
    nonce?: number
    url?: string
    media?: { url?: string }[]
  }>,
): OnChainPackHit[] {
  const cols = new Set(agentPackCollectionIds().map(c => c.toUpperCase()))
  const hits: OnChainPackHit[] = []
  const seen = new Set<string>()

  for (const n of nfts) {
    const col = (n.collection || '').toUpperCase()
    const name = (n.name || '').toLowerCase()
    const id = (n.identifier || '').toLowerCase()
    let packId: PackId | null = null

    const pulseT = PACK_COLLECTIONS.pulse.ticker.toUpperCase()
    const yieldT = PACK_COLLECTIONS.yield.ticker.toUpperCase()
    const sentT = PACK_COLLECTIONS.sentinel.ticker.toUpperCase()
    if (col === pulseT || col.startsWith('XAIPLS')) packId = 'pulse'
    else if (col === yieldT || col.startsWith('XAIYLD')) packId = 'yield'
    else if (col === sentT || col.startsWith('XAISNT')) packId = 'sentinel'

    if (!packId && cols.size && cols.has(col)) {
      for (const [pid, hints] of Object.entries(PACK_NAME_HINTS) as [PackId, string[]][]) {
        if (hints.some(h => name.includes(h) || id.includes(h))) {
          packId = pid
          break
        }
      }
      if (!packId) {
        if (col.includes('PLS') || col.includes('PULSE')) packId = 'pulse'
        else if (col.includes('YLD') || col.includes('YIELD')) packId = 'yield'
        else if (col.includes('SNT') || col.includes('SENTINEL')) packId = 'sentinel'
      }
    } else if (!packId) {
      for (const [pid, hints] of Object.entries(PACK_NAME_HINTS) as [PackId, string[]][]) {
        if (hints.some(h => name.includes(h))) {
          packId = pid
          break
        }
      }
    }

    if (!packId) continue
    const key = `${packId}:${n.identifier}`
    if (seen.has(key)) continue
    seen.add(key)
    const url =
      n.url ||
      (Array.isArray(n.media) && n.media[0]?.url ? n.media[0].url : undefined)
    hits.push({
      packId,
      identifier: n.identifier,
      name: n.name || n.identifier,
      collection: n.collection || '',
      nonce: n.nonce ?? 0,
      url,
    })
  }
  return hits
}

export function ownedPackIdsFromChain(hits: OnChainPackHit[]): PackId[] {
  return [...new Set(hits.map(h => h.packId))]
}
