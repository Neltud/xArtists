/**
 * Packs IA — prix proportionnel à l’intensité de signaux / activité.
 * Pulse > Yield > Sentinel · Voyage = sleeve thématique (travel / RWA mobility).
 * LIA (Vellum) affine dans 5–25 € pour la marge.
 * GSN = informational + signal only (pas un SKU).
 */

import { PACK_PRICE_EUR } from './multichain'

export type PackId = 'pulse' | 'yield' | 'sentinel' | 'voyage'

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
    notIncluded: [
      'Contrôle wallet LIA',
      'Garantie de rendement',
      'Produit GreenSmoke',
      'Mandat de gestion',
    ],
    shareOfPackPoolBps: 3500,
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
    shareOfPackPoolBps: 3000,
    risk: 'lower',
    color: 'text-teal-400',
    domain: 'defi',
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    tagline: 'Moins de trades · défense · veille risk',
    icon: '🛡️',
    signalIntensity: 1,
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
    shareOfPackPoolBps: 2000,
    risk: 'low',
    color: 'text-blue-400',
    domain: 'risk',
  },
  {
    id: 'voyage',
    name: 'Voyage',
    tagline: 'Agent de voyage · mobilité · RWA séjour · signaux culture/tourisme',
    icon: '✈️',
    signalIntensity: 2,
    priceEur: { min: 9, max: 22, list: 14 },
    strategies: ['TRAVEL_SIGNAL', 'RWA_STAY', 'CULTURE_FLOW'],
    activity:
      'Signaux destinations, corrélation crypto/tourisme, veille RWA hospitality — advisory only v1',
    entitlements: [
      'NFT pack Voyage (badge agent de voyage)',
      'Clé API limitée + journal travel signals',
      'Droit de part pool Voyage (quand pool live)',
      'Accès bandeau GSN domaine travel/culture',
    ],
    notIncluded: [
      'Réservation hôtelière réelle (hors scope v1)',
      'Custodie fonds voyage',
      'Garantie de séjour',
      'Produit GreenSmoke vendu',
    ],
    shareOfPackPoolBps: 1500,
    risk: 'lower',
    color: 'text-amber-300',
    domain: 'travel',
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
  ranking: 'Pulse (18€) > Voyage (14€) > Yield (12€) > Sentinel (8€)',
  corridor: { min: PACK_PRICE_EUR.min, max: PACK_PRICE_EUR.max },
  whoSetsPrice: 'LIA_vellum' as const,
  goal: 'margin_and_demand' as const,
  daoLater: 'pool_bps_and_treasury_split' as const,
  note:
    'Catalogue lié à la densité de signaux. Voyage = sleeve thématique (travel/RWA mobility). LIA ajuste list price dans min/max.',
} as const

export const PACK_JOURNEY_STEPS = [
  {
    id: 1,
    title: 'Choisir un pack',
    body: 'Pulse · Yield · Sentinel · Voyage — plus de signaux = plus cher. LIA peut ajuster.',
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

/** Agent de voyage — produit thématique (pas un tour operator on-chain v1). */
export const VOYAGE_AGENT = {
  id: 'voyage',
  name: 'Agent de Voyage',
  role: 'travel_signal_and_rwa_mobility',
  v1_scope: [
    'Signaux destinations / saisonnalité (paper)',
    'Corrélation crypto × tourisme (lecture)',
    'Veille RWA hospitality / culture',
    'Bandeau GSN domaine travel',
  ],
  v1_not: [
    'Booking réel hôtel/vol',
    'Custodie dépôt voyage',
    'Assurance voyage',
  ],
  packId: 'voyage' as PackId,
} as const
