/**
 * Packs IA NFT — différenciation forte :
 * - Pulse  = PACK COMPLET (full suite)
 * - Yield  = limité DeFi / LP / claim
 * - Sentinel = limité veille / alertes / risk
 */

import { PACK_PRICE_EGLD, PACK_PRICE_EUR } from './multichain'

export type PackId = 'pulse' | 'yield' | 'sentinel'

/** Feature flags par pack — source de vérité UI + gates */
export type PackFeatures = {
  /** Salle 3D dédiée (1 pack = 1 salle) */
  room: boolean
  /** Command Center hub interactif (mur holo, tape, signaux) */
  commandHub: boolean
  /** Salle CC nommée (pulse / yield / sentinel) */
  commandRoom: boolean
  /** TCA / classroom (1 an conceptuel avec Pulse) */
  tca: boolean
  /** LIA hub panels complets (shadow, matrix, intents) */
  liaFull: boolean
  /** Live multi-asset tape (BTC ETH SOL TAO EGLD GOLD EUR) */
  liveTapeFull: boolean
  /** Signaux trading HF (momentum / micro-arb) */
  tradingSignals: boolean
  /** Vues Hatom / LP / compound (lecture) */
  defiSleeve: boolean
  /** Alertes risk / drawdown */
  riskAlerts: boolean
  /** Stake NFT agent / claim clone (quand SC) */
  agentStake: boolean
  /** Intensité signal 1–3 */
  signalIntensity: 1 | 2 | 3
  /** Actions / semaine (ordre de grandeur UX) */
  actionsPerWeek: string
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
  notIncluded: string[]
  limits: string[]
  features: PackFeatures
  shareOfPackPoolBps: number
  risk: 'medium' | 'lower' | 'low'
  color: string
  borderClass: string
  domain?: string
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
  commandHub: false,
  commandRoom: true,
  tca: false,
  liaFull: false,
  liveTapeFull: false,
  tradingSignals: false,
  defiSleeve: true,
  riskAlerts: false,
  agentStake: true,
  signalIntensity: 2,
  actionsPerWeek: '1–7 / semaine',
}

const SENTINEL_FEATURES: PackFeatures = {
  room: true,
  commandHub: false,
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

export const AGENT_PACKS: AgentPackProfile[] = [
  {
    id: 'pulse',
    name: 'Pulse',
    tagline: 'Pack complet — signaux HF · CC · TCA · LIA · multi-actifs',
    tier: 'full',
    tierLabel: 'COMPLET',
    icon: '⚡',
    signalIntensity: 3,
    priceEgld: { min: 10, max: PACK_PRICE_EGLD.max, list: 25 },
    priceEur: { min: 45, max: PACK_PRICE_EUR.max, list: 110 },
    strategies: ['MICRO_ARB', 'MOMENTUM', 'MEAN_REVERSION', 'BOARD_TICK'],
    activity: 'Plusieurs cycles / jour — densité de signaux maximale',
    entitlements: [
      'NFT pack Pulse (badge + salle 3D)',
      'Command Center hub + salle Pulse',
      'TCA / classroom (accès produit)',
      'LIA hub complet (shadow, matrix, intents)',
      'Live tape BTC ETH SOL TAO EGLD GOLD EUR',
      'Signaux trading HF (paper jusqu’à gates live)',
      'Vues DeFi + risk inclus',
      'Droit de part pool Pulse',
    ],
    notIncluded: [
      'Contrôle wallet LIA protocole',
      'Garantie de rendement',
      'Mandat de gestion',
      'Travel / booking',
    ],
    limits: ['Full suite — pas de plafond de modules UI pack'],
    features: PULSE_FEATURES,
    shareOfPackPoolBps: 4000,
    risk: 'medium',
    color: 'text-emerald-400',
    borderClass: 'border-emerald-400/40',
    domain: 'trading',
  },
  {
    id: 'yield',
    name: 'Yield',
    tagline: 'Limité DeFi — LP · Hatom · compound · pas de trading HF',
    tier: 'limited_defi',
    tierLabel: 'LIMITÉ · DEFI',
    icon: '🌾',
    signalIntensity: 2,
    priceEgld: { min: 10, max: 30, list: 15 },
    priceEur: { min: 45, max: 135, list: 68 },
    strategies: ['YIELD', 'COMPOUND', 'LP_REBALANCE', 'HATOM_VIEW'],
    activity: '1–7 actions / semaine — yield / claim uniquement',
    entitlements: [
      'NFT pack Yield + salle 3D Yield',
      'Salle Command « Yield » uniquement',
      'Vue lecture Hatom / LP sleeve',
      'Signaux yield / compound (pas micro-arb)',
      'Droit de part pool Yield',
    ],
    notIncluded: [
      'Trading HF / momentum / micro-arb',
      'TCA classroom',
      'LIA hub complet',
      'Live tape multi-actifs full',
      'APY annoncé',
      'Mandat de gestion',
    ],
    limits: [
      'Pas de hub CC interactif (mur holo full)',
      'Pas de TCA',
      'Pas de stratégies MICRO_ARB / MOMENTUM',
      'Tape prix limitée (stable / DeFi focus)',
    ],
    features: YIELD_FEATURES,
    shareOfPackPoolBps: 3500,
    risk: 'lower',
    color: 'text-teal-400',
    borderClass: 'border-teal-400/35',
    domain: 'defi',
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    tagline: 'Limité veille — alertes · risk sleeve · pas d’exécution agressive',
    tier: 'limited_guard',
    tierLabel: 'LIMITÉ · GUARD',
    icon: '🛡️',
    signalIntensity: 1,
    priceEgld: { min: PACK_PRICE_EGLD.min, max: 20, list: 10 },
    priceEur: { min: PACK_PRICE_EUR.min, max: 90, list: 45 },
    strategies: ['GUARD', 'ALERT', 'DRAWDOWN_WATCH', 'BOARD_ALERT'],
    activity: 'Alertes sparses — focus protection',
    entitlements: [
      'NFT pack Sentinel + salle 3D Sentinel',
      'Salle Command « Sentinel » uniquement',
      'Alertes risk / drawdown board',
      'Droit de part pool Sentinel',
    ],
    notIncluded: [
      'Exécution trading agressive',
      'TCA classroom',
      'LIA hub complet',
      'Live tape multi-actifs full',
      'Stratégies yield / LP actives',
      'Mandat de gestion',
    ],
    limits: [
      'Pas de hub CC interactif full',
      'Pas de TCA',
      'Pas de MICRO_ARB / YIELD actif',
      'Signal intensity minimale',
    ],
    features: SENTINEL_FEATURES,
    shareOfPackPoolBps: 2500,
    risk: 'low',
    color: 'text-sky-400',
    borderClass: 'border-sky-400/35',
    domain: 'risk',
  },
]

export function getPack(id: PackId): AgentPackProfile | undefined {
  return AGENT_PACKS.find(p => p.id === id)
}

export function isFullPack(id: PackId): boolean {
  return id === 'pulse'
}

export function packHasFeature(id: PackId, feature: keyof PackFeatures): boolean {
  const p = getPack(id)
  if (!p) return false
  const v = p.features[feature]
  return typeof v === 'boolean' ? v : Boolean(v)
}

/** Agrège les features de plusieurs packs détenus (Pulse domine). */
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
  for (const id of packs) {
    const f = getPack(id)?.features
    if (!f) continue
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

export const PACK_PRICING_POLICY = {
  ranking: 'Pulse COMPLET (25 EGLD) > Yield limité (15) > Sentinel limité (10)',
  corridorEgld: { min: PACK_PRICE_EGLD.min, max: PACK_PRICE_EGLD.max },
  corridor: { min: PACK_PRICE_EUR.min, max: PACK_PRICE_EUR.max },
  listEgld: 25,
  listEur: 110,
  note: 'Floor 10 EGLD. Pulse = full suite. Yield/Sentinel = modules bridés. Pas une promesse de rendement.',
}

export const PACK_JOURNEY_STEPS = [
  {
    id: '1',
    title: 'Choisir un pack IA',
    body: 'Pulse (complet) · Yield (DeFi limité) · Sentinel (guard limité).',
  },
  {
    id: '2',
    title: 'Connecter le wallet',
    body: 'erd1 utilisateur — jamais le wallet ops LIA.',
  },
  {
    id: '3',
    title: 'Checkout / mint NFT',
    body: 'Fiat ou on-chain selon SC. Aperçu appareil ≠ achat.',
  },
]

export const FUNDING_MODELS = {
  C_no_user_capital: {
    id: 'C',
    when: "Aucun capital utilisateur n'est confié à LIA pour exécution trading. Packs = accès signal + droit de pool uniquement.",
  },
} as const

export const GSN_POLICY = {
  description:
    'Gas Station Network optionnel pour micro-tx (mint / claim) — utilisateur peut payer gas ou sponsor limité.',
} as const
