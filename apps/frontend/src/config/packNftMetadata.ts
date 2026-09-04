/**
 * Metadata NFT d’entitlement packs IA.
 * Collection ticker cible : xAiAx (à finaliser au mint SC).
 * Pack 1 = Pulse → Agent 001 archetype.
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
}

/** Collection officielle packs agents xArtists */
export const PACK_NFT_COLLECTION = {
  ticker: 'xAiAx',
  name: 'xAiAx',
  fullName: 'xArtists AI Agents',
  artist: 'NT',
  website: 'https://neltud.github.io/xArtists/',
} as const

/**
 * NFT #001 — exemple visuel livré (cristal violet / bouclier hexagonal).
 * Reçu par les détenteurs du pack IA 1 = Pulse.
 */
export const AGENT_001: PackNftMeta = {
  collection: PACK_NFT_COLLECTION.ticker,
  collectionName: PACK_NFT_COLLECTION.fullName,
  tokenName: 'Agent 001',
  nonceHint: 1,
  title: 'Agent 001',
  artist: 'NT',
  date: '2027',
  technique: 'IA generated',
  description:
    'Entitlement NFT Pack Pulse (xArtists). Agent crystallin — bouclier hexagonal d’énergie. Accès signaux haute fréquence · board paper. Pas un fonds, pas de rendement promis.',
  packId: 'pulse',
  attributes: [
    { trait_type: 'Pack', value: 'Pulse' },
    { trait_type: 'Agent', value: '001' },
    { trait_type: 'Artist', value: 'NT' },
    { trait_type: 'Date', value: '2027' },
    { trait_type: 'Technique', value: 'IA generated' },
    { trait_type: 'Class', value: 'Crystal Sentinel' },
    { trait_type: 'Rarity', value: 'Genesis' },
    { trait_type: 'Signal intensity', value: 3 },
  ],
  mediaHint: 'media/xAiAx-001.mp4',
  royaltiesBps: 500, // 5%
}

/** Gabarit par pack (nonces ultérieurs au mint) */
export const PACK_AGENT_TEMPLATE: Record<PackId, Omit<PackNftMeta, 'nonceHint' | 'tokenName' | 'title'>> = {
  pulse: {
    collection: PACK_NFT_COLLECTION.ticker,
    collectionName: PACK_NFT_COLLECTION.fullName,
    artist: 'NT',
    date: '2027',
    technique: 'IA generated',
    description: 'Entitlement Pulse — signaux dense · micro-arb · momentum.',
    packId: 'pulse',
    attributes: [
      { trait_type: 'Pack', value: 'Pulse' },
      { trait_type: 'Artist', value: 'NT' },
      { trait_type: 'Technique', value: 'IA generated' },
      { trait_type: 'Signal intensity', value: 3 },
    ],
    mediaHint: 'media/xAiAx-pulse.mp4',
    royaltiesBps: 500,
  },
  yield: {
    collection: PACK_NFT_COLLECTION.ticker,
    collectionName: PACK_NFT_COLLECTION.fullName,
    artist: 'NT',
    date: '2027',
    technique: 'IA generated',
    description: 'Entitlement Yield — Hatom / LP sleeve lecture.',
    packId: 'yield',
    attributes: [
      { trait_type: 'Pack', value: 'Yield' },
      { trait_type: 'Artist', value: 'NT' },
      { trait_type: 'Technique', value: 'IA generated' },
      { trait_type: 'Signal intensity', value: 2 },
    ],
    mediaHint: 'media/xAiAx-yield.mp4',
    royaltiesBps: 500,
  },
  sentinel: {
    collection: PACK_NFT_COLLECTION.ticker,
    collectionName: PACK_NFT_COLLECTION.fullName,
    artist: 'NT',
    date: '2027',
    technique: 'IA generated',
    description: 'Entitlement Sentinel — veille · alertes risk.',
    packId: 'sentinel',
    attributes: [
      { trait_type: 'Pack', value: 'Sentinel' },
      { trait_type: 'Artist', value: 'NT' },
      { trait_type: 'Technique', value: 'IA generated' },
      { trait_type: 'Signal intensity', value: 1 },
    ],
    mediaHint: 'media/xAiAx-sentinel.mp4',
    royaltiesBps: 500,
  },
}

/** JSON off-chain compatible MultiversX (IPFS / API) */
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
      onSale: false,
    },
  }
}
