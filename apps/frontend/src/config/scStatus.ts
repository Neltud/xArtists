/** On-chain SC readiness — driven by build-time VITE_* after codeHash verify */

const truthy = (v: string | undefined) =>
  v === '1' || v === 'true' || v === 'TRUE' || v === 'yes'

/** Historical placeholder — empty account on mainnet (codeHash null). Never send funds. */
export const KNOWN_EMPTY_MARKETPLACE =
  'erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t'

/**
 * venue-split mainnet (2026-09-28).
 * Display / docs only — live TX still requires VITE_VENUE_CODEHASH_OK after rentPay dust.
 * Explorer: https://explorer.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgqvy4qejg6lds00hy829nwmyxktrdqsuq3vhxq2vje2y
 */
export const VENUE_SC_MAINNET =
  'erd1qqqqqqqqqqqqqpgqvy4qejg6lds00hy829nwmyxktrdqsuq3vhxq2vje2y'

export const VENUE_SC_CODEHASH_MAINNET = 'SRrGio4iLmtQrb22JJhapwobNgavYsoQ52WmfT1owuY='

export const LIA_PROTOCOL_WALLET = (
  import.meta.env.VITE_LIA_PROTOCOL_WALLET ||
  'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'
).toLowerCase()

export const MARKETPLACE_ADDRESS =
  (import.meta.env.VITE_MARKETPLACE_ADDRESS as string | undefined)?.trim() || ''

export const AGENTS_MARKETPLACE_ADDRESS =
  (import.meta.env.VITE_AGENTS_MARKETPLACE_ADDRESS as string | undefined)?.trim() || ''

/** Venue-split SC — env first, else known mainnet address for UI status (TX still gated by VENUE_LIVE) */
export const VENUE_SC_ADDRESS =
  (import.meta.env.VITE_VENUE_SC_ADDRESS as string | undefined)?.trim() || VENUE_SC_MAINNET

export const MARKETPLACE_LIVE = truthy(import.meta.env.VITE_MARKETPLACE_CODEHASH_OK)
export const AGENTS_LIVE = truthy(import.meta.env.VITE_AGENTS_CODEHASH_OK)
/** True only after explorer verify codeHash on the deployed venue-split */
export const VENUE_LIVE = truthy(import.meta.env.VITE_VENUE_CODEHASH_OK)

export const AGENTS_FEE_BPS = Number(import.meta.env.VITE_AGENTS_FEE_BPS || 300)
/** NFT market fee when live — env or product default 2.5% */
export const NFT_MARKET_FEE_BPS = Number(import.meta.env.VITE_NFT_MARKET_FEE_BPS || 250)

export function isLiaOpsWallet(addr?: string | null): boolean {
  if (!addr) return false
  return addr.trim().toLowerCase() === LIA_PROTOCOL_WALLET
}

function isUsableScAddress(a: string): boolean {
  if (!a || !a.startsWith('erd1')) return false
  if (a.toLowerCase() === KNOWN_EMPTY_MARKETPLACE.toLowerCase()) return false
  return true
}

/** List/Buy/Bid only if address real + codeHash flag + not empty placeholder */
export function canListBuyNft(): boolean {
  return MARKETPLACE_LIVE && isUsableScAddress(MARKETPLACE_ADDRESS)
}

export function canBuyAgent(): boolean {
  return AGENTS_LIVE && isUsableScAddress(AGENTS_MARKETPLACE_ADDRESS)
}

/** rentPay on-chain only if address + VITE_VENUE_CODEHASH_OK */
export function canRentVenueOnChain(): boolean {
  return VENUE_LIVE && isUsableScAddress(VENUE_SC_ADDRESS)
}

/** Prefer VITE address; never fall back to empty placeholder for TX */
export function marketplaceReceiverOrThrow(): string {
  if (!canListBuyNft()) {
    throw new Error('Marketplace SC not live (set VITE_MARKETPLACE_ADDRESS + CODEHASH_OK)')
  }
  return MARKETPLACE_ADDRESS
}

export function venueReceiverOrThrow(): string {
  if (!canRentVenueOnChain()) {
    throw new Error(
      'Venue-split not live — set VITE_VENUE_SC_ADDRESS + VITE_VENUE_CODEHASH_OK after rentPay dust',
    )
  }
  return VENUE_SC_ADDRESS
}

export function venueStatusLabel(): string {
  if (canRentVenueOnChain()) return 'LIVE · rentPay on-chain'
  if (isUsableScAddress(VENUE_SC_ADDRESS))
    return 'Adresse connue · paper until CODEHASH_OK (rentPay dust first)'
  return 'Paper only · no SC address'
}
