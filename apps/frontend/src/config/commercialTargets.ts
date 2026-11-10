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

export const GENESIS_TARGETS_BY_ID = {
  pulse: GENESIS_PREVIEW[0],
  yield: GENESIS_PREVIEW[1],
  sentinel: GENESIS_PREVIEW[2],
} as const

// Deliberately separate from AGENT_PACK_SC_SNAPSHOT (chain data).
export const PUBLIC_COMMERCE_TARGETS_ONLY = true as const
export const PUBLIC_PURCHASE_ENABLED = false as const
