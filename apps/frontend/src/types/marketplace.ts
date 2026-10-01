export type ListingRow = {
  listing_id?: number
  token?: string
  token_id?: string
  identifier?: string
  nonce?: number
  name?: string
  price?: string
  price_egld?: string
  seller?: string
  active?: boolean
  tx_list?: string
  thumb?: string
  url?: string
}

export type ListNftInput = {
  tokenId: string
  nonce: number
  priceEgld: number
  royaltyBps?: number
  royaltyReceiver?: string
}
