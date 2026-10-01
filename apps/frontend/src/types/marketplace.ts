/** Marketplace listing + listNft payload (matches on-chain ABI). */

export type ListingRow = {
  listing_id?: number
  token?: string
  nonce?: number
  price?: string
  seller?: string
  active?: boolean
}

export type ListNftInput = {
  tokenId: string
  nonce: number
  priceEgld: number
  royaltyBps?: number
  royaltyReceiver?: string
}
