/**
 * Packs IA NFT — Pulse · Yield · Sentinel UNIQUEMENT.
 * Tours artistiques = service séparé (/tours) — PAS un pack agent.
 */

import { PACK_PRICE_EUR } from './multichain'

export type PackId = 'pulse' | 'yield' | 'sentinel'

export type AgentPackProfile = {
  id: PackId
  name: string
  tagline: string
  icon: string
  signalIntensity: 1 | 2 | 3
  priceEur: { min: number; max: number; list: number }
  strategies: string[]
  activity: string
  entitlements: string[]
  notIncluded: string[]
  shareOfPackPoolBps: number
  risk: 'medium' | 'lower' | 'low'
  color: string
  domain?: string
}

export const AGENT_PACKS: AgentPackProfile[] = [
  {
    id: 'pulse',
    name: 'Pulse',
    tagline: 'Le plus de signaux · micro-arb · momentum · board',
    icon: '⚡',
    signalIntensity: 3,
    priceEur: { min: 12, max: PACK_PRICE_EUR.max, list: 18 },
    strategies: ['MICRO_ARB', 'MOMENTUM', 'MEAN_REVERSION'],
    activity: 'Plusieurs cycles / jour — densité de signaux maximale',
    entitlements: [
      'NFT pack Pulse (badge + slot)',
      'Clé API limitée + journal haute fréquence',
      'Droit de part pool Pulse',
    ],
    notIncluded: [
      'Contrôle wallet LIA',
      'Garantie de rendement',
      'Travel / booking',
      'Mandat de gestion',
    ],
    shareOfPackPoolBps: 4000,
    risk: 'medium',
    color: 'text-green-400',
    domain: 'trading',
  },
  {
    id: 'yield',
    name: 'Yield',
    tagline: 'Signaux moyens · Hatom · LP · compound',
    icon: '🌾',
    signalIntensity: 2,
    priceEur: { min: 8, max: 20, list: 12 },
    strategies: ['YIELD', 'COMPOUND'],
    activity: '1–7 actions / semaine — signaux yield / claim',
    entitlements: [
      'NFT pack Yield',
      'Clé API limitée',
      'Droit de part pool Yield',
      'Vue lecture Hatom/LP sleeve',
    ],
    notIncluded: ['APY annoncé', 'Travel / booking', 'Mandat de gestion'],
    shareOfPackPoolBps: 3500,
    risk: 'lower',
    color: 'text-teal-400',
    domain: 'defi',
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    tagline: 'Veille · alertes · risk sleeve',
    icon: '🛡️',
    signalIntensity: 1,
    priceEur: { min: PACK_PRICE_EUR.min, max: 15, list: 8 },
    strategies: ['GUARD', 'ALERT'],
    activity: 'Alertes sparses — focus protection',
    entitlements: ['NFT pack Sentinel', 'Alertes board', 'Droit de part pool Sentinel'],
    notIncluded: ['Exécution trading agressive', 'Travel / booking', 'Mandat de gestion'],
    shareOfPackPoolBps: 2500,
    risk: 'low',
    color: 'text-sky-400',
    domain: 'risk',
  },
]

export const PACK_PRICING_POLICY = {
  ranking: 'Pulse (18€) > Yield (12€) > Sentinel (8€)',
  corridor: { min: PACK_PRICE_EUR.min, max: PACK_PRICE_EUR.max },
  listEur: 18,
  note: 'Catalogue lié à la densité de signaux. Tours artistiques = service séparé, pas un pack IA.',
}

export const PACK_JOURNEY_STEPS = [
  {
    id: '1',
    title: 'Choisir un pack IA',
    body: 'Pulse · Yield · Sentinel uniquement. Pas de travel agent.',
  },
  {
    id: '2',
    title: 'Connecter le wallet',
    body: 'erd1 utilisateur — jamais le wallet ops LIA.',
  },
  {
    id: '3',
    title: 'Checkout / mint NFT',
    body: 'Fiat ou on-chain selon SC + API. Intent paper si SC pending.',
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
