// Shared types & helpers for the xArtists NFT marketplace / gallery.

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
  version?: string
  collections: CollectionData[]
}

/** Lightweight index — preview only, full NFTs loaded per collection page */
export interface CollectionIndexEntry {
  identifier: string
  name: string
  type: string
  nft_count: number
  preview: NFT[]
}

export interface CollectionsIndexFile {
  timestamp: string
  total_collections: number
  total_nfts: number
  version?: string
  collections: CollectionIndexEntry[]
}

export function nftImageUrl(nft: NFT): string | undefined {
  return nft.url || nft.media?.[0]?.url || nft.media?.[0]?.thumbnailUrl || undefined
}

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

const BASE = import.meta.env.BASE_URL || '/'

/** Full slim catalog (all collections + all nfts) */
export const DATA_URL = `${BASE}data/xartists_collections.json`
/** Fast index (~16 KB) for gallery first paint */
export const INDEX_URL = `${BASE}data/xartists_collections.index.json`
/** Per-collection page after expand */
export const collectionPageUrl = (id: string) =>
  `${BASE}data/collections/${encodeURIComponent(id)}.json`
