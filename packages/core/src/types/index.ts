/**
 * @xartists/core — Shared TypeScript types for the xArtists ecosystem
 * Used by apps/frontend, packages/discord-bot, and any other consumer.
 */

// ─── Network ────────────────────────────────────────────────────────────────

export interface NetworkConfig {
  name: string
  chainId: string
  apiUrl: string
  explorerUrl: string
  walletConnectProjectId?: string
}

export const MAINNET_CONFIG: NetworkConfig = {
  name: 'mainnet',
  chainId: '1',
  apiUrl: 'https://api.multiversx.com',
  explorerUrl: 'https://explorer.multiversx.com',
}

// ─── Contract addresses ──────────────────────────────────────────────────────

export interface ContractConfig {
  nftStaking: string
  troGovernance: string
  marketplace: string
  nftMinter: string
}

export const CONTRACTS: ContractConfig = {
  nftStaking:    'erd1qqqqqqqqqqqqqpgqmhtx5cctwwtatyaluycjfucre9y5vq2xyj7sqxr8cl',
  troGovernance: 'erd1qqqqqqqqqqqqqpgqrscvsxseyw04l0urzgnm2er5mxd2z64nyj7s6e0ca8',
  marketplace:   'erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t',
  nftMinter:     'erd1qqqqqqqqqqqqqpgq00a2jzre64akaw4jx257gwwyfxxd8fzfyj7snyztkn',
}

// ─── Token identifiers ───────────────────────────────────────────────────────

export const TOKENS = {
  TRO_FUNGIBLE: 'TRO-94c925',
  TRO_NFT:      'TRO-652d6d',
} as const

export const NFT_COLLECTIONS = [
  { id: 'AGR-9bd53e',      name: 'Agreste',      emoji: '🌿' },
  { id: 'ALISTOR-a646bc',  name: 'Alistor',      emoji: '✨' },
  { id: 'ASFT-a6273a',     name: 'xArtists SFT', emoji: '🎨' },
  { id: 'BGG-2b627c',      name: 'Bgg',          emoji: '🔵' },
  { id: 'HP47X2-b71543',   name: 'HP47X2',       emoji: '🔥' },
  { id: 'MAS-5189b6',      name: 'Mas',          emoji: '🌊' },
  { id: 'NFTUDURI-2990b6', name: 'NFTuduri',     emoji: '💫' },
  { id: 'XTR-e5072b',      name: 'XTR',          emoji: '⚡' },
  { id: 'XAUS-d9cf1f',     name: 'XAUS',         emoji: '🌟' },
  { id: 'XAR-cee2e0',      name: 'XAR',          emoji: '🌈' },
  { id: 'TRO-652d6d',      name: 'TRO NFT',      emoji: '🎨' },
] as const

// ─── LIA Agent data shapes ───────────────────────────────────────────────────

export interface Prices {
  egld: number
  btc: number
  tro: number
  wtao: number
  fearGreed: number
  fearGreedLabel: string
}

export interface LIAPortfolio {
  total_usd: number
  egld_balance: number
  hatom_health_factor: number
}

export interface LIAMarket {
  fear_greed_index: number
  guard_status: 'OK' | 'WARNING' | 'BLOCKED'
}

export interface LIACycle {
  report_sent: boolean
  summary: string
}

export interface LIAStatus {
  version: string
  status: string
  timestamp: string
  portfolio: LIAPortfolio
  prices: { egld_usd: number; wbtc_usd: number }
  market: LIAMarket
  cycle: LIACycle
}

export interface XArtistsStaking {
  nft_staking_active: boolean
  tro_staking_active: boolean
  nft_staked_count: number
  tro_staked_amount?: number
}

export interface XArtistsData {
  health: string
  timestamp: string
  collections: { total_mainnet: number; nfts_in_wallet: number }
  tro_token: { balance_wallet: number; value_usd: number; price_usd?: number }
  staking: XArtistsStaking
  battle_of_nodes: { score: number; rank_estimate: string }
}

export interface VoteOption {
  votes: number
  description: string
  risk: string
}

export interface XExchangePool {
  pair_name: string
  tvl_usd: number
}

export interface BonData {
  score: number
  rank_estimate: string
  dao_active: boolean
  current_proposal_title?: string
  vote_results: Record<string, VoteOption>
  winning_pair: string
  total_votes_cast: number
  recommended_pair: string
  recommended_dex?: string
  xexchange_pools?: XExchangePool[]
  timestamp?: string
}
