/**
 * 3 packs IA commercialisés (≠ GreenSmoke, ≠ modules internes LIA).
 *
 * Product locks:
 * - list price v1 = 10 € / pack (LIA peut ajuster dans 5–25 € pour marge)
 * - GSN = informational + signal only (not sold)
 * - v1 = droit produit (model C), pas un mandat de gestion
 * - DAO peut plus tard voter les BPS de pool, pas le prix unitaire au quotidien
 */

import { PACK_PRICE_EUR } from './multichain'

export type PackId = 'pulse' | 'yield' | 'sentinel'

export type AgentPackProfile = {
  id: PackId
  name: string
  tagline: string
  icon: string
  priceEur: { min: number; max: number; list: number }
  strategies: string[]
  activity: string
  entitlements: string[]
  notIncluded: string[]
  shareOfPackPoolBps: number
  risk: 'medium' | 'lower' | 'low'
  color: string
}

const LIST = PACK_PRICE_EUR.list

export const AGENT_PACKS: AgentPackProfile[] = [
  {
    id: 'pulse',
    name: 'Pulse',
    tagline: 'Micro-mouvements · momentum · board MVX',
    icon: '⚡',
    priceEur: { min: PACK_PRICE_EUR.min, max: PACK_PRICE_EUR.max, list: LIST },
    strategies: ['MICRO_ARB', 'MOMENTUM', 'MEAN_REVERSION'],
    activity: 'Plusieurs cycles / jour (paper → micro live LIA ops)',
    entitlements: [
      'NFT pack (badge + slot)',
      'Clé API limitée (read status + journal pack)',
      'Droit de part pool Pulse (epoch / règles on-chain)',
      'Warps / deep-link pack (quand live)',
    ],
    notIncluded: [
      'Contrôle du wallet LIA protocole',
      'Garantie de rendement',
      'Produit GreenSmoke',
      'Mandat de gestion de fonds',
    ],
    shareOfPackPoolBps: 4000,
    risk: 'medium',
    color: 'text-green-400',
  },
  {
    id: 'yield',
    name: 'Yield',
    tagline: 'Hatom · LP · compound lent',
    icon: '🌾',
    priceEur: { min: PACK_PRICE_EUR.min, max: PACK_PRICE_EUR.max, list: LIST },
    strategies: ['YIELD', 'COMPOUND'],
    activity: '1–7 actions / semaine (lend, claim, rebalance)',
    entitlements: [
      'NFT pack Yield',
      'Clé API limitée',
      'Droit de part pool Yield',
      'Vue lecture Hatom/LP sleeve',
    ],
    notIncluded: ['Leverage illimité', 'Soul mainnet funds', 'APY annoncé', 'Mandat de gestion'],
    shareOfPackPoolBps: 3500,
    risk: 'lower',
    color: 'text-teal-400',
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    tagline: 'Défense · risk-off · capital preservation bias',
    icon: '🛡️',
    priceEur: { min: PACK_PRICE_EUR.min, max: PACK_PRICE_EUR.max, list: LIST },
    strategies: ['DEFENSE', 'SOCIAL_WATCH', 'ADVISOR'],
    activity: 'Veille continue · peu de trades · HF / kill-switch',
    entitlements: [
      'NFT pack Sentinel',
      'Clé API limitée',
      'Droit de part pool Sentinel',
      'Alertes risk / Guardian (lecture)',
    ],
    notIncluded: ['Override Guardian LIA', 'Promesse de rendement', 'Produit GreenSmoke'],
    shareOfPackPoolBps: 2500,
    risk: 'low',
    color: 'text-blue-400',
  },
]

/** GreenSmoke — jamais un pack à vendre */
export const GSN_POLICY = {
  role: 'informational_and_signal' as const,
  sold: false,
  description:
    'Leaderboard + forecasts : information et signal pré-trade (poids plafonné). Pas de SKU, pas de prix pack.',
  weightCapNote: 'social / GSN composite capped (ex. 0.15) dans SignalBus',
} as const

export const PACK_PRICING_POLICY = {
  listEur: PACK_PRICE_EUR.list,
  corridor: { min: PACK_PRICE_EUR.min, max: PACK_PRICE_EUR.max },
  whoSetsPrice: 'LIA_vellum' as const,
  goal: 'margin_and_demand' as const,
  daoLater: 'pool_bps_and_treasury_split' as const,
  note:
    'LIA fixe le prix listé (défaut 10 €) dans 5–25 € pour générer de la marge protocole. La DAO vote plus tard les BPS de répartition de pool, pas le micro-pricing quotidien.',
} as const

export const PACK_JOURNEY_STEPS = [
  {
    id: 1,
    title: 'Choisir un pack',
    body: `Pulse · Yield · Sentinel — ${LIST} € catalogue (LIA peut ajuster 5–25 €).`,
  },
  {
    id: 2,
    title: 'Buy agent',
    body: 'Paiement → SC agents_marketplace. NFT badge + reçu. Droit produit, pas un fonds.',
  },
  {
    id: 3,
    title: 'Stake le NFT',
    body: 'Active le droit de part de pool. Sans stake : badge seulement.',
  },
  {
    id: 4,
    title: 'Deposit (option v1.5)',
    body: 'Escrow SC du pack uniquement — jamais wallet LIA ops. v1 peut omettre cette étape.',
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
    label: 'Droit produit seulement (v1 verrouillé)',
    recommended: true,
    risk: 'Pas de TVL trading user — promesse claire',
    when: 'Prix pack 10 € = accès + share pool protocole. Pas de mandat de gestion.',
  },
  B_escrow_stake: {
    id: 'B',
    label: 'Stake + deposit escrow pack (v1.5)',
    recommended: false,
    risk: 'Surface SC plus large',
    when: 'Après agents_marketplace + escrow audit',
  },
  A_direct_to_agent: {
    id: 'A',
    label: 'Tokens → adresse agent libre',
    recommended: false,
    risk: 'Custody perception',
    when: 'Interdit produit',
  },
} as const
