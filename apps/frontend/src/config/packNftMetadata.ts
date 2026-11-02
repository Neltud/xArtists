/**
 * Metadata d’entitlement packs IA — 3 collections distinctes.
 * Pulse  → XAIPLS-2cf72b (mainnet)
 * Yield  → XAIYLD-987e24 (mainnet)
 * Sentinel → XAISNT-3d8a6b (mainnet)
 *
 * NFT = 1/1 unique · SFT = Meta-ESDT supply plafonnée par nonce.
 * Visuel mint : recto peinture (sfumato Tuduri) · verso HUD (metadata on-chain readable).
 * Produit d’accès (signaux / badge / part pool pack) — PAS un fonds, PAS d’APY promis.
 * Mint on-chain après GO_LIVE · revente via agents-marketplace (fee ≤ 10 %).
 * Voir docs/PACK_NFT_SFT.md · docs/PACK_NFT_MINT_METADATA.md
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
  /** Optional verso / HUD media key */
  mediaBackHint?: string
  royaltiesBps: number
  /** NFT unique vs SFT série limitée */
  tokenMode?: 'nft' | 'sft'
  /** Dual-face card contract */
  face?: {
    recto: 'peinture'
    verso: 'hud'
    series: string
  }
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
const DATE = '2026'
const TECHNIQUE = 'Peinture sfumato + HUD data · série Tuduri'
const ROYALTIES = 500 // 5%

const FACE_BASE = {
  recto: 'peinture' as const,
  verso: 'hud' as const,
}

/** NFT #001 — Pack Pulse (recto lumière cristalline · verso HUD GOLD) */
export const AGENT_001: PackNftMeta = {
  collection: PACK_COLLECTIONS.pulse.ticker,
  collectionName: PACK_COLLECTIONS.pulse.fullName,
  tokenName: 'Genesis Pulse',
  nonceHint: 1,
  title: 'Genesis Pulse',
  artist: ARTIST,
  date: DATE,
  technique: TECHNIQUE,
  description:
    'Œuvre SFT Genesis Pulse (xArtists). Recto : peinture sfumato lumière cristalline. Verso : plaque HUD droits durables. Achat unique · édition limitée · pas un fonds, pas de rendement promis.',
  packId: 'pulse',
  tokenMode: 'sft',
  face: { ...FACE_BASE, series: 'Genesis Pulse' },
  attributes: [
    { trait_type: 'Pack', value: 'Pulse' },
    { trait_type: 'Tier', value: 'GOLD' },
    { trait_type: 'Face', value: 'peinture+hud' },
    { trait_type: 'Mode', value: 'SFT' },
    { trait_type: 'Billing', value: 'one_time' },
    { trait_type: 'Rights', value: 'durable' },
    { trait_type: 'Series', value: 'Genesis Pulse' },
    { trait_type: 'Risk', value: 'High-Frequency' },
    { trait_type: 'Artist', value: ARTIST },
  ],
  mediaHint: 'media/xAiAx-pulse-recto.png',
  mediaBackHint: 'media/xAiAx-pulse-verso-hud.png',
  royaltiesBps: ROYALTIES,
}

/** SFT série limitée — Pack Pulse (alias série) */
export const AGENT_001_SFT: PackNftMeta = {
  ...AGENT_001,
  tokenName: 'Genesis Pulse Series',
  title: 'Genesis Pulse Series',
  nonceHint: 2,
  description:
    'SFT série limitée Pack Pulse — même entitlement, supply plafonnée. Recto peinture · verso HUD.',
}

export const AGENT_002: PackNftMeta = {
  collection: PACK_COLLECTIONS.yield.ticker,
  collectionName: PACK_COLLECTIONS.yield.fullName,
  tokenName: 'Genesis Yield',
  nonceHint: 1,
  title: 'Genesis Yield',
  artist: ARTIST,
  date: DATE,
  technique: TECHNIQUE,
  description:
    'Œuvre SFT Genesis Yield (xArtists). Recto : lattice chrome · anneaux de rendement (peinture). Verso : HUD DeFi. Achat unique · pas un fonds, pas d’APY promis.',
  packId: 'yield',
  tokenMode: 'sft',
  face: { ...FACE_BASE, series: 'Genesis Yield' },
  attributes: [
    { trait_type: 'Pack', value: 'Yield' },
    { trait_type: 'Tier', value: 'SILVER' },
    { trait_type: 'Face', value: 'peinture+hud' },
    { trait_type: 'Mode', value: 'SFT' },
    { trait_type: 'Billing', value: 'one_time' },
    { trait_type: 'Rights', value: 'durable' },
    { trait_type: 'Series', value: 'Genesis Yield' },
    { trait_type: 'Risk', value: 'DeFi' },
    { trait_type: 'Artist', value: ARTIST },
  ],
  mediaHint: 'media/xAiAy-yield-recto.png',
  mediaBackHint: 'media/xAiAy-yield-verso-hud.png',
  royaltiesBps: ROYALTIES,
}

export const AGENT_003: PackNftMeta = {
  collection: PACK_COLLECTIONS.sentinel.ticker,
  collectionName: PACK_COLLECTIONS.sentinel.fullName,
  tokenName: 'Genesis Sentinel',
  nonceHint: 1,
  title: 'Genesis Sentinel',
  artist: ARTIST,
  date: DATE,
  technique: TECHNIQUE,
  description:
    'Œuvre SFT Genesis Sentinel (xArtists). Recto : voile gardien · profondeur (peinture). Verso : HUD alertes / zero-trust. Achat unique · pas un fonds, pas de rendement promis.',
  packId: 'sentinel',
  tokenMode: 'sft',
  face: { ...FACE_BASE, series: 'Genesis Sentinel' },
  attributes: [
    { trait_type: 'Pack', value: 'Sentinel' },
    { trait_type: 'Tier', value: 'PLATINUM' },
    { trait_type: 'Face', value: 'peinture+hud' },
    { trait_type: 'Mode', value: 'SFT' },
    { trait_type: 'Billing', value: 'one_time' },
    { trait_type: 'Rights', value: 'durable' },
    { trait_type: 'Series', value: 'Genesis Sentinel' },
    { trait_type: 'Risk', value: 'Guard' },
    { trait_type: 'Artist', value: ARTIST },
  ],
  mediaHint: 'media/xAiAs-sentinel-recto.png',
  mediaBackHint: 'media/xAiAs-sentinel-verso-hud.png',
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

/** Build MultiversX-compatible metadata URI payload for a minted edition. */
export function buildMintMetadata(id: PackId, edition: number, maxSupply: number) {
  const m = packMetaForId(id)
  return {
    name: `${m.title} #${String(edition).padStart(3, '0')}`,
    description: m.description,
    collection: m.collectionName,
    ticker: m.collection,
    royalties: m.royaltiesBps,
    attributes: [
      ...m.attributes,
      { trait_type: 'Edition', value: `${edition}/${maxSupply}` },
      { trait_type: 'Chain', value: 'MultiversX' },
    ],
    properties: {
      artist: m.artist,
      date: m.date,
      technique: m.technique,
      pack: m.packId,
      face_recto: m.face?.recto ?? 'peinture',
      face_verso: m.face?.verso ?? 'hud',
      billing: 'one_time',
      rights: 'durable',
      collection_ticker: m.collection,
      onSale: false,
    },
    media: {
      recto: m.mediaHint,
      verso: m.mediaBackHint,
    },
    external_url: 'https://neltud.github.io/xArtists/#/workspace/agents',
  }
}
