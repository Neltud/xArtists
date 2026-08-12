/**
 * On-chain SC readiness — re-export config (single source of truth).
 */
export {
  KNOWN_EMPTY_MARKETPLACE,
  MARKETPLACE_ADDRESS,
  AGENTS_MARKETPLACE_ADDRESS,
  canListBuyNft,
  canBuyAgent,
  marketplaceReceiverOrThrow,
  NFT_MARKET_FEE_BPS,
  AGENTS_FEE_BPS,
  isLiaOpsWallet,
} from '../config/scStatus'

import { canListBuyNft, canBuyAgent } from '../config/scStatus'

export function envMarketplace(): string {
  return (import.meta.env.VITE_MARKETPLACE_ADDRESS as string | undefined)?.trim() || ''
}

export function envAgentsMarketplace(): string {
  return (import.meta.env.VITE_AGENTS_MARKETPLACE_ADDRESS as string | undefined)?.trim() || ''
}

export function isMarketplaceLive(): boolean {
  return canListBuyNft()
}

export function isAgentsMarketplaceLive(): boolean {
  return canBuyAgent()
}

export function agentsFeeBps(): number {
  const n = Number(import.meta.env.VITE_AGENTS_FEE_BPS ?? 300)
  return Number.isFinite(n) ? n : 300
}
