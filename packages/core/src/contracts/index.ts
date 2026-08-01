/**
 * MultiversX Contract Interfaces & Real Deployed Addresses
 * All contracts are live on MultiversX Mainnet (Chain ID: 1)
 */

import { AGENTS_MARKETPLACE_ADDRESS } from './agentsMarketplaceAbi'

export interface ContractABI {
  name: string
  address: string
  version: string
  functions: ContractFunction[]
  events: ContractEvent[]
}

export interface ContractFunction {
  name: string
  inputs: FunctionInput[]
  outputs: FunctionOutput[]
  payable: boolean
  readonly: boolean
}

export interface FunctionInput {
  name: string
  type: string
  description?: string
}

export interface FunctionOutput {
  name: string
  type: string
  description?: string
}

export interface ContractEvent {
  name: string
  inputs: EventInput[]
  description?: string
}

export interface EventInput {
  name: string
  type: string
  indexed: boolean
}

// ========== TRO GOVERNANCE / STAKING CONTRACT ==========
export const TRO_STAKING_ABI: ContractABI = {
  name: 'TRO Governance',
  address: 'erd1qqqqqqqqqqqqqpgqrscvsxseyw04l0urzgnm2er5mxd2z64nyj7s6e0ca8',
  version: '1.0.0',
  functions: [
    {
      name: 'stake',
      inputs: [],
      outputs: [],
      payable: true,
      readonly: false,
    },
    {
      name: 'unstake',
      inputs: [
        { name: 'token_identifier', type: 'TokenIdentifier' },
        { name: 'amount', type: 'BigUint' },
      ],
      outputs: [],
      payable: false,
      readonly: false,
    },
    {
      name: 'claimRewards',
      inputs: [],
      outputs: [{ name: 'rewards', type: 'EsdtTokenPayment' }],
      payable: false,
      readonly: false,
    },
    {
      name: 'getUserStake',
      inputs: [{ name: 'user', type: 'Address' }],
      outputs: [{ name: 'balance', type: 'BigUint' }],
      payable: false,
      readonly: true,
    },
    {
      name: 'vote',
      inputs: [
        { name: 'proposal_id', type: 'u64' },
        { name: 'pair_name', type: 'ManagedBuffer' },
      ],
      outputs: [],
      payable: false,
      readonly: false,
    },
  ],
  events: [
    {
      name: 'Stake',
      inputs: [
        { name: 'user', type: 'Address', indexed: true },
        { name: 'amount', type: 'BigUint', indexed: false },
      ],
    },
    {
      name: 'Unstake',
      inputs: [
        { name: 'user', type: 'Address', indexed: true },
        { name: 'amount', type: 'BigUint', indexed: false },
      ],
    },
    {
      name: 'VoteCast',
      inputs: [
        { name: 'proposal_id', type: 'u64', indexed: true },
        { name: 'voter', type: 'Address', indexed: true },
        { name: 'pair_name', type: 'ManagedBuffer', indexed: false },
      ],
    },
  ],
}

// ========== NFT STAKING CONTRACT ==========
export const NFT_STAKING_ABI: ContractABI = {
  name: 'NFT Staking',
  address: 'erd1qqqqqqqqqqqqqpgqmhtx5cctwwtatyaluycjfucre9y5vq2xyj7sqxr8cl',
  version: '1.0.0',
  functions: [
    {
      name: 'stake',
      inputs: [],
      outputs: [{ name: 'score', type: 'BigUint' }],
      payable: true,
      readonly: false,
    },
    {
      name: 'unstake',
      inputs: [{ name: 'nft_payments', type: 'EsdtTokenPayment[]' }],
      outputs: [{ name: 'remaining_score', type: 'BigUint' }],
      payable: false,
      readonly: false,
    },
    {
      name: 'claimRewards',
      inputs: [],
      outputs: [],
      payable: false,
      readonly: false,
    },
    {
      name: 'getStakingInfo',
      inputs: [{ name: 'address', type: 'Address' }],
      outputs: [{ name: 'info', type: 'StakingInfo' }],
      payable: false,
      readonly: true,
    },
  ],
  events: [
    {
      name: 'NFTStaked',
      inputs: [
        { name: 'user', type: 'Address', indexed: true },
        { name: 'nft_count', type: 'u32', indexed: false },
        { name: 'score', type: 'BigUint', indexed: false },
      ],
    },
  ],
}

// ========== MARKETPLACE / ESCROW CONTRACT ==========
export const MARKETPLACE_ABI: ContractABI = {
  name: 'Marketplace',
  address: 'erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t',
  version: '1.0.0',
  functions: [
    {
      name: 'listNft',
      inputs: [
        { name: 'price', type: 'BigUint' },
        { name: 'token_identifier', type: 'TokenIdentifier' },
      ],
      outputs: [{ name: 'listing_id', type: 'u64' }],
      payable: true,
      readonly: false,
    },
    {
      name: 'buyNft',
      inputs: [{ name: 'listing_id', type: 'u64' }],
      outputs: [],
      payable: true,
      readonly: false,
    },
    {
      name: 'cancelListing',
      inputs: [{ name: 'listing_id', type: 'u64' }],
      outputs: [],
      payable: false,
      readonly: false,
    },
  ],
  events: [
    {
      name: 'NftListed',
      inputs: [
        { name: 'listing_id', type: 'u64', indexed: true },
        { name: 'seller', type: 'Address', indexed: true },
      ],
    },
    {
      name: 'NftSold',
      inputs: [
        { name: 'listing_id', type: 'u64', indexed: true },
        { name: 'buyer', type: 'Address', indexed: true },
      ],
    },
  ],
}

// ========== NFT MINTER CONTRACT ==========
export const NFT_MINTER_ABI: ContractABI = {
  name: 'NFT Minter',
  address: 'erd1qqqqqqqqqqqqqpgq00a2jzre64akaw4jx257gwwyfxxd8fzfyj7snyztkn',
  version: '1.0.0',
  functions: [
    {
      name: 'mint',
      inputs: [
        { name: 'token_name', type: 'ManagedBuffer' },
        { name: 'royalties', type: 'BigUint' },
        { name: 'uri', type: 'ManagedBuffer' },
      ],
      outputs: [{ name: 'nft_id', type: 'TokenIdentifier' }],
      payable: true,
      readonly: false,
    },
    {
      name: 'burn',
      inputs: [{ name: 'token_identifier', type: 'TokenIdentifier' }],
      outputs: [],
      payable: false,
      readonly: false,
    },
  ],
  events: [
    {
      name: 'NftMinted',
      inputs: [
        { name: 'creator', type: 'Address', indexed: true },
        { name: 'token_id', type: 'TokenIdentifier', indexed: false },
      ],
    },
  ],
}

// ========== AGENTS MARKETPLACE ==========
export const AGENTS_MARKETPLACE_ABI: ContractABI = {
  name: 'Agents Marketplace',
  address: AGENTS_MARKETPLACE_ADDRESS,
  version: '0.1.0',
  functions: [
    {
      name: 'listAgentAction',
      inputs: [
        { name: 'agent_id', type: 'ManagedBuffer', description: 'LIA / GreenSmoke / custom agent id' },
        { name: 'price', type: 'BigUint' },
      ],
      outputs: [],
      payable: false,
      readonly: false,
    },
    {
      name: 'buyAgentAction',
      inputs: [{ name: 'listing_id', type: 'u64' }],
      outputs: [],
      payable: true,
      readonly: false,
    },
    {
      name: 'cancelListing',
      inputs: [{ name: 'listing_id', type: 'u64' }],
      outputs: [],
      payable: false,
      readonly: false,
    },
    {
      name: 'getListing',
      inputs: [{ name: 'listing_id', type: 'u64' }],
      outputs: [{ name: 'listing', type: 'OptionalValue<AgentListing>' }],
      payable: false,
      readonly: true,
    },
  ],
  events: [
    {
      name: 'list',
      inputs: [
        { name: 'listing_id', type: 'u64', indexed: true },
        { name: 'seller', type: 'Address', indexed: true },
      ],
    },
    {
      name: 'buy',
      inputs: [
        { name: 'listing_id', type: 'u64', indexed: true },
        { name: 'buyer', type: 'Address', indexed: true },
      ],
    },
  ],
}

// ========== GOVERNANCE CONTRACT (alias) ==========
export const GOVERNANCE_ABI = TRO_STAKING_ABI

export const ALL_CONTRACTS = {
  troStaking: TRO_STAKING_ABI,
  nftStaking: NFT_STAKING_ABI,
  marketplace: MARKETPLACE_ABI,
  nftMinter: NFT_MINTER_ABI,
  agentsMarketplace: AGENTS_MARKETPLACE_ABI,
} as const
