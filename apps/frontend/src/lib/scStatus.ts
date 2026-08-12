/**
 * On-chain SC readiness for UI gates.
 * Re-exports + helpers aligned with config/scStatus (single source of truth).
 */

export {
  KNOWN_EMPTY_MARKETPLACE,
  MARKETPLACE_ADDRESS as ENV_MARKETPLACE,
  canListBuyNft,
  canBuyAgent,
  marketplaceReceiverOrThrow,
  NFT_MARKET_FEE_BPS,
  AGENTS_FEE_BPS,
} from '../config/scStatus'

export function envMarketplace(): string {
  return (import.meta.env.VITE_MARKETPLACE_ADDRESS as string | undefined)?.trim() || ''
}

export function envAgentsMarketplace(): string {
  return (import.meta.env.VITE_AGENTS_MARKETPLACE_ADDRESS as string | undefined)?.trim() || ''
}

/** @deprecated prefer canListBuyNft from config */
export function isMarketplaceLive(): boolean {
  // dynamic import path kept for useMarketplaceTx
  const { canListBuyNft } = require('../config/scStatus') as typeof import('../config/scStatus')
  return canListBuyNft()
}

export function isAgentsMarketplaceLive(): boolean {
  const { canBuyAgent } = require('../config/scStatus') as typeof import('../config/scStatus')
  return canBuyAgent()
}

export function agentsFeeBps(): number {
  const n = Number(import.meta.env.VITE_AGENTS_FEE_BPS ?? 300)
  return Number.isFinite(n) ? n : 300
}
