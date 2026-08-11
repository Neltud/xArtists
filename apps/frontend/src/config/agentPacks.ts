/**
 * Les 3 profils pack IA commercialisés (≠ GreenSmoke, ≠ 6 modules internes LIA).
 * Prix : LIA propose dans [PACK_PRICE_EUR.min, max] ; settlement on-chain après agents_marketplace.
 */

import { PACK_PRICE_EUR } from './multichain'

export type PackId = 'pulse' | 'yield' | 'sentinel'

export type AgentPackProfile = {
  id: PackId
  name: string
  tagline: string
  icon: string
  /** Bornes EUR — LIA affine le prix listé */
  priceEur: { min: number; max: number; default: number }
  /** Stratégies LIA mirrorées (paper/live selon gates) */
  strategies: string[]
  /** Fréquence indicative d’activité */
  activity: string
  /** Ce que le holder reçoit concrètement */
  entitlements: string[]
  /** Ce que ce n’est PAS */
  notIncluded: string[]
  /** % indicatif du pool de partage pack (doc produit, pas un APY) */
  shareOfPackPoolBps: number
  risk: 'medium' | 'lower' | 'low'
  color: string
}

/**
 * Trois packs seulement — clarté UX.
 * Les anciens labels (Trading/Marketplace/Security/RWA/DAO) restent des
 * *modules internes* LIA, pas des SKU à vendre.
 */
export const AGENT_PACKS: AgentPackProfile[] = [
  {
    id: 'pulse',
    name: 'Pulse',
    tagline: 'Micro-mouvements · momentum · board MVX',
    icon: '⚡',
    priceEur: { min: PACK_PRICE_EUR.min, max: 15, default: 12 },
    strategies: ['MICRO_ARB', 'MOMENTUM', 'MEAN_REVERSION'],
    activity: 'Plusieurs cycles / jour (paper → micro live LIA ops)',
    entitlements: [
      'NFT pack (badge + slot)',
      'Clé API limitée (read status + journal pack)',
      'Part du pool Pulse selon règles on-chain / epoch',
      'Accès Warps / deep-link pack (quand live)',
    ],
    notIncluded: [
      'Contrôle du wallet LIA protocole',
      'Garantie de rendement',
      'Agents GreenSmoke',
    ],
    shareOfPackPoolBps: 4000, // 40 % du pool packs → Pulse holders (indicatif v1)
    risk: 'medium',
    color: 'text-green-400',
  },
  {
    id: 'yield',
    name: 'Yield',
    tagline: 'Hatom · LP · compound lent',
    icon: '🌾',
    priceEur: { min: 8, max: 20, default: 15 },
    strategies: ['YIELD', 'COMPOUND'],
    activity: '1–7 actions / semaine (lend, claim, rebalance)',
    entitlements: [
      'NFT pack Yield',
      'Clé API limitée',
      'Part du pool Yield (fees / sleeve yield alloué)',
      'Vue positions Hatom/LP liées au sleeve (lecture)',
    ],
    notIncluded: [
      'Leverage illimité',
      'Soul mainnet funds',
      'APY annoncé',
    ],
    shareOfPackPoolBps: 3500,
    risk: 'lower',
    color: 'text-teal-400',
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    tagline: 'Défense · risk-off · capital preservation bias',
    icon: '🛡️',
    priceEur: { min: 10, max: PACK_PRICE_EUR.max, default: 18 },
    strategies: ['DEFENSE', 'SOCIAL_WATCH', 'ADVISOR'],
    activity: 'Veille continue · peu de trades · priorise HF / kill-switch',
    entitlements: [
      'NFT pack Sentinel',
      'Clé API limitée',
      'Part du pool Sentinel (plus stable, plus bas upside)',
      'Alertes risk / Guardian (lecture)',
    ],
    notIncluded: [
      'Chasse au rendement agressif',
      'Override du Guardian LIA',
    ],
    shareOfPackPoolBps: 2500,
    risk: 'low',
    color: 'text-blue-400',
  },
]

export const PACK_JOURNEY_STEPS = [
  {
    id: 1,
    title: 'Choisir un pack',
    body: 'Pulse · Yield · Sentinel. Prix affiché = proposition LIA dans la fourchette.',
  },
  {
    id: 2,
    title: 'Acheter (Buy agent)',
    body: 'Paiement EGLD (ou stable listé) → SC agents_marketplace. Reçu on-chain + mint NFT badge.',
  },
  {
    id: 3,
    title: 'Stake le NFT agent',
    body: 'Le NFT entre en stake (slot actif). Sans stake : badge cosmétique, pas de part de pool.',
  },
  {
    id: 4,
    title: 'Provisionner (optionnel)',
    body: 'Envoyer des tokens vers l’escrow *du pack* (pas le wallet LIA ops). Cap par pack. LIA n’y touche qu’avec règles SC.',
  },
  {
    id: 5,
    title: 'Epoch & claim',
    body: 'À chaque epoch, split du pool pack → holders stakés. Claim user (non-custodial).',
  },
] as const

/**
 * Deux modèles de “envoyer des tokens” — on recommande B pour la clarté juridique/UX.
 */
export const FUNDING_MODELS = {
  A_direct_to_agent: {
    id: 'A',
    label: 'Tokens → adresse agent isolée',
    recommended: false,
    risk: 'Confusion avec LIA ops ; comptabilité difficile ; custody perception',
    when: 'Uniquement si SC escrow dédié par agent_id + claimFees clair',
  },
  B_escrow_stake: {
    id: 'B',
    label: 'Stake NFT + deposit escrow pack (recommandé)',
    recommended: true,
    risk: 'Plus de surface SC, mais parcours lisible',
    when: 'Buy → stake → deposit(amount) → share epoch → withdraw unstake',
  },
  C_no_user_capital: {
    id: 'C',
    label: 'Pack = droit de part sur perf LIA protocole seulement',
    recommended: true,
    risk: 'Moins de TVL user ; promesse plus simple',
    when: 'v1 : prix pack seul finance le droit ; pas de dépôt user dans le book de trading',
  },
} as const
