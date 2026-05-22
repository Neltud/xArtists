/**
 * MultiversX Contract Interfaces
 */

export interface ContractABI {
  name: string;
  address: string;
  version: string;
  functions: ContractFunction[];
  events: ContractEvent[];
}

export interface ContractFunction {
  name: string;
  inputs: FunctionInput[];
  outputs: FunctionOutput[];
  payable: boolean;
  readonly: boolean;
}

export interface FunctionInput {
  name: string;
  type: string;
  description?: string;
}

export interface FunctionOutput {
  name: string;
  type: string;
  description?: string;
}

export interface ContractEvent {
  name: string;
  inputs: EventInput[];
  description?: string;
}

export interface EventInput {
  name: string;
  type: string;
  indexed: boolean;
}

// ========== STAKING CONTRACT ==========
export const TRO_STAKING_ABI: ContractABI = {
  name: 'TRO Staking',
  address: 'erd1...',
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
  ],
};

// ========== NFT STAKING CONTRACT ==========
export const NFT_STAKING_ABI: ContractABI = {
  name: 'NFT Staking',
  address: 'erd1...',
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
};

// ========== GOVERNANCE CONTRACT ==========
export const GOVERNANCE_ABI: ContractABI = {
  name: 'DAO Governance',
  address: 'erd1...',
  version: '1.0.0',
  functions: [
    {
      name: 'createProposal',
      inputs: [
        { name: 'title', type: 'ManagedBuffer' },
        { name: 'description', type: 'ManagedBuffer' },
        { name: 'min_voting_power', type: 'BigUint' },
      ],
      outputs: [{ name: 'proposal_id', type: 'u64' }],
      payable: false,
      readonly: false,
    },
    {
      name: 'vote',
      inputs: [
        { name: 'proposal_id', type: 'u64' },
        { name: 'decision', type: 'VoteDecision' },
      ],
      outputs: [],
      payable: false,
      readonly: false,
    },
    {
      name: 'getProposal',
      inputs: [{ name: 'proposal_id', type: 'u64' }],
      outputs: [{ name: 'proposal', type: 'Proposal' }],
      payable: false,
      readonly: true,
    },
  ],
  events: [
    {
      name: 'ProposalCreated',
      inputs: [
        { name: 'proposal_id', type: 'u64', indexed: true },
        { name: 'creator', type: 'Address', indexed: true },
      ],
    },
    {
      name: 'VoteCast',
      inputs: [
        { name: 'proposal_id', type: 'u64', indexed: true },
        { name: 'voter', type: 'Address', indexed: true },
      ],
    },
  ],
};
