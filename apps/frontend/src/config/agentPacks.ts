/**
 * 3 packs IA — prix proportionnel à l’intensité de signaux / activité.
 * Pulse (le plus de signaux) > Yield > Sentinel (veille, peu de trades).
 * LIA (Vellum) affine dans 5–25 € pour la marge.
 * GSN = informational + signal only (pas un SKU).
 */

import { PACK_PRICE_EUR } from './multichain'

export type PackId = 'pulse' | 'yield' | 'sentinel'

export type AgentPackProfile = {
  id: PackId
  name: string
  tagline: string
  icon: string
  /** Intensité relative de signaux (1–3) — drive le prix catalogue */
  signalIntensity: 1 | 2 | 3
  priceEur: { min: number; max: number; list: number }
  strategies: string[]
  activity: string
  entitlements: string[]
  notIncluded: string[]
  shareOfPackPoolBps: number
  risk: 'medium' | 'lower' | 'low'
  color: string
}

export const AGENT_PACKS: AgentPackProfile[] = [
  {
    id: 'pulse',
    name: 'Pulse',
    tagline: 'Le plus de signaux · micro-arb · momentum · board',
    icon: '⚡',
    signalIntensity: 3,
    /** Plus cher = plus de signaux */
    priceEur: { min: 12, max: PACK_PRICE_EUR.max, list: 18 },
    strategies: ['MICRO_ARB', 'MOMENTUM', 'MEAN_REVERSION'],
    activity: 'Plusieurs cycles / jour — densité de signaux maximale',
    entitlements: [
      'NFT pack Pulse (badge + slot)',
      'Clé API limitée + journal haute fréquence',
      'Droit de part pool Pulse',
      'Warps / deep-link (quand live)',
    ],
    notIncluded: [
      'Contrôle wallet LIA',
      'Garantie de rendement',
      'Produit GreenSmoke',
      'Mandat de gestion',
    ],
    shareOfPackPoolBps: 4000,
    risk: 'medium',
    color: 'text-green-400',
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
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    tagline: 'Moins de trades · défense · veille risk',
    icon: '🛡️',
    signalIntensity: 1,
    /** Moins de signaux d’exécution → moins cher */
    priceEur: { min: PACK_PRICE_EUR.min, max: 15, list: 8 },
    strategies: ['DEFENSE', 'SOCIAL_WATCH', 'ADVISOR'],
    activity: 'Veille continue · peu d’exécutions · priorise HF / kill-switch',
    entitlements: [
      'NFT pack Sentinel',
      'Clé API limitée',
      'Droit de part pool Sentinel',
      'Alertes risk / Guardian (lecture)',
    ],
    notIncluded: ['Override Guardian', 'Promesse de rendement', 'Produit GreenSmoke'],
    shareOfPackPoolBps: 2500,
    risk: 'low',
    color: 'text-blue-400',
  },
]

export const GSN_POLICY = {
  role: 'informational_and_signal' as const,
  sold: false,
  description:
    'Leaderboard + forecasts : information et signal pré-trade uniquement. Pas de SKU, pas de prix pack.',
  weightCapNote: 'composite GSN/social capped (ex. 0.15)',
} as const

export const PACK_PRICING_POLICY = {
  rule: 'price_scales_with_signal_intensity',
  ranking: 'Pulse (18€) > Yield (12€) > Sentinel (8€)',
  corridor: { min: PACK_PRICE_EUR.min, max: PACK_PRICE_EUR.max },
  whoSetsPrice: 'LIA_vellum' as const,
  goal: 'margin_and_demand' as const,
  daoLater: 'pool_bps_and_treasury_split' as const,
  note:
    'Catalogue lié à la densité de signaux. LIA peut ajuster chaque list price dans son min/max (et le corridor global 5–25 €) pour la marge. DAO = BPS pool plus tard.',
} as const

export const PACK_JOURNEY_STEPS = [
  {
    id: 1,
    title: 'Choisir un pack',
    body: 'Pulse 18 € · Yield 12 € · Sentinel 8 € — plus de signaux = plus cher. LIA peut ajuster.',
  },
  {
    id: 2,
    title: 'Buy agent',
    body: 'Paiement → SC agents_marketplace. NFT + reçu. Droit produit, pas un fonds.',
  },
  {
    id: 3,
    title: 'Stake le NFT',
    body: 'Active le droit de part de pool. Sans stake : badge seulement.',
  },
  {
    id: 4,
    title: 'Deposit (option v1.5)',
    body: 'Escrow SC du pack — jamais wallet LIA ops.',
  },
  {
    id: 5,
    title: 'Claim epoch',
    body: 'User claim sa share. Non-custodial.',
  },
] as const

export const FUNDING_MODELS = {
  C_no_user_capital: {
    id: 'C',
    label: 'Droit produit seulement (v1)',
    recommended: true,
    risk: 'Pas de TVL trading user',
    when: 'Prix pack = accès + share pool. Pas de mandat de gestion.',
  },
  B_escrow_stake: {
    id: 'B',
    label: 'Stake + deposit escrow pack (v1.5)',
    recommended: false,
    risk: 'Surface SC plus large',
    when: 'Après deploy + audit escrow',
  },
  A_direct_to_agent: {
    id: 'A',
    label: 'Tokens → adresse agent libre',
    recommended: false,
    risk: 'Custody perception',
    when: 'Interdit produit',
  },
} as const
