/**
 * NFT Pack series — metadata + optional DEV-only local cache.
 * On-chain matching via exact collection tickers only (PACK_COLLECTIONS + env).
 * Name-based attribution is forbidden (P0 security).
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
 * Exact collection ticker only — never name / partial-string heuristics (P0).
 * Official mainnet: XAIPLS-2cf72b · XAIYLD-987e24 · XAISNT-3d8a6b
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
  const tickerToPack = new Map<string, PackId>([
    [PACK_COLLECTIONS.pulse.ticker.toUpperCase(), 'pulse'],
    [PACK_COLLECTIONS.yield.ticker.toUpperCase(), 'yield'],
    [PACK_COLLECTIONS.sentinel.ticker.toUpperCase(), 'sentinel'],
  ])
  // Env overrides: only exact known tickers map to packs — never invent via name.
  for (const t of agentPackCollectionIds()) {
    const u = t.toUpperCase()
    if (!tickerToPack.has(u)) continue
  }

  const hits: OnChainPackHit[] = []
  const seen = new Set<string>()

  for (const n of nfts) {
    const col = (n.collection || '').toUpperCase()
    const id = (n.identifier || '').toUpperCase()
    let packId: PackId | null = tickerToPack.get(col) || null

    // MultiversX identifier form COLLECTION-nonce — exact collection prefix only
    if (!packId) {
      for (const [ticker, pid] of tickerToPack) {
        if (id.startsWith(ticker + '-')) {
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
