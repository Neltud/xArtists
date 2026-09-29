/**
 * NFT Marketplace ABI — list/buy/cancel + placeBid.
 * Default = LIVE mainnet SC (not the empty placeholder …8354t).
 */

export const MARKETPLACE_ADDRESS_LIVE =
  'erd1qqqqqqqqqqqqqpgqx0araa285cdepdsfe8s23mer30r3dh9lvhxqq8txmm'

/** @deprecated empty placeholder — never send funds */
export const MARKETPLACE_ADDRESS_EMPTY =
  'erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t'

export const MARKETPLACE_ADDRESS =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_MARKETPLACE_ADDRESS) ||
  (typeof process !== 'undefined' && process.env?.VITE_MARKETPLACE_ADDRESS) ||
  MARKETPLACE_ADDRESS_LIVE

export const MARKETPLACE_ABI = {
  name: 'XArtistsNftMarketplace',
  endpoints: [
    {
      name: 'listNft',
      mutability: 'mutable',
      payableInTokens: ['*'],
      inputs: [
        { name: 'price', type: 'BigUint' },
        { name: 'royalty_bps', type: 'u16' },
        { name: 'royalty_receiver', type: 'Address' },
      ],
      outputs: [],
    },
    {
      name: 'buyNft',
      mutability: 'mutable',
      payableInTokens: ['EGLD'],
      inputs: [{ name: 'listing_id', type: 'u64' }],
      outputs: [],
    },
    {
      name: 'placeBid',
      mutability: 'mutable',
      payableInTokens: ['EGLD'],
      inputs: [{ name: 'listing_id', type: 'u64' }],
      outputs: [],
    },
    {
      name: 'acceptBid',
      mutability: 'mutable',
      inputs: [{ name: 'listing_id', type: 'u64' }],
      outputs: [],
    },
    {
      name: 'withdrawBid',
      mutability: 'mutable',
      inputs: [{ name: 'listing_id', type: 'u64' }],
      outputs: [],
    },
    {
      name: 'cancelListing',
      mutability: 'mutable',
      inputs: [{ name: 'listing_id', type: 'u64' }],
      outputs: [],
    },
    {
      name: 'getListing',
      mutability: 'readonly',
      inputs: [{ name: 'listing_id', type: 'u64' }],
      outputs: [{ type: 'optional<Listing>' }],
    },
    {
      name: 'getBid',
      mutability: 'readonly',
      inputs: [{ name: 'listing_id', type: 'u64' }],
      outputs: [{ type: 'optional<Bid>' }],
    },
  ],
} as const

export type MarketplaceEndpoint =
  | 'listNft'
  | 'buyNft'
  | 'placeBid'
  | 'acceptBid'
  | 'withdrawBid'
  | 'cancelListing'
