/**
 * Modèle de flux trésorerie xArtists / LIA / $TRO
 * Paper-first · SC only après audit + GO_LIVE · pas de promesse de yield.
 *
 * RÈGLE MARCHÉ ART / SFT : le vendeur reçoit ≥ 90 % du prix de vente.
 * fee_bps + royalty_bps ≤ 1000 (10 %). Voir contracts/nft-marketplace.
 */

export type FlowBucket =
  | 'seller'
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
 * Marketplace art (NFT/SFT) — répartition du PRIX DE VENTE (100 %).
 * Vendeur ≥ 90 %. Le reste (≤ 10 %) = fee protocole + royalties créateur.
 *
 * Défaut recommandé au list :
 *   fee_bps = 300 (3 % protocol) · royalty_bps = 700 (7 % créateur)
 *   → seller = 90 %
 * Ou fee 500 + royalty 500 → seller 90 %.
 */
export const MARKETPLACE_SALE_SPLIT = {
  /** Garantie SC : fee + royalty ≤ 1000 bps */
  maxFeePlusRoyaltyBps: 1000,
  minSellerBps: 9000,
  /** Déploy init recommandé */
  defaultFeeBps: 300,
  /** Listing défaut si le token n’impose pas d’autre royalty ESDT */
  defaultRoyaltyBps: 700,
  /** Cap SC individuels */
  maxFeeBps: 1000,
  maxRoyaltyBps: 1000,
} as const

/**
 * Sous-répartition du SEUL protocol fee (après claimFees),
 * pas du prix total de l’œuvre.
 */
export const PROTOCOL_FEE_REDISTRIBUTION = {
  lia_treasury: 70,
  holders_rewards: 20,
  burn_tro: 10,
} as const

/**
 * Matrice agrégée — pour marketplace_sale les % sont sur le PRIX TOTAL
 * (seller inclus). Pour les autres sources, pas de « seller ».
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
  venue_rental: {
    institution: 40,
    associations: 20,
    lia_treasury: 25,
    holders_rewards: 15,
  },
  /**
   * Vente œuvre NFT/SFT (secondaire ou listé).
   * Exemple défaut 90 / 7 / 3 — ajustable tant que seller ≥ 90.
   */
  marketplace_sale: {
    seller: 90,
    creator_royalty: 7,
    protocol_fee: 3,
  },
  agents_marketplace: {
    seller: 90,
    protocol_fee: 10,
  },
  slot_casino: {
    lia_treasury: 55,
    holders_rewards: 30,
    associations: 15,
  },
  tip: {
    lia_treasury: 100,
  },
  lp_fees_external: {
    lia_treasury: 0,
  },
  farm_external: {
    lia_treasury: 0,
  },
}

export const PACK_POOL_SHARE_BPS = {
  pulse: 4000,
  yield: 3500,
  sentinel: 2500,
} as const

export const BURN_POLICY = {
  maxSupply: 500_000,
  preferred: 'burn_direct' as const,
  lpBurn: {
    enabled: false,
    requiresDao: true,
    note: 'LP burn retire de la liquidité — réservé gouvernance, jamais automatique dans le front.',
  },
  /** Part du protocol_fee convertie / brûlée en TRO (ops, post claim) */
  marketplaceBurnBpsOfProtocolFee: 1000, // 10 % du fee protocole
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

/** Split prix œuvre : vendeur / royalty / fee (bps explicites) */
export function splitArtworkSale(
  price: number,
  feeBps: number = MARKETPLACE_SALE_SPLIT.defaultFeeBps,
  royaltyBps: number = MARKETPLACE_SALE_SPLIT.defaultRoyaltyBps,
): { seller: number; royalty: number; protocolFee: number; sellerBps: number } {
  const fee = Math.min(feeBps, MARKETPLACE_SALE_SPLIT.maxFeeBps)
  const roy = Math.min(royaltyBps, MARKETPLACE_SALE_SPLIT.maxRoyaltyBps)
  if (fee + roy > MARKETPLACE_SALE_SPLIT.maxFeePlusRoyaltyBps) {
    throw new Error('fee+royalty exceed 10% — seller must receive >= 90%')
  }
  return {
    seller: (price * (10_000 - fee - roy)) / 10_000,
    royalty: (price * roy) / 10_000,
    protocolFee: (price * fee) / 10_000,
    sellerBps: 10_000 - fee - roy,
  }
}

/** Redistribue le protocol fee accumulé (après claimFees) */
export function splitProtocolFee(feeAmount: number): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [k, pct] of Object.entries(PROTOCOL_FEE_REDISTRIBUTION)) {
    out[k] = (feeAmount * pct) / 100
  }
  return out
}

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

/** Agrège plusieurs flux (ex. dashboard trésorerie lecture seule) */
export function aggregateFlows(
  entries: { source: RevenueSource; amount: number }[],
): Record<string, number> {
  const total: Record<string, number> = {}
  for (const e of entries) {
    const part = splitAmount(e.source, e.amount)
    for (const [k, v] of Object.entries(part)) {
      total[k] = (total[k] || 0) + v
    }
  }
  return total
}

export const FLOW_LABELS: Record<FlowBucket, string> = {
  seller: 'Vendeur (≥ 90 %)',
  lia_treasury: 'Trésorerie LIA',
  institution: 'Institution / musée',
  associations: 'Associations art',
  holders_rewards: 'Pool holders',
  burn_tro: 'Burn $TRO',
  creator_royalty: 'Royalties créateur / collection',
  protocol_fee: 'Frais protocole',
  pack_pool_pulse: 'Pool pack Pulse',
  pack_pool_yield: 'Pool pack Yield',
  pack_pool_sentinel: 'Pool pack Sentinel',
}

export const SOURCE_LABELS: Record<RevenueSource, string> = {
  pack_paper: 'Vente pack IA (paper / mint)',
  ads_bid: 'Enchères pubs',
  venue_rental: 'Location mur musée (rentPay)',
  marketplace_sale: 'Marketplace NFT/SFT art',
  agents_marketplace: 'Marketplace agents IA',
  slot_casino: 'Slot (rake après jackpot)',
  tip: 'Tips',
  lp_fees_external: 'Frais LP xExchange/OneDex (externe)',
  farm_external: 'Farm rewards externes',
}
