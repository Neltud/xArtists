/**
 * Modèle de flux trésorerie xArtists / LIA / $TRO
 * Paper-first · SC only après audit + GO_LIVE · pas de promesse de yield.
 */

export type FlowBucket =
  | 'lia_treasury'
  | 'institution'
  | 'associations'
  | 'holders_rewards'
  | 'burn_tro'
  | 'creator_royalty'
  | 'protocol_fee'

export type RevenueSource =
  | 'pack_paper'
  | 'ads_bid'
  | 'venue_rental'
  | 'marketplace_sale'
  | 'slot_casino'
  | 'tip'
  | 'lp_fees_external'

/** Répartition cible par source (somme ≤ 100 ; reste = buffer ops) */
export const TREASURY_FLOW_MATRIX: Record<
  RevenueSource,
  Partial<Record<FlowBucket, number>>
> = {
  pack_paper: {
    lia_treasury: 70,
    holders_rewards: 20,
    associations: 10,
  },
  ads_bid: {
    lia_treasury: 60,
    holders_rewards: 25,
    associations: 15,
  },
  venue_rental: {
    institution: 40,
    associations: 20,
    lia_treasury: 25,
    holders_rewards: 15,
  },
  marketplace_sale: {
    creator_royalty: 70,
    protocol_fee: 20,
    burn_tro: 5,
    holders_rewards: 5,
  },
  slot_casino: {
    // Jackpot user d’abord (hors matrice) ; reste rake :
    lia_treasury: 55,
    holders_rewards: 30,
    associations: 15,
  },
  tip: {
    lia_treasury: 100,
  },
  lp_fees_external: {
    // Frais DEX externes (xExchange/OneDex) — hors SC xArtists
    lia_treasury: 0,
  },
}

/**
 * Burns TRO
 * - burn_direct : ESDT burn on-chain (irréversible)
 * - lp_burn : retirer LP puis burn tokens sous-jacents TRO (plus agressif, impacte profondeur)
 * Recommandation : burn_direct sur fees marketplace ; pas de LP burn auto sans vote DAO.
 */
export const BURN_POLICY = {
  maxSupply: 500_000,
  preferred: 'burn_direct' as const,
  lpBurn: {
    enabled: false,
    requiresDao: true,
    note: 'LP burn retire de la liquidité — réservé gouvernance, jamais automatique dans le front.',
  },
  marketplaceBurnBps: 500, // 5% du protocol_fee en équivalent TRO si convertible
  venueOptionalBurnBps: 0,
} as const

export const HOLDERS_REWARD_ELIGIBILITY = {
  troLpPools: [
    'TRO/USDC',
    'TRO/MEX',
    'TRO/EGLD',
    'TRO/USDT',
    'TRO/WBTC',
    'TRO/WETH',
    'TRO/XOXNO',
    'TRO/WDAI',
  ],
  artPassStaked: true,
  paperHolderNotAuthorization: true,
} as const

export function splitAmount(
  source: RevenueSource,
  amount: number,
): Record<string, number> {
  const row = TREASURY_FLOW_MATRIX[source] || {}
  const out: Record<string, number> = {}
  for (const [k, pct] of Object.entries(row)) {
    out[k] = (amount * (pct || 0)) / 100
  }
  return out
}
