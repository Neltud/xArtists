/**
 * Metadata d’entitlement packs IA — 3 collections distinctes.
 * Pulse  → xAiAx · Agent 001 (NFT genesis) + SFT séries limitées
 * Yield  → xAiAy · Agent 002
 * Sentinel → xAiAs · Agent 003
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

/** Une collection par pack (tickers provisoires jusqu’au mint) */
export const PACK_COLLECTIONS = {
  pulse: {
    ticker: 'xAiAx',
    name: 'xAiAx',
    fullName: 'xArtists AI Agents — Pulse',
    packId: 'pulse' as PackId,
  },
  yield: {
    ticker: 'xAiAy',
    name: 'xAiAy',
    fullName: 'xArtists AI Agents — Yield',
    packId: 'yield' as PackId,
  },
  sentinel: {
    ticker: 'xAiAs',
    name: 'xAiAs',
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
    { trait_type: 'Artist', value: ARTIST },
    { trait_type: 'Date', value: DATE },
    { trait_type: 'Technique', value: TECHNIQUE },
    { trait_type: 'Class', value: 'Crystal Sentinel' },
    { trait_type: 'Rarity', value: 'Genesis' },
    { trait_type: 'Token', value: 'NFT' },
    { trait_type: 'Signal intensity', value: 3 },
    { trait_type: 'Collection', value: 'xAiAx' },
  ],
  mediaHint: 'media/xAiAx-001.mp4',
  royaltiesBps: ROYALTIES,
}

/** NFT #002 — Pack Yield */
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
    'Entitlement NFT Pack Yield (xArtists). Agent de rendement — lecture Hatom / LP / compound. Signaux moyens, pas d’APY annoncé. Pas un fonds, pas de mandat de gestion.',
  packId: 'yield',
  tokenMode: 'nft',
  attributes: [
    { trait_type: 'Pack', value: 'Yield' },
    { trait_type: 'Agent', value: '002' },
    { trait_type: 'Artist', value: ARTIST },
    { trait_type: 'Date', value: DATE },
    { trait_type: 'Technique', value: TECHNIQUE },
    { trait_type: 'Class', value: 'Harvest Core' },
    { trait_type: 'Rarity', value: 'Genesis' },
    { trait_type: 'Token', value: 'NFT' },
    { trait_type: 'Signal intensity', value: 2 },
    { trait_type: 'Collection', value: 'xAiAy' },
  ],
  mediaHint: 'media/xAiAy-002.mp4',
  royaltiesBps: ROYALTIES,
}

/** NFT #003 — Pack Sentinel */
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
    'Entitlement NFT Pack Sentinel (xArtists). Agent de veille — alertes risk · sleeve protection. Signaux sparses. Pas un fonds, pas d’exécution trading agressive.',
  packId: 'sentinel',
  tokenMode: 'nft',
  attributes: [
    { trait_type: 'Pack', value: 'Sentinel' },
    { trait_type: 'Agent', value: '003' },
    { trait_type: 'Artist', value: ARTIST },
    { trait_type: 'Date', value: DATE },
    { trait_type: 'Technique', value: TECHNIQUE },
    { trait_type: 'Class', value: 'Aegis Watch' },
    { trait_type: 'Rarity', value: 'Genesis' },
    { trait_type: 'Token', value: 'NFT' },
    { trait_type: 'Signal intensity', value: 1 },
    { trait_type: 'Collection', value: 'xAiAs' },
  ],
  mediaHint: 'media/xAiAs-003.mp4',
  royaltiesBps: ROYALTIES,
}

export const GENESIS_AGENTS: Record<PackId, PackNftMeta> = {
  pulse: AGENT_001,
  yield: AGENT_002,
  sentinel: AGENT_003,
}

export const ALL_GENESIS_AGENTS: PackNftMeta[] = [AGENT_001, AGENT_002, AGENT_003]

/** Gabarit SFT / nonces suivants (supply limitée par pack) */
export const PACK_AGENT_TEMPLATE: Record<
  PackId,
  Omit<PackNftMeta, 'nonceHint' | 'tokenName' | 'title'>
> = {
  pulse: {
    collection: PACK_COLLECTIONS.pulse.ticker,
    collectionName: PACK_COLLECTIONS.pulse.fullName,
    artist: ARTIST,
    date: DATE,
    technique: TECHNIQUE,
    description: 'Entitlement Pulse SFT — signaux dense · micro-arb · momentum. Pas un produit financier.',
    packId: 'pulse',
    tokenMode: 'sft',
    attributes: [
      { trait_type: 'Pack', value: 'Pulse' },
      { trait_type: 'Artist', value: ARTIST },
      { trait_type: 'Technique', value: TECHNIQUE },
      { trait_type: 'Token', value: 'SFT' },
      { trait_type: 'Signal intensity', value: 3 },
    ],
    mediaHint: 'media/xAiAx-pulse.mp4',
    royaltiesBps: ROYALTIES,
  },
  yield: {
    collection: PACK_COLLECTIONS.yield.ticker,
    collectionName: PACK_COLLECTIONS.yield.fullName,
    artist: ARTIST,
    date: DATE,
    technique: TECHNIQUE,
    description: 'Entitlement Yield SFT — Hatom / LP sleeve lecture. Pas d’APY promis.',
    packId: 'yield',
    tokenMode: 'sft',
    attributes: [
      { trait_type: 'Pack', value: 'Yield' },
      { trait_type: 'Artist', value: ARTIST },
      { trait_type: 'Technique', value: TECHNIQUE },
      { trait_type: 'Token', value: 'SFT' },
      { trait_type: 'Signal intensity', value: 2 },
    ],
    mediaHint: 'media/xAiAy-yield.mp4',
    royaltiesBps: ROYALTIES,
  },
  sentinel: {
    collection: PACK_COLLECTIONS.sentinel.ticker,
    collectionName: PACK_COLLECTIONS.sentinel.fullName,
    artist: ARTIST,
    date: DATE,
    technique: TECHNIQUE,
    description: 'Entitlement Sentinel SFT — veille · alertes risk.',
    packId: 'sentinel',
    tokenMode: 'sft',
    attributes: [
      { trait_type: 'Pack', value: 'Sentinel' },
      { trait_type: 'Artist', value: ARTIST },
      { trait_type: 'Technique', value: TECHNIQUE },
      { trait_type: 'Token', value: 'SFT' },
      { trait_type: 'Signal intensity', value: 1 },
    ],
    mediaHint: 'media/xAiAs-sentinel.mp4',
    royaltiesBps: ROYALTIES,
  },
}

/** JSON off-chain MultiversX (IPFS) */
export function toMultiversXMetadataJson(m: PackNftMeta) {
  return {
    name: m.tokenName,
    description: m.description,
    collection: m.collectionName,
    attributes: m.attributes,
    external_url: 'https://neltud.github.io/xArtists/#/my-packs',
    animation_url: m.mediaHint,
    properties: {
      artist: m.artist,
      date: m.date,
      technique: m.technique,
      pack: m.packId,
      collection_ticker: m.collection,
      token_mode: m.tokenMode || 'nft',
      onSale: false,
    },
  }
}
