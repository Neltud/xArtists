// Shared types & helpers for the xArtists NFT marketplace / gallery.
// Data source: /data/xartists_collections.json (copied from /data/xartists_collections.json)

export interface NFTMedia {
  url?: string
  originalUrl?: string
  thumbnailUrl?: string
  fileType?: string
  fileSize?: number
}

export interface NFT {
  collection: string
  collection_name: string
  nonce: number
  name: string
  identifier: string
  url?: string
  media?: NFTMedia[]
  metadata?: { description?: string; [k: string]: unknown }
  creator?: string
  owner?: string
  type?: string
  /** NB: the source JSON key is " royalties" (leading space). */
  royalties?: number | string
}

export interface CollectionData {
  identifier: string
  name: string
  type: string
  nft_count: number
  nfts: NFT[]
}

export interface CollectionsFile {
  timestamp: string
  total_collections: number
  total_nfts: number
  collections: CollectionData[]
}

/** Best available image URL for an NFT (media url > url > thumbnail). */
export function nftImageUrl(nft: NFT): string | undefined {
  return nft.url || nft.media?.[0]?.url || nft.media?.[0]?.thumbnailUrl || undefined
}

/** Resolve a raw royalties value (handles the " royalties" leading-space key). */
export function nftRoyalties(nft: NFT): number | null {
  const raw = (nft as unknown as Record<string, unknown>)[' royalties'] ?? nft.royalties
  if (raw === undefined || raw === null || raw === '') return null
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw))
  return isNaN(n) ? null : n
}

export function truncateAddr(addr?: string): string {
  if (!addr) return '—'
  const s = String(addr)
  if (s.length <= 14) return s
  return `${s.slice(0, 8)}…${s.slice(-6)}`
}

export function typeLabel(type?: string): string {
  if (!type) return 'NFT'
  if (type.includes('SemiFungible')) return 'SFT'
  if (type.includes('NonFungible')) return 'NFT'
  return type
}

/** Nonce as a zero-padded short id, e.g. "AGR-9bd53e-05" -> "#05". */
export function nonceLabel(nft: NFT): string {
  const tail = nft.identifier?.split('-').pop()
  return tail ? `#${tail}` : `#${nft.nonce}`
}

export const EXPLORER_NFT = (identifier: string) =>
  `https://explorer.multiversx.com/nfts/${identifier}`
export const XOXNO_COLLECTION = (collection: string) =>
  `https://xoxno.com/collection/${collection}`
export const XOXNO_NFT = (identifier: string) =>
  `https://xoxno.com/nft/${identifier}`

/** Fetch path for the bundled data file (respects the GitHub Pages base path). */
export const DATA_URL = `${import.meta.env.BASE_URL}data/xartists_collections.json`
