/**
 * On-chain SC readiness — VITE_*_CODEHASH_OK at build OR runtime explorer match.
 */

import { runtimeCodehashOk } from '../lib/runtimeCodehash'

const truthy = (v: string | undefined) =>
  v === '1' || v === 'true' || v === 'TRUE' || v === 'yes'

function env(key: string): string {
  try {
    return String((import.meta as { env?: Record<string, string> }).env?.[key] || '').trim()
  } catch {
    return ''
  }
}

export const VENUE_SC_CODEHASH_MAINNET = 'SRrGio4iLmtQrb22JJhapwobNgavYsoQ52WmfT1owuY='
export const TRO_STAKING_CODEHASH_MAINNET = 'Jf5ZhzAGu58ez0njdWoZAnRxP7YevYSX9dpO8pGq7SA='
export const SLOT_CASINO_CODEHASH_MAINNET = 'UZ0nX6dWsSgkVqjnFnR5zPNPk1UrNtR5SsrYf96VJCs='

export const MARKETPLACE_ADDRESS =
  env('VITE_MARKETPLACE_ADDRESS') ||
  'erd1qqqqqqqqqqqqqpgqx0araa285cdepdsfe8s23mer30r3dh9lvhxqq8txmm'
export const AGENTS_MARKETPLACE_ADDRESS =
  env('VITE_AGENTS_MARKETPLACE_ADDRESS') || MARKETPLACE_ADDRESS
export const VENUE_SC_ADDRESS =
  env('VITE_VENUE_SC_ADDRESS') ||
  'erd1qqqqqqqqqqqqqpgqvy4qejg6lds00hy829nwmyxktrdqsuq3vhxq2vje2y'
export const TRO_STAKING_ADDRESS =
  env('VITE_TRO_STAKING_ADDRESS') ||
  'erd1qqqqqqqqqqqqqpgqes0a2kryurmt34g7nu4kx9n4ftj77dl5vhxqpe3xf3'
export const NFT_STAKING_ADDRESS = env('VITE_NFT_STAKING_ADDRESS') || TRO_STAKING_ADDRESS
export const TRO_GOVERNANCE_ADDRESS = env('VITE_TRO_GOVERNANCE_ADDRESS') || ''
export const AGENT_STAKE_ESCROW_ADDRESS = env('VITE_AGENT_ESCROW_ADDRESS') || ''
export const TREASURY_SPLITTER_ADDRESS =
  env('VITE_TREASURY_ADDRESS') ||
  'erd1qqqqqqqqqqqqqpgq245sma97w0j9ga9jdgxu36zs0v8g0y6evhxq2nkezv'
export const SLOT_CASINO_ADDRESS =
  env('VITE_SLOT_CASINO_ADDRESS') ||
  'erd1qqqqqqqqqqqqqpgquf3cuv2zsfsahy7ypvter3qcep4ptthsvhxqs4g34f'
export const TRO_TOKEN_ID = env('VITE_TRO_TOKEN_ID') || 'TRO-94c925'

export const MARKETPLACE_LIVE = truthy(env('VITE_MARKETPLACE_CODEHASH_OK'))
export const AGENTS_LIVE = truthy(env('VITE_AGENTS_CODEHASH_OK'))
export const VENUE_LIVE = truthy(env('VITE_VENUE_CODEHASH_OK'))
export const NFT_STAKING_LIVE = truthy(env('VITE_NFT_STAKING_CODEHASH_OK'))
export const TRO_STAKING_LIVE = truthy(env('VITE_TRO_STAKING_CODEHASH_OK'))
export const TRO_GOVERNANCE_LIVE = truthy(env('VITE_TRO_GOVERNANCE_CODEHASH_OK'))
export const AGENT_ESCROW_LIVE = truthy(env('VITE_AGENT_ESCROW_CODEHASH_OK'))
export const TREASURY_LIVE = truthy(env('VITE_TREASURY_CODEHASH_OK'))
export const SLOT_CASINO_LIVE =
  truthy(env('VITE_SLOT_CASINO_CODEHASH_OK')) || truthy(env('VITE_SLOT_CODEHASH_OK'))

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
  return (AGENTS_LIVE || runtimeCodehashOk('marketplace')) && isUsableScAddress(AGENTS_MARKETPLACE_ADDRESS)
}

export function canRentVenueOnChain(): boolean {
  return (VENUE_LIVE || runtimeCodehashOk('venue')) && isUsableScAddress(VENUE_SC_ADDRESS)
}

export function canStakeTro(): boolean {
  return (TRO_STAKING_LIVE || runtimeCodehashOk('tro_staking')) && isUsableScAddress(TRO_STAKING_ADDRESS)
}

export function canStakeNft(): boolean {
  return NFT_STAKING_LIVE && isUsableScAddress(NFT_STAKING_ADDRESS)
}

export function canVoteDao(): boolean {
  return TRO_GOVERNANCE_LIVE && isUsableScAddress(TRO_GOVERNANCE_ADDRESS)
}

export function canUseAgentEscrow(): boolean {
  return AGENT_ESCROW_LIVE && isUsableScAddress(AGENT_STAKE_ESCROW_ADDRESS)
}

export function canUseTreasury(): boolean {
  return TREASURY_LIVE && isUsableScAddress(TREASURY_SPLITTER_ADDRESS)
}

export function canSpinSlot(): boolean {
  return (SLOT_CASINO_LIVE || runtimeCodehashOk('slot')) && isUsableScAddress(SLOT_CASINO_ADDRESS)
}

export function marketplaceReceiverOrThrow(): string {
  if (!canListBuyNft()) throw new Error('Marketplace not ready')
  return MARKETPLACE_ADDRESS
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

export function isLiaOpsWallet(addr?: string | null): boolean {
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

export function getAllScSnapshots() {
  return [
    { id: 'slot', address: SLOT_CASINO_ADDRESS, live: canSpinSlot() },
    { id: 'marketplace', address: MARKETPLACE_ADDRESS, live: canListBuyNft() },
    { id: 'tro_staking', address: TRO_STAKING_ADDRESS, live: canStakeTro() },
    { id: 'venue', address: VENUE_SC_ADDRESS, live: canRentVenueOnChain() },
  ]
}
