/**
 * NFT Pack series — metadata + local ownership (paper until SC mint).
 * On-chain matching via VITE_AGENT_PACK_COLLECTIONS + name heuristics.
 */
import { AGENT_PACKS, type PackId } from '../config/agentPacks'

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

const LOCAL_OWN = 'xartists_nft_pack_owned'

export function loadOwnedPacks(): PackId[] {
  try {
    const raw = localStorage.getItem(LOCAL_OWN)
    if (!raw) return []
    const j = JSON.parse(raw) as { packs?: string[] }
    return (j.packs || []).filter((p): p is PackId =>
      ['pulse', 'yield', 'sentinel'].includes(p)
    )
  } catch {
    return []
  }
}

export function markPackOwned(id: PackId) {
  const cur = new Set(loadOwnedPacks())
  cur.add(id)
  localStorage.setItem(LOCAL_OWN, JSON.stringify({ packs: [...cur], ts: Date.now() }))
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

/** Optional env: comma-separated MultiversX collection tickers for agent packs. */
export function agentPackCollectionIds(): string[] {
  try {
    const raw = (import.meta.env.VITE_AGENT_PACK_COLLECTIONS as string | undefined) || ''
    return raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  } catch {
    return []
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
 * 1) Collection ID match via VITE_AGENT_PACK_COLLECTIONS
 * 2) Name heuristics (until SC mint publishes ticker)
 */
export function matchOnChainPacks(
  nfts: Array<{
    identifier: string
    collection?: string
    name?: string
    nonce?: number
    url?: string
    media?: { url?: string }[]
  }>
): OnChainPackHit[] {
  const cols = new Set(agentPackCollectionIds().map(c => c.toUpperCase()))
  const hits: OnChainPackHit[] = []
  const seen = new Set<string>()

  for (const n of nfts) {
    const col = (n.collection || '').toUpperCase()
    const name = (n.name || '').toLowerCase()
    const id = (n.identifier || '').toLowerCase()
    let packId: PackId | null = null

    if (cols.size && cols.has(col)) {
      for (const [pid, hints] of Object.entries(PACK_NAME_HINTS) as [PackId, string[]][]) {
        if (hints.some(h => name.includes(h) || id.includes(h))) {
          packId = pid
          break
        }
      }
      if (!packId) packId = 'pulse'
    } else {
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
