/**
 * Marketplace ABI (MultiversX) — xArtists
 * Endpoints alignés sur le contrat marketplace mainnet (placeholder jusqu'au déploiement final).
 */

export const MARKETPLACE_ADDRESS =
  process.env.VITE_MARKETPLACE_ADDRESS ||
  'erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t';

export const MARKETPLACE_ABI = {
  name: 'XArtistsMarketplace',
  endpoints: [
    {
      name: 'listNft',
      mutability: 'mutable',
      payableInTokens: ['*'],
      inputs: [
        { name: 'price', type: 'BigUint' },
        { name: 'token_id', type: 'TokenIdentifier' },
        { name: 'nonce', type: 'u64' },
      ],
      outputs: [],
    },
    {
      name: 'buyNft',
      mutability: 'mutable',
      payableInTokens: ['EGLD', 'ESDTs'],
      inputs: [
        { name: 'listing_id', type: 'u64' },
      ],
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
  ],
  types: {
    Listing: {
      type: 'struct',
      fields: [
        { name: 'seller', type: 'Address' },
        { name: 'token_id', type: 'TokenIdentifier' },
        { name: 'nonce', type: 'u64' },
        { name: 'price', type: 'BigUint' },
        { name: 'payment_token', type: 'TokenIdentifier' },
        { name: 'active', type: 'bool' },
      ],
    },
  },
} as const;

export type MarketplaceEndpoint = 'listNft' | 'buyNft' | 'cancelListing' | 'getListing';
