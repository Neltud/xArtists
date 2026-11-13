/**
 * xArtists public TARGET prices — non-executable, no PSP/contract linkage.
 * Owner decision 2026-11-10: Pulse / Yield / Sentinel = 33 / 22 / 11 EGLD.
 * Historical VM 2026-11-08 = 1 / 5 / 2.5 EGLD. DIFFERENT => NO-GO.
 *
 * Mainstream EUR tiers are separate service subscriptions, no wallet or NFT.
 * VAT and detailed benefits not yet final; all checkouts remain disabled.
 */
export const GENESIS_PREVIEW = [
  { id: 'pulse', targetEgld: '33', observedEgld: '1', cap: 333, motif: '⚡' },
  { id: 'yield', targetEgld: '22', observedEgld: '5', cap: 500, motif: '◈' },
  { id: 'sentinel', targetEgld: '11', observedEgld: '2,5', cap: 777, motif: '◇' },
] as const

export const MAINSTREAM_PREVIEW = [
  { sku: 'fiat_379', price: '3,79', cents: 379, level: 1, includesNft: false, requiresWallet: false },
  { sku: 'fiat_579', price: '5,79', cents: 579, level: 2, includesNft: false, requiresWallet: false },
  { sku: 'fiat_979', price: '9,79', cents: 979, level: 3, includesNft: false, requiresWallet: false },
] as const

// Editorial description of analysis tracks; NOT mapped to a purchased EUR tier.
// Product/contract benefit mapping remains unapproved and no premium report is live.
export const XORUS_ANALYSIS_TRACKS_PREVIEW = [
  {
    id: 'pulse', scope: 'analysis:markets',
    frName: 'Pulse · Marchés', enName: 'Pulse · Markets',
    frDescription: 'Lecture des tendances, couverture des signaux et zones d’incertitude.',
    enDescription: 'Market trends, signal coverage and areas of uncertainty.',
  },
  {
    id: 'yield', scope: 'analysis:defi',
    frName: 'Yield · DeFi', enName: 'Yield · DeFi',
    frDescription: 'Étude des protocoles, de la liquidité et des risques DeFi, sans APY garanti.',
    enDescription: 'Protocol, liquidity and DeFi risk research, with no guaranteed yield.',
  },
  {
    id: 'sentinel', scope: 'analysis:risk',
    frName: 'Sentinel · Risques', enName: 'Sentinel · Risk',
    frDescription: 'Scénarios adverses, qualité des preuves et facteurs de veto.',
    enDescription: 'Downside scenarios, evidence quality and veto factors.',
  },
] as const

export const GENESIS_TARGETS_BY_ID = {
  pulse: GENESIS_PREVIEW[0],
  yield: GENESIS_PREVIEW[1],
  sentinel: GENESIS_PREVIEW[2],
} as const

// Deliberately separate from AGENT_PACK_SC_SNAPSHOT (chain data).
export const PUBLIC_COMMERCE_TARGETS_ONLY = true as const
export const PUBLIC_PURCHASE_ENABLED = false as const

// Permanent product boundary: an EUR subscription grants service access only.
// Never use a one-off PayBox/Stripe card charge to buy, reserve or mint a Genesis NFT.
// There is no environment override. New commercial rails need a separate review.
export const FIAT_PACK_NFT_PURCHASE_SUPPORTED = false as const
