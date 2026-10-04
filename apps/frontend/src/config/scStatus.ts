/**
 * On-chain SC readiness — VITE_*_CODEHASH_OK at build OR runtime explorer match.
 */

import { runtimeCodehashOk } from '../lib/runtimeCodehash'
import {
  AGENT_ESCROW_LIVE,
  AGENT_STAKE_ESCROW_ADDRESS,
  AGENTS_LIVE,
  AGENTS_MARKETPLACE_ADDRESS,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_LIVE,
  NFT_STAKING_ADDRESS,
  NFT_STAKING_LIVE,
  SLOT_CASINO_ADDRESS,
  SLOT_CASINO_LIVE,
  TREASURY_LIVE,
  TREASURY_SPLITTER_ADDRESS,
  TRO_GOVERNANCE_ADDRESS,
  TRO_GOVERNANCE_LIVE,
  TRO_STAKING_ADDRESS,
  TRO_STAKING_LIVE,
  VENUE_LIVE,
  VENUE_SC_ADDRESS,
} from './contracts'

export {
  AGENT_STAKE_ESCROW_ADDRESS,
  AGENTS_MARKETPLACE_ADDRESS,
  MARKETPLACE_ADDRESS,
  NFT_STAKING_ADDRESS,
  SLOT_CASINO_ADDRESS,
  TREASURY_SPLITTER_ADDRESS,
  TRO_GOVERNANCE_ADDRESS,
  TRO_STAKING_ADDRESS,
  TRO_TOKEN_ID,
  VENUE_SC_ADDRESS,
  VENUE_SC_CODEHASH_MAINNET,
  TRO_STAKING_CODEHASH_MAINNET,
  SLOT_CASINO_CODEHASH_MAINNET,
  MARKETPLACE_LIVE,
  AGENTS_LIVE,
  VENUE_LIVE,
  NFT_STAKING_LIVE,
  TRO_STAKING_LIVE,
  TRO_GOVERNANCE_LIVE,
  AGENT_ESCROW_LIVE,
  TREASURY_LIVE,
  SLOT_CASINO_LIVE,
} from './contracts'

export const KNOWN_EMPTY_MARKETPLACE = false
export const NFT_MARKET_FEE_BPS = 250
export const AGENTS_FEE_BPS = 300

export function isUsableScAddress(addr: string | undefined | null): boolean {
  return !!addr && addr.startsWith('erd1') && addr.length >= 60
}

export function canListBuyNft(): boolean {
  return (MARKETPLACE_LIVE || runtimeCodehashOk('marketplace')) && isUsableScAddress(MARKETPLACE_ADDRESS)
}

export function canBuyAgent(): boolean {
  return (AGENTS_LIVE || runtimeCodehashOk('agents')) && isUsableScAddress(AGENTS_MARKETPLACE_ADDRESS)
}

export function canRentVenueOnChain(): boolean {
  return (VENUE_LIVE || runtimeCodehashOk('venue')) && isUsableScAddress(VENUE_SC_ADDRESS)
}

/** Alias used by GO_LIVE checklist. Same gate as canRentVenueOnChain. */
export function canUseVenue(): boolean {
  return canRentVenueOnChain()
}

export function canStakeTro(): boolean {
  return (TRO_STAKING_LIVE || runtimeCodehashOk('tro_staking')) && isUsableScAddress(TRO_STAKING_ADDRESS)
}

export function canStakeNft(): boolean {
  return (NFT_STAKING_LIVE || runtimeCodehashOk('nft_staking')) && isUsableScAddress(NFT_STAKING_ADDRESS)
}

export function canVoteDao(): boolean {
  return (TRO_GOVERNANCE_LIVE || runtimeCodehashOk('governance')) && isUsableScAddress(TRO_GOVERNANCE_ADDRESS)
}

export function canUseAgentEscrow(): boolean {
  return (AGENT_ESCROW_LIVE || runtimeCodehashOk('escrow')) && isUsableScAddress(AGENT_STAKE_ESCROW_ADDRESS)
}

export function canUseTreasury(): boolean {
  return (TREASURY_LIVE || runtimeCodehashOk('treasury')) && isUsableScAddress(TREASURY_SPLITTER_ADDRESS)
}

export function canSpinSlot(): boolean {
  return (SLOT_CASINO_LIVE || runtimeCodehashOk('slot')) && isUsableScAddress(SLOT_CASINO_ADDRESS)
}

export function marketplaceReceiverOrThrow(): string {
  if (!canListBuyNft()) throw new Error('Marketplace not ready')
  return MARKETPLACE_ADDRESS
}

/** Agents pack mint SC — mainnet address when gate open */
export function agentsMarketplaceReceiverOrThrow(): string {
  if (!canBuyAgent()) throw new Error('Agents marketplace not ready — paper only')
  return AGENTS_MARKETPLACE_ADDRESS
}

export function venueReceiverOrThrow(): string {
  if (!canRentVenueOnChain()) throw new Error('Venue not ready')
  return VENUE_SC_ADDRESS
}

export function troStakingReceiverOrThrow(): string {
  if (!canStakeTro()) throw new Error('Staking not ready')
  return TRO_STAKING_ADDRESS
}

export function daoReceiverOrThrow(): string {
  if (!canVoteDao()) throw new Error('DAO not ready')
  return TRO_GOVERNANCE_ADDRESS
}

export function slotReceiverOrThrow(): string {
  if (!canSpinSlot()) throw new Error('Slot not ready')
  return SLOT_CASINO_ADDRESS
}

export function isLiaOpsWallet(_addr?: string | null): boolean {
  return false
}

export function slotStatusLabel(): string {
  if (canSpinSlot()) return 'Ouvert · spin on-chain'
  if (isUsableScAddress(SLOT_CASINO_ADDRESS)) return 'Bientôt disponible · simulation active'
  return 'Simulation'
}

export function venueStatusLabel(): string {
  if (canRentVenueOnChain()) return 'Ouvert'
  return 'Bientôt disponible'
}

export function troStakingStatusLabel(): string {
  if (canStakeTro()) return 'Ouvert'
  return 'Bientôt disponible'
}

export function agentsStatusLabel(): string {
  if (canBuyAgent()) return 'Ouvert · mint on-chain'
  if (isUsableScAddress(AGENTS_MARKETPLACE_ADDRESS)) return 'SC déployé · gate CODEHASH / paper'
  return 'Paper only'
}

export function getAllScSnapshots() {
  return [
    { id: 'slot', address: SLOT_CASINO_ADDRESS, live: canSpinSlot() },
    { id: 'marketplace', address: MARKETPLACE_ADDRESS, live: canListBuyNft() },
    { id: 'agents', address: AGENTS_MARKETPLACE_ADDRESS, live: canBuyAgent() },
    { id: 'tro_staking', address: TRO_STAKING_ADDRESS, live: canStakeTro() },
    { id: 'nft_staking', address: NFT_STAKING_ADDRESS, live: canStakeNft() },
    { id: 'venue', address: VENUE_SC_ADDRESS, live: canRentVenueOnChain() },
    { id: 'governance', address: TRO_GOVERNANCE_ADDRESS, live: canVoteDao() },
    { id: 'treasury', address: TREASURY_SPLITTER_ADDRESS, live: canUseTreasury() },
  ]
}
