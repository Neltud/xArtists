/** On-chain SC readiness - driven by build-time VITE_* after codeHash verify.
 *  Addresses fall back to data/contracts.json mainnet LIVE set (2026-09-29).
 *  TX always fail-closed until corresponding VITE_*_CODEHASH_OK=1.
 */

const truthy = (v: string | undefined) =>
  v === '1' || v === 'true' || v === 'TRUE' || v === 'yes'

export const KNOWN_EMPTY_MARKETPLACE =
  'erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t'

export const VENUE_SC_MAINNET =
  'erd1qqqqqqqqqqqqqpgqvy4qejg6lds00hy829nwmyxktrdqsuq3vhxq2vje2y'
export const VENUE_SC_CODEHASH_MAINNET = 'SRrGio4iLmtQrb22JJhapwobNgavYsoQ52WmfT1owuY='

export const NFT_MARKETPLACE_MAINNET =
  'erd1qqqqqqqqqqqqqpgqx0araa285cdepdsfe8s23mer30r3dh9lvhxqq8txmm'
export const AGENTS_MARKETPLACE_MAINNET =
  'erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg'
export const NFT_STAKING_MAINNET =
  'erd1qqqqqqqqqqqqqpgq9ensu3f3p9yx4a583swu0raq8zzeve7tvhxq4fgtgu'
/** LEGACY (no #[upgrade], stake may non-payable) — replaced after redeploy workflow */
export const TRO_STAKING_MAINNET_LEGACY =
  'erd1qqqqqqqqqqqqqpgqqpc9064q0t33dasd23k2hm36fu5gqp7mvhxq9xvpwf'
export const TRO_STAKING_MAINNET =
  'erd1qqqqqqqqqqqqqpgqqpc9064q0t33dasd23k2hm36fu5gqp7mvhxq9xvpwf'
export const TRO_GOVERNANCE_MAINNET =
  'erd1qqqqqqqqqqqqqpgqe6xrgq2y53q8d0lsact2dppzvg42t4wcvhxq9e9euy'
export const AGENT_STAKE_ESCROW_MAINNET =
  'erd1qqqqqqqqqqqqqpgqzyvwldu6jq8w6ry6s856dl0uy7g0v37vvhxqndvzr3'
export const TREASURY_SPLITTER_MAINNET =
  'erd1qqqqqqqqqqqqqpgq245sma97w0j9ga9jdgxu36zs0v8g0y6evhxq2nkezv'
export const SLOT_CASINO_MAINNET =
  'erd1qqqqqqqqqqqqqpgquf3cuv2zsfsahy7ypvter3qcep4ptthsvhxqs4g34f'
export const SLOT_CASINO_CODEHASH_MAINNET = 'UZ0nX6dWsSgkVqjnFnR5zPNPk1UrNtR5SsrYf96VJCs='

export const TRO_TOKEN_ID = 'TRO-94c925'

export const LIA_PROTOCOL_WALLET = (
  import.meta.env.VITE_LIA_PROTOCOL_WALLET ||
  'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'
).toLowerCase()

export const MARKETPLACE_ADDRESS =
  (import.meta.env.VITE_MARKETPLACE_ADDRESS as string | undefined)?.trim() ||
  NFT_MARKETPLACE_MAINNET

export const AGENTS_MARKETPLACE_ADDRESS =
  (import.meta.env.VITE_AGENTS_MARKETPLACE_ADDRESS as string | undefined)?.trim() ||
  AGENTS_MARKETPLACE_MAINNET

export const VENUE_SC_ADDRESS =
  (import.meta.env.VITE_VENUE_SC_ADDRESS as string | undefined)?.trim() || VENUE_SC_MAINNET

export const NFT_STAKING_ADDRESS =
  (import.meta.env.VITE_NFT_STAKING_ADDRESS as string | undefined)?.trim() || NFT_STAKING_MAINNET

export const TRO_STAKING_ADDRESS =
  (import.meta.env.VITE_TRO_STAKING_ADDRESS as string | undefined)?.trim() || TRO_STAKING_MAINNET

export const TRO_GOVERNANCE_ADDRESS =
  (import.meta.env.VITE_TRO_GOVERNANCE_ADDRESS as string | undefined)?.trim() ||
  TRO_GOVERNANCE_MAINNET

export const AGENT_STAKE_ESCROW_ADDRESS =
  (import.meta.env.VITE_AGENT_STAKE_ESCROW_ADDRESS as string | undefined)?.trim() ||
  AGENT_STAKE_ESCROW_MAINNET

export const TREASURY_SPLITTER_ADDRESS =
  (import.meta.env.VITE_TREASURY_SPLITTER_ADDRESS as string | undefined)?.trim() ||
  TREASURY_SPLITTER_MAINNET

export const SLOT_CASINO_ADDRESS =
  (import.meta.env.VITE_SLOT_CASINO_ADDRESS as string | undefined)?.trim() || SLOT_CASINO_MAINNET

export const MARKETPLACE_LIVE = truthy(import.meta.env.VITE_MARKETPLACE_CODEHASH_OK)
export const AGENTS_LIVE = truthy(import.meta.env.VITE_AGENTS_CODEHASH_OK)
export const VENUE_LIVE = truthy(import.meta.env.VITE_VENUE_CODEHASH_OK)
export const NFT_STAKING_LIVE = truthy(import.meta.env.VITE_NFT_STAKING_CODEHASH_OK)
export const TRO_STAKING_LIVE = truthy(import.meta.env.VITE_TRO_STAKING_CODEHASH_OK)
export const TRO_GOVERNANCE_LIVE = truthy(import.meta.env.VITE_TRO_GOVERNANCE_CODEHASH_OK)
export const AGENT_ESCROW_LIVE = truthy(import.meta.env.VITE_AGENT_ESCROW_CODEHASH_OK)
export const TREASURY_LIVE = truthy(import.meta.env.VITE_TREASURY_CODEHASH_OK)
export const SLOT_CASINO_LIVE = truthy(import.meta.env.VITE_SLOT_CASINO_CODEHASH_OK)

export const AGENTS_FEE_BPS = Number(import.meta.env.VITE_AGENTS_FEE_BPS || 300)
export const NFT_MARKET_FEE_BPS = Number(import.meta.env.VITE_NFT_MARKET_FEE_BPS || 300)

export function isLiaOpsWallet(addr?: string | null): boolean {
  if (!addr) return false
  return addr.trim().toLowerCase() === LIA_PROTOCOL_WALLET
}

function isUsableScAddress(a: string): boolean {
  if (!a || !a.startsWith('erd1')) return false
  if (a.toLowerCase() === KNOWN_EMPTY_MARKETPLACE.toLowerCase()) return false
  return true
}

export function canListBuyNft(): boolean {
  return MARKETPLACE_LIVE && isUsableScAddress(MARKETPLACE_ADDRESS)
}

export function canBuyAgent(): boolean {
  return AGENTS_LIVE && isUsableScAddress(AGENTS_MARKETPLACE_ADDRESS)
}

export function canRentVenueOnChain(): boolean {
  return VENUE_LIVE && isUsableScAddress(VENUE_SC_ADDRESS)
}

export function canStakeTro(): boolean {
  return TRO_STAKING_LIVE && isUsableScAddress(TRO_STAKING_ADDRESS)
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
  return SLOT_CASINO_LIVE && isUsableScAddress(SLOT_CASINO_ADDRESS)
}

export function marketplaceReceiverOrThrow(): string {
  if (!canListBuyNft()) {
    throw new Error('Marketplace SC not live (set VITE_MARKETPLACE_ADDRESS + CODEHASH_OK)')
  }
  return MARKETPLACE_ADDRESS
}

export function venueReceiverOrThrow(): string {
  if (!canRentVenueOnChain()) {
    throw new Error(
      'Venue-split not live - set VITE_VENUE_SC_ADDRESS + VITE_VENUE_CODEHASH_OK after rentPay dust',
    )
  }
  return VENUE_SC_ADDRESS
}

export function troStakingReceiverOrThrow(): string {
  if (!canStakeTro()) {
    throw new Error('TRO staking SC not live (set VITE_TRO_STAKING_ADDRESS + CODEHASH_OK)')
  }
  return TRO_STAKING_ADDRESS
}

export function slotReceiverOrThrow(): string {
  if (!canSpinSlot()) {
    throw new Error('Slot SC not live (set VITE_SLOT_CASINO_ADDRESS + VITE_SLOT_CASINO_CODEHASH_OK)')
  }
  return SLOT_CASINO_ADDRESS
}

export function daoReceiverOrThrow(): string {
  if (!canVoteDao()) {
    throw new Error('DAO SC not live (set VITE_TRO_GOVERNANCE_ADDRESS + CODEHASH_OK)')
  }
  return TRO_GOVERNANCE_ADDRESS
}

export function venueStatusLabel(): string {
  if (canRentVenueOnChain()) return 'LIVE · rentPay on-chain'
  if (isUsableScAddress(VENUE_SC_ADDRESS))
    return 'Adresse connue · paper until CODEHASH_OK (rentPay dust first)'
  return 'Paper only · no SC address'
}

export function troStakingStatusLabel(): string {
  if (canStakeTro()) return 'LIVE · stake/unstake on-chain'
  if (isUsableScAddress(TRO_STAKING_ADDRESS))
    return 'Adresse connue · gated until VITE_TRO_STAKING_CODEHASH_OK'
  return 'Paper only · no SC address'
}

export function slotStatusLabel(): string {
  if (canSpinSlot()) return 'LIVE · spinEgld on-chain'
  if (isUsableScAddress(SLOT_CASINO_ADDRESS))
    return 'Adresse connue · gated until VITE_SLOT_CASINO_CODEHASH_OK + fund progressive'
  return 'Paper only · no SC address'
}

export type ScKey =
  | 'venue_split'
  | 'nft_marketplace'
  | 'agents_marketplace'
  | 'nft_staking'
  | 'tro_staking'
  | 'tro_governance'
  | 'agent_stake_escrow'
  | 'treasury_splitter'
  | 'slot_casino'

export interface ScSnapshot {
  key: ScKey
  address: string
  live: boolean
  label: string
}

export function getAllScSnapshots(): ScSnapshot[] {
  return [
    {
      key: 'venue_split',
      address: VENUE_SC_ADDRESS,
      live: canRentVenueOnChain(),
      label: venueStatusLabel(),
    },
    {
      key: 'nft_marketplace',
      address: MARKETPLACE_ADDRESS,
      live: canListBuyNft(),
      label: canListBuyNft() ? 'LIVE' : 'gated CODEHASH_OK',
    },
    {
      key: 'agents_marketplace',
      address: AGENTS_MARKETPLACE_ADDRESS,
      live: canBuyAgent(),
      label: canBuyAgent() ? 'LIVE' : 'gated CODEHASH_OK',
    },
    {
      key: 'nft_staking',
      address: NFT_STAKING_ADDRESS,
      live: canStakeNft(),
      label: canStakeNft() ? 'LIVE' : 'gated CODEHASH_OK',
    },
    {
      key: 'tro_staking',
      address: TRO_STAKING_ADDRESS,
      live: canStakeTro(),
      label: troStakingStatusLabel(),
    },
    {
      key: 'tro_governance',
      address: TRO_GOVERNANCE_ADDRESS,
      live: canVoteDao(),
      label: canVoteDao() ? 'LIVE' : 'gated CODEHASH_OK',
    },
    {
      key: 'agent_stake_escrow',
      address: AGENT_STAKE_ESCROW_ADDRESS,
      live: canUseAgentEscrow(),
      label: canUseAgentEscrow() ? 'LIVE' : 'gated CODEHASH_OK',
    },
    {
      key: 'treasury_splitter',
      address: TREASURY_SPLITTER_ADDRESS,
      live: canUseTreasury(),
      label: canUseTreasury() ? 'LIVE' : 'gated CODEHASH_OK',
    },
    {
      key: 'slot_casino',
      address: SLOT_CASINO_ADDRESS,
      live: canSpinSlot(),
      label: slotStatusLabel(),
    },
  ]
}
