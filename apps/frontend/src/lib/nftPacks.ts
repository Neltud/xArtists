/**
 * NFT Pack series — metadata + local ownership (paper until SC mint).
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
