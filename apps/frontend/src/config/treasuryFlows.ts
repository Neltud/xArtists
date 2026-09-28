/**
 * Modèle de flux trésorerie xArtists / LIA / $TRO
 * Paper-first · SC only après audit + GO_LIVE · pas de promesse de yield.
 *
 * On-chain aujourd’hui : venue-split (rentPay).
 * Marketplaces / pack mint / rewards_pool : après deploy + codeHash verify.
 * DEX externes (xExchange / OneDex) : hors custody xArtists — APR utilisateur, pas de partage auto.
 */

export type FlowBucket =
  | 'lia_treasury'
  | 'institution'
  | 'associations'
  | 'holders_rewards'
  | 'burn_tro'
  | 'creator_royalty'
  | 'protocol_fee'
  | 'pack_pool_pulse'
  | 'pack_pool_yield'
  | 'pack_pool_sentinel'

export type RevenueSource =
  | 'pack_paper'
  | 'ads_bid'
  | 'venue_rental'
  | 'marketplace_sale'
  | 'agents_marketplace'
  | 'slot_casino'
  | 'tip'
  | 'lp_fees_external'
  | 'farm_external'

/**
 * Répartition cible par source (somme = 100 sauf lp/farm externes).
 * venue_rental = on-chain immutable (SC venue-split BPS).
 */
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
  /** Mirror SC venue_split : 4000/2000/2500/1500 */
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
  /** Fee marketplace agents (fee_bps ≤ 1000) → claimFees owner → ops redistribue */
  agents_marketplace: {
    protocol_fee: 30,
    lia_treasury: 50,
    holders_rewards: 15,
    associations: 5,
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
  /** xExchange / OneDex — frais restent sur le DEX, pas dans un SC xArtists */
  lp_fees_external: {
    lia_treasury: 0,
  },
  /** Farms OneDex / xExchange — rewards claimables par le wallet user */
  farm_external: {
    lia_treasury: 0,
  },
}

/**
 * Sous-répartition du bucket holders_rewards issu des ventes pack_paper.
 * Aligné agentPacks.shareOfPackPoolBps (Pulse 40 · Yield 35 · Sentinel 25).
 * Les holders de NFT/SFT pack de la série reçoivent via rewards_pool (post-GO_LIVE).
 */
export const PACK_POOL_SHARE_BPS = {
  pulse: 4000,
  yield: 3500,
  sentinel: 2500,
} as const

/**
 * Burns TRO
 * - burn_direct : ESDT burn on-chain (irréversible)
 * - lp_burn : retirer LP puis burn tokens sous-jacents TRO (DAO only)
 */
export const BURN_POLICY = {
  maxSupply: 500_000,
  preferred: 'burn_direct' as const,
  lpBurn: {
    enabled: false,
    requiresDao: true,
    note: 'LP burn retire de la liquidité — réservé gouvernance, jamais automatique dans le front.',
  },
  marketplaceBurnBps: 500,
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
  /** Pack NFT/SFT = entitlement produit, pas autorisation financière client-side */
  packNftEntitlement: true,
  paperHolderNotAuthorization: true,
  externalAprNote:
    'APR xExchange / OneDex = rendement du LP de l’utilisateur. xArtists n’en prend pas custody ni ne promesse de yield.',
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

/** Répartit la part holders d’une vente pack vers les 3 pools pack */
export function splitPackHoldersShare(holdersAmount: number): {
  pulse: number
  yield: number
  sentinel: number
} {
  return {
    pulse: (holdersAmount * PACK_POOL_SHARE_BPS.pulse) / 10_000,
    yield: (holdersAmount * PACK_POOL_SHARE_BPS.yield) / 10_000,
    sentinel: (holdersAmount * PACK_POOL_SHARE_BPS.sentinel) / 10_000,
  }
}

export const FLOW_LABELS: Record<FlowBucket, string> = {
  lia_treasury: 'Trésorerie LIA',
  institution: 'Institution / musée',
  associations: 'Associations art',
  holders_rewards: 'Pool holders',
  burn_tro: 'Burn $TRO',
  creator_royalty: 'Royalties créateur',
  protocol_fee: 'Frais protocole',
  pack_pool_pulse: 'Pool pack Pulse',
  pack_pool_yield: 'Pool pack Yield',
  pack_pool_sentinel: 'Pool pack Sentinel',
}

export const SOURCE_LABELS: Record<RevenueSource, string> = {
  pack_paper: 'Vente pack IA (paper / mint)',
  ads_bid: 'Enchères pubs',
  venue_rental: 'Location mur musée (rentPay)',
  marketplace_sale: 'Marketplace NFT art',
  agents_marketplace: 'Marketplace agents IA',
  slot_casino: 'Slot (rake après jackpot)',
  tip: 'Tips',
  lp_fees_external: 'Frais LP xExchange/OneDex (externe)',
  farm_external: 'Farm rewards externes',
}
