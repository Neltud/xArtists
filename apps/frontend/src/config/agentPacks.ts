/**
 * Packs IA — Pulse · Yield · Sentinel uniquement.
 * Les tours artistiques sont un SERVICE séparé (pas un pack agent).
 * Voir data/art_tours.json · docs/ART_TOURS_SERVICE.md
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
      'Warps / deep-link (quand live)',
    ],
    notIncluded: ['Contrôle wallet LIA', 'Garantie de rendement', 'Produit GreenSmoke', 'Mandat de gestion'],
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
    notIncluded: ['APY annoncé', 'Soul mainnet funds', 'Mandat de gestion'],
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
    notIncluded: ['Exécution trading agressive', 'Mandat de gestion'],
    shareOfPackPoolBps: 2500,
    risk: 'low',
    color: 'text-sky-400',
    domain: 'risk',
  },
]

export const PACK_PRICING_POLICY = {
  ranking: 'Pulse (18€) > Yield (12€) > Sentinel (8€)',
  corridor: { min: PACK_PRICE_EUR.min, max: PACK_PRICE_EUR.max },
  note: 'Catalogue lié à la densité de signaux. Tours artistiques = service séparé, pas un pack.',
}

export const PACK_JOURNEY_STEPS = [
  {
    title: 'Choisir un pack IA',
    body: 'Pulse · Yield · Sentinel — plus de signaux = plus cher. LIA peut ajuster.',
  },
  {
    title: 'Connecter le wallet',
    body: 'erd1 utilisateur — jamais le wallet ops LIA.',
  },
  {
    title: 'Checkout / mint',
    body: 'Fiat ou on-chain selon SC + API. Intent paper si SC pending.',
  },
]

/** @deprecated — use ART_TOURS service, not an agent pack */
export const VOYAGE_AGENT = {
  id: 'art_tours',
  name: 'Tours artistiques',
  role: 'cultural_tours_not_ai_pack',
  packId: null as null,
} as const
