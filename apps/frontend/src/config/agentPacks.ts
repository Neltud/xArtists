/**
 * Packs IA NFT — hiérarchie B2B :
 * - Pulse  = GOLD (full suite, HF signals)
 * - Yield  = SILVER (DeFi / LP / claim)
 * - Sentinel = PLATINUM (veille / RWA / zero-trust)
 *
 * MODÈLE COMMERCIAL (lock 2026-10-31 — GitBook #24) :
 * - Achat unique (crypto ou fiat) — PAS d'abonnement
 * - NFT MultiversX édition limitée inclus
 * - Droits d'accès liés au NFT : durables (aucune expiration annuelle)
 * - Whop xArtists = abonnement mensuel DISTINCT (voir docs/COMMERCIAL_MODEL.md)
 *
 * Official commercial EUR list prices (Rule 1): 110 / 75 / 50 EUR
 * Server-side source of truth: services/access_pack/catalog.py
 * Genesis edition caps: Pulse 333 · Yield 500 · Sentinel 777
 */

import { PACK_PRICE_EGLD, PACK_PRICE_EUR } from './multichain'

export type PackId = 'pulse' | 'yield' | 'sentinel'

/** Feature flags par pack — source de vérité UI + gates */
export type PackFeatures = {
  room: boolean
  commandHub: boolean
  commandRoom: boolean
  tca: boolean
  liaFull: boolean
  liveTapeFull: boolean
  tradingSignals: boolean
  defiSleeve: boolean
  riskAlerts: boolean
  agentStake: boolean
  signalIntensity: 1 | 2 | 3
  actionsPerWeek: string
}

const PULSE_FEATURES: PackFeatures = {
  room: true,
  commandHub: true,
  commandRoom: true,
  tca: true,
  liaFull: true,
  liveTapeFull: true,
  tradingSignals: true,
  defiSleeve: true,
  riskAlerts: true,
  agentStake: true,
  signalIntensity: 3,
  actionsPerWeek: 'plusieurs cycles / jour',
}

const YIELD_FEATURES: PackFeatures = {
  room: true,
  commandHub: true,
  commandRoom: true,
  tca: false,
  liaFull: false,
  liveTapeFull: false,
  tradingSignals: false,
  defiSleeve: true,
  riskAlerts: false,
  agentStake: true,
  signalIntensity: 2,
  actionsPerWeek: 'cycles DeFi réguliers',
}

const SENTINEL_FEATURES: PackFeatures = {
  room: true,
  commandHub: true,
  commandRoom: true,
  tca: false,
  liaFull: false,
  liveTapeFull: false,
  tradingSignals: false,
  defiSleeve: false,
  riskAlerts: true,
  agentStake: true,
  signalIntensity: 1,
  actionsPerWeek: 'alertes sparses',
}

/** Visual identity — Graphite · Chrome · Acid (soul-tokens) */
export type PackVisual = {
  accent: string
  accentSoft: string
  border: string
  badge: string
  glow: string
  mediaMotif: string
}

export const PACK_VISUAL: Record<PackId, PackVisual> = {
  pulse: {
    accent: 'var(--xa-pack-pulse, #e8f5a8)',
    accentSoft: 'rgba(232, 245, 168, 0.12)',
    border: 'rgba(232, 245, 168, 0.35)',
    badge: 'GOLD',
    glow: '0 0 40px rgba(205, 245, 139, 0.15)',
    mediaMotif: 'hex-crystal · acid core',
  },
  yield: {
    accent: 'var(--xa-pack-yield, #c8ccc4)',
    accentSoft: 'rgba(200, 204, 196, 0.12)',
    border: 'rgba(200, 204, 196, 0.32)',
    badge: 'SILVER',
    glow: '0 0 32px rgba(200, 204, 196, 0.12)',
    mediaMotif: 'chrome lattice · yield rings',
  },
  sentinel: {
    accent: 'var(--xa-pack-sentinel, #a78bfa)',
    accentSoft: 'rgba(167, 139, 250, 0.12)',
    border: 'rgba(167, 139, 250, 0.32)',
    badge: 'PLATINUM',
    glow: '0 0 32px rgba(167, 139, 250, 0.14)',
    mediaMotif: 'shield lattice · guard pulse',
  },
}

/** Genesis edition hard caps — product lock until GO raises them */
export const PACK_EDITION = {
  pulse: { maxSupply: 333, mintedMode: 'sft' as const, seriesName: 'Genesis Pulse', scarcity: 'rare' },
  yield: { maxSupply: 500, mintedMode: 'sft' as const, seriesName: 'Genesis Yield', scarcity: 'limited' },
  sentinel: { maxSupply: 777, mintedMode: 'sft' as const, seriesName: 'Genesis Sentinel', scarcity: 'open-limited' },
} as const

/** Commercial lock — one-time purchase, durable NFT rights (no annual expiry) */
export const PACK_COMMERCIAL = {
  billing: 'one_time' as const,
  includesNft: true,
  rightsExpiry: 'none' as const, // no annual / time-boxed rights on the NFT
  distinctFromWhop: true,
} as const

export type AgentPackProfile = {
  id: PackId
  name: string
  tagline: string
  tier: 'full' | 'limited_defi' | 'limited_guard'
  tierLabel: string
  icon: string
  signalIntensity: 1 | 2 | 3
  priceEgld: { min: number; max: number; list: number }
  priceEur: { min: number; max: number; list: number }
  entitlements: string[]
  features: PackFeatures
  maxSupply: number
  seriesName: string
  strategies: string[]
  activity: string
  color?: string
  borderClass?: string
  domain?: string
  risk?: string
  bps?: number
}

export const AGENT_PACKS: AgentPackProfile[] = [
  {
    id: 'pulse',
    name: 'Pulse',
    tagline: 'Pack GOLD — signaux HF · CC · TCA · LIA · multi-actifs',
    tier: 'full',
    tierLabel: 'GOLD',
    icon: '⚡',
    signalIntensity: 3,
    priceEgld: { min: 10, max: PACK_PRICE_EGLD.max, list: 10 },
    priceEur: { min: 50, max: PACK_PRICE_EUR.max, list: 110 },
    maxSupply: PACK_EDITION.pulse.maxSupply,
    seriesName: PACK_EDITION.pulse.seriesName,
    strategies: ['MICRO_ARB', 'MOMENTUM', 'MEAN_REVERSION', 'BOARD_TICK'],
    activity: 'Plusieurs cycles / jour — intensité max',
    entitlements: [
      'Achat unique · NFT Genesis Pulse (droits durables)',
      'NFT pack Pulse + salle 3D Pulse',
      'Command Center complet (Hub + toutes salles)',
      'TCA Academy + LIA full',
      'Live tape + trading signals',
      'DeFi sleeve + risk alerts + agent stake',
    ],
    features: PULSE_FEATURES,
    color: 'text-[color:var(--xa-pack-pulse)]',
    borderClass: 'border-[color:var(--xa-pack-pulse)]/40',
    domain: 'trading',
    risk: 'active',
    bps: 10000,
  },
  {
    id: 'yield',
    name: 'Yield',
    tagline: 'Pack SILVER — DeFi / LP / claim · sleeve rendement',
    tier: 'limited_defi',
    tierLabel: 'SILVER',
    icon: '📈',
    signalIntensity: 2,
    priceEgld: { min: 5, max: 22, list: 5 },
    priceEur: { min: 30, max: 100, list: 75 },
    maxSupply: PACK_EDITION.yield.maxSupply,
    seriesName: PACK_EDITION.yield.seriesName,
    strategies: ['YIELD_OPT', 'LP_WATCH', 'COMPOUND_READ'],
    activity: 'Cycles DeFi réguliers — focus pool & staking',
    entitlements: [
      'Achat unique · NFT Genesis Yield (droits durables)',
      'NFT pack Yield + salle 3D Yield',
      'Salle Command « Yield »',
      'DeFi sleeve + agent stake',
      'Accès hub limité (pas TCA / LIA full)',
    ],
    features: YIELD_FEATURES,
    color: 'text-[color:var(--xa-pack-yield)]',
    borderClass: 'border-[color:var(--xa-pack-yield)]/40',
    domain: 'defi',
    risk: 'moderate',
    bps: 5000,
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    tagline: 'Pack PLATINUM — veille · RWA · zero-trust · risk sleeve',
    tier: 'limited_guard',
    tierLabel: 'PLATINUM',
    icon: '🛡️',
    signalIntensity: 1,
    priceEgld: { min: 2.5, max: 20, list: 2.5 },
    priceEur: { min: 20, max: 90, list: 50 },
    maxSupply: PACK_EDITION.sentinel.maxSupply,
    seriesName: PACK_EDITION.sentinel.seriesName,
    strategies: ['GUARD', 'ALERT', 'DRAWDOWN_WATCH', 'BOARD_ALERT'],
    activity: 'Alertes sparses — focus protection & conformité',
    entitlements: [
      'Achat unique · NFT Genesis Sentinel (droits durables)',
      'NFT pack Sentinel + salle 3D Sentinel',
      'Salle Command « Sentinel » uniquement',
      'Alertes risk / drawdown board',
      'Certification RWA / zero-trust gates',
    ],
    features: SENTINEL_FEATURES,
    color: 'text-[color:var(--xa-pack-sentinel)]',
    borderClass: 'border-[color:var(--xa-pack-sentinel)]/40',
    domain: 'security',
    risk: 'guard',
    bps: 2500,
  },
]

/** Commercial EUR prices — display + client-side only; never trust for payment */
export const AGENT_PACKS_EUR = {
  pulse: { id: 'pulse', name: 'Pulse Pack (Gold)', priceEur: 110, priceCents: 11000 },
  yield: { id: 'yield', name: 'Yield Pack (Silver)', priceEur: 75, priceCents: 7500 },
  sentinel: { id: 'sentinel', name: 'Sentinel Pack (Platinum)', priceEur: 50, priceCents: 5000 },
} as const

export function isFullPack(id: PackId | string): boolean {
  return id === 'pulse'
}

export function mergePackFeatures(packs: PackId[]): PackFeatures {
  const base: PackFeatures = {
    room: false,
    commandHub: false,
    commandRoom: false,
    tca: false,
    liaFull: false,
    liveTapeFull: false,
    tradingSignals: false,
    defiSleeve: false,
    riskAlerts: false,
    agentStake: false,
    signalIntensity: 1,
    actionsPerWeek: '—',
  }
  const order: PackId[] = ['sentinel', 'yield', 'pulse']
  for (const id of order) {
    if (!packs.includes(id)) continue
    const f =
      id === 'pulse' ? PULSE_FEATURES : id === 'yield' ? YIELD_FEATURES : SENTINEL_FEATURES
    base.room = base.room || f.room
    base.commandHub = base.commandHub || f.commandHub
    base.commandRoom = base.commandRoom || f.commandRoom
    base.tca = base.tca || f.tca
    base.liaFull = base.liaFull || f.liaFull
    base.liveTapeFull = base.liveTapeFull || f.liveTapeFull
    base.tradingSignals = base.tradingSignals || f.tradingSignals
    base.defiSleeve = base.defiSleeve || f.defiSleeve
    base.riskAlerts = base.riskAlerts || f.riskAlerts
    base.agentStake = base.agentStake || f.agentStake
    base.signalIntensity = Math.max(base.signalIntensity, f.signalIntensity) as 1 | 2 | 3
  }
  if (packs.includes('pulse')) base.actionsPerWeek = PULSE_FEATURES.actionsPerWeek
  else if (packs.includes('yield')) base.actionsPerWeek = YIELD_FEATURES.actionsPerWeek
  else if (packs.includes('sentinel')) base.actionsPerWeek = SENTINEL_FEATURES.actionsPerWeek
  return base
}

export function getPack(id: PackId | string): AgentPackProfile | undefined {
  return AGENT_PACKS.find(p => p.id === id)
}

export function packMaxSupply(id: PackId): number {
  return PACK_EDITION[id].maxSupply
}
