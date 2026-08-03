/**
 * NFT Marketplace ABI — list/buy/cancel + placeBid (after SC redeploy).
 * Address from VITE_MARKETPLACE_ADDRESS or contracts.json marketplace.
 */

export const MARKETPLACE_ADDRESS =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_MARKETPLACE_ADDRESS) ||
  process.env.VITE_MARKETPLACE_ADDRESS ||
  'erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t'

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
