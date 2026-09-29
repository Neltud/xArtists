/**
 * On-chain SC readiness — re-export config (single source of truth).
 */
export {
  KNOWN_EMPTY_MARKETPLACE,
  MARKETPLACE_ADDRESS,
  AGENTS_MARKETPLACE_ADDRESS,
  VENUE_SC_ADDRESS,
  TRO_STAKING_ADDRESS,
  NFT_STAKING_ADDRESS,
  TRO_GOVERNANCE_ADDRESS,
  AGENT_STAKE_ESCROW_ADDRESS,
  TREASURY_SPLITTER_ADDRESS,
  SLOT_CASINO_ADDRESS,
  TRO_TOKEN_ID,
  canListBuyNft,
  canBuyAgent,
  canRentVenueOnChain,
  canStakeTro,
  canStakeNft,
  canVoteDao,
  canUseAgentEscrow,
  canUseTreasury,
  canSpinSlot,
  marketplaceReceiverOrThrow,
  venueReceiverOrThrow,
  troStakingReceiverOrThrow,
  daoReceiverOrThrow,
  NFT_MARKET_FEE_BPS,
  AGENTS_FEE_BPS,
  isLiaOpsWallet,
  MARKETPLACE_LIVE,
  AGENTS_LIVE,
  VENUE_LIVE,
  TRO_STAKING_LIVE,
  NFT_STAKING_LIVE,
  TRO_GOVERNANCE_LIVE,
  TREASURY_LIVE,
  SLOT_CASINO_LIVE,
  getAllScSnapshots,
  venueStatusLabel,
  troStakingStatusLabel,
} from '../config/scStatus'

import {
  canListBuyNft,
  canBuyAgent,
  canRentVenueOnChain,
  canStakeTro,
  canStakeNft,
  canVoteDao,
} from '../config/scStatus'

export function envMarketplace(): string {
  return (import.meta.env.VITE_MARKETPLACE_ADDRESS as string | undefined)?.trim() || ''
}

export function envAgentsMarketplace(): string {
  return (import.meta.env.VITE_AGENTS_MARKETPLACE_ADDRESS as string | undefined)?.trim() || ''
}

export function envVenueSc(): string {
  return (import.meta.env.VITE_VENUE_SC_ADDRESS as string | undefined)?.trim() || ''
}

export function envTroStaking(): string {
  return (import.meta.env.VITE_TRO_STAKING_ADDRESS as string | undefined)?.trim() || ''
}

export function isMarketplaceLive(): boolean {
  return canListBuyNft()
}

export function isAgentsMarketplaceLive(): boolean {
  return canBuyAgent()
}

export function isVenueLive(): boolean {
  return canRentVenueOnChain()
}

export function isTroStakingLive(): boolean {
  return canStakeTro()
}

export function isNftStakingLive(): boolean {
  return canStakeNft()
}

export function isDaoLive(): boolean {
  return canVoteDao()
}

export function agentsFeeBps(): number {
  const n = Number(import.meta.env.VITE_AGENTS_FEE_BPS ?? 300)
  return Number.isFinite(n) ? n : 300
}
