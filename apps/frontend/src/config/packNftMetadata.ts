/**
 * Metadata d’entitlement packs IA — 3 collections distinctes.
 * Pulse  → XAIPLS-2cf72b (mainnet)
 * Yield  → XAIYLD-987e24 (mainnet)
 * Sentinel → XAISNT-3d8a6b (mainnet)
 *
 * NFT = 1/1 unique · SFT = Meta-ESDT supply plafonnée par nonce.
 * Produit d’accès (signaux / badge / part pool pack) — PAS un fonds, PAS d’APY promis.
 * Mint on-chain après GO_LIVE · revente via agents-marketplace (fee ≤ 10 %).
 * Voir docs/PACK_NFT_SFT.md · docs/REVENUE_DISTRIBUTION.md
 */

import type { PackId } from './agentPacks'

export type PackNftMeta = {
  collection: string
  collectionName: string
  tokenName: string
  nonceHint: number
  title: string
  artist: string
  date: string
  technique: string
  description: string
  packId: PackId
  attributes: { trait_type: string; value: string | number }[]
  mediaHint: string
  royaltiesBps: number
  /** NFT unique vs SFT série limitée */
  tokenMode?: 'nft' | 'sft'
}

/** Collections mainnet live (issue 2026-10-14). Override: VITE_AGENT_PACK_COLLECTIONS */
export const DEFAULT_PACK_COLLECTIONS = {
  PULSE: 'XAIPLS-2cf72b',
  YIELD: 'XAIYLD-987e24',
  SENTINEL: 'XAISNT-3d8a6b',
} as const

export const PACK_COLLECTIONS = {
  pulse: {
    ticker: DEFAULT_PACK_COLLECTIONS.PULSE,
    name: 'XAIPLS',
    fullName: 'xArtists AI Agents — Pulse',
    packId: 'pulse' as PackId,
  },
  yield: {
    ticker: DEFAULT_PACK_COLLECTIONS.YIELD,
    name: 'XAIYLD',
    fullName: 'xArtists AI Agents — Yield',
    packId: 'yield' as PackId,
  },
  sentinel: {
    ticker: DEFAULT_PACK_COLLECTIONS.SENTINEL,
    name: 'XAISNT',
    fullName: 'xArtists AI Agents — Sentinel',
    packId: 'sentinel' as PackId,
  },
} as const

/** @deprecated alias — préfère PACK_COLLECTIONS.pulse */
export const PACK_NFT_COLLECTION = {
  ticker: PACK_COLLECTIONS.pulse.ticker,
  name: PACK_COLLECTIONS.pulse.name,
  fullName: 'xArtists AI Agents',
  artist: 'NT',
  website: 'https://neltud.github.io/xArtists/',
} as const

const ARTIST = 'NT'
const DATE = '2027'
const TECHNIQUE = 'IA generated'
const ROYALTIES = 500 // 5%

/** NFT #001 — Pack Pulse (cristal violet / bouclier hexagonal) */
export const AGENT_001: PackNftMeta = {
  collection: PACK_COLLECTIONS.pulse.ticker,
  collectionName: PACK_COLLECTIONS.pulse.fullName,
  tokenName: 'Agent 001',
  nonceHint: 1,
  title: 'Agent 001',
  artist: ARTIST,
  date: DATE,
  technique: TECHNIQUE,
  description:
    'Entitlement NFT Pack Pulse (xArtists). Agent crystallin — bouclier hexagonal d’énergie. Accès signaux haute fréquence · board paper. Pas un fonds, pas de rendement promis.',
  packId: 'pulse',
  tokenMode: 'nft',
  attributes: [
    { trait_type: 'Pack', value: 'Pulse' },
    { trait_type: 'Agent', value: '001' },
    { trait_type: 'Mode', value: 'NFT' },
    { trait_type: 'Risk', value: 'High-Frequency' },
  ],
  mediaHint: 'media/xAiAx-pulse.mp4',
  royaltiesBps: ROYALTIES,
}

/** SFT série limitée — Pack Pulse */
export const AGENT_001_SFT: PackNftMeta = {
  collection: PACK_COLLECTIONS.pulse.ticker,
  collectionName: PACK_COLLECTIONS.pulse.fullName,
  tokenName: 'Agent 001 Series',
  nonceHint: 2,
  title: 'Agent 001 Series',
  artist: ARTIST,
  date: DATE,
  technique: TECHNIQUE,
  description: 'SFT série limitée Pack Pulse — même entitlement d’accès, supply plafonnée.',
  packId: 'pulse',
  tokenMode: 'sft',
  attributes: [
    { trait_type: 'Pack', value: 'Pulse' },
    { trait_type: 'Agent', value: '001' },
    { trait_type: 'Mode', value: 'SFT' },
  ],
  mediaHint: 'media/xAiAx-pulse.mp4',
  royaltiesBps: ROYALTIES,
}

export const AGENT_002: PackNftMeta = {
  collection: PACK_COLLECTIONS.yield.ticker,
  collectionName: PACK_COLLECTIONS.yield.fullName,
  tokenName: 'Agent 002',
  nonceHint: 1,
  title: 'Agent 002',
  artist: ARTIST,
  date: DATE,
  technique: TECHNIQUE,
  description:
    'Entitlement NFT Pack Yield (xArtists). Accès DeFi limité — LP · Hatom · compound. Pas un fonds, pas d’APY promis.',
  packId: 'yield',
  tokenMode: 'nft',
  attributes: [
    { trait_type: 'Pack', value: 'Yield' },
    { trait_type: 'Agent', value: '002' },
    { trait_type: 'Mode', value: 'NFT' },
    { trait_type: 'Risk', value: 'DeFi' },
  ],
  mediaHint: 'media/xAiAy-yield.mp4',
  royaltiesBps: ROYALTIES,
}

export const AGENT_003: PackNftMeta = {
  collection: PACK_COLLECTIONS.sentinel.ticker,
  collectionName: PACK_COLLECTIONS.sentinel.fullName,
  tokenName: 'Agent 003',
  nonceHint: 1,
  title: 'Agent 003',
  artist: ARTIST,
  date: DATE,
  technique: TECHNIQUE,
  description:
    'Entitlement NFT Pack Sentinel (xArtists). Alertes & garde-fous. Pas un fonds, pas de rendement promis.',
  packId: 'sentinel',
  tokenMode: 'nft',
  attributes: [
    { trait_type: 'Pack', value: 'Sentinel' },
    { trait_type: 'Agent', value: '003' },
    { trait_type: 'Mode', value: 'NFT' },
    { trait_type: 'Risk', value: 'Guard' },
  ],
  mediaHint: 'media/xAiAs-sentinel.mp4',
  royaltiesBps: ROYALTIES,
}

export const PACK_NFT_BY_ID: Record<PackId, PackNftMeta> = {
  pulse: AGENT_001,
  yield: AGENT_002,
  sentinel: AGENT_003,
}

export function packMetaForId(id: PackId): PackNftMeta {
  return PACK_NFT_BY_ID[id]
}
