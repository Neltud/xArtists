/**
 * Packs IA NFT — hiérarchie B2B :
 * - Pulse  = GOLD (full suite, HF signals)
 * - Yield  = SILVER (DeFi / LP / claim)
 * - Sentinel = PLATINUM (veille / RWA / zero-trust)
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
  strategies: string[]
  activity: string
  entitlements: string[]
  features: PackFeatures
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
    priceEgld: { min: 10, max: PACK_PRICE_EGLD.max, list: 25 },
    priceEur: { min: 45, max: PACK_PRICE_EUR.max, list: 110 },
    strategies: ['MICRO_ARB', 'MOMENTUM', 'MEAN_REVERSION', 'BOARD_TICK'],
    activity: 'Plusieurs cycles / jour — densité de signaux maximale',
    entitlements: [
      'NFT pack Pulse (badge + salle 3D)',
      'Command Center full + salles Pulse/Yield/Sentinel',
      'TCA classroom (1 an conceptuel)',
      'LIA hub panels + live tape multi-actifs',
      'Signaux trading HF (paper → xPortal)',
    ],
    features: PULSE_FEATURES,
    color: 'text-amber-300',
    borderClass: 'border-amber-400/40',
    domain: 'signals',
    risk: 'active',
    bps: 5000,
  },
  {
    id: 'yield',
    name: 'Yield',
    tagline: 'Pack SILVER — DeFi / LP / claim · sleeve rendement',
    tier: 'limited_defi',
    tierLabel: 'SILVER',
    icon: '📈',
    signalIntensity: 2,
    priceEgld: { min: PACK_PRICE_EGLD.min, max: 22, list: 15 },
    priceEur: { min: PACK_PRICE_EUR.min, max: 100, list: 65 },
    strategies: ['YIELD_OPT', 'LP_WATCH', 'COMPOUND_READ'],
    activity: 'Cycles DeFi réguliers — focus pool & staking',
    entitlements: [
      'NFT pack Yield + salle 3D Yield',
      'Salle Command « Yield »',
      'Vues Hatom / LP / compound (lecture)',
      'Stake NFT agent / claim (quand SC)',
    ],
    features: YIELD_FEATURES,
    color: 'text-slate-300',
    borderClass: 'border-slate-400/35',
    domain: 'defi',
    risk: 'lower',
    bps: 3500,
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    tagline: 'Pack PLATINUM — veille · RWA · zero-trust · risk sleeve',
    tier: 'limited_guard',
    tierLabel: 'PLATINUM',
    icon: '🛡️',
    signalIntensity: 1,
    priceEgld: { min: PACK_PRICE_EGLD.min, max: 20, list: 10 },
    priceEur: { min: PACK_PRICE_EUR.min, max: 90, list: 45 },
    strategies: ['GUARD', 'ALERT', 'DRAWDOWN_WATCH', 'BOARD_ALERT'],
    activity: 'Alertes sparses — focus protection & conformité',
    entitlements: [
      'NFT pack Sentinel + salle 3D Sentinel',
      'Salle Command « Sentinel » uniquement',
      'Alertes risk / drawdown board',
      'Certification RWA / zero-trust gates',
    ],
    features: SENTINEL_FEATURES,
    color: 'text-violet-300',
    borderClass: 'border-violet-400/40',
    domain: 'security',
    risk: 'guard',
    bps: 2500,
  },
]

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
