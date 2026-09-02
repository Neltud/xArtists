/**
 * Agents Marketplace ABI — aligned with contracts/agents-marketplace/src/lib.rs
 * Endpoints: listAgentAction | buyAgentAction | cancelListing | getListing
 */

export const AGENTS_MARKETPLACE_ADDRESS =
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_AGENTS_MARKETPLACE_ADDRESS) ||
  '' // set after mxpy deploy

export const AGENTS_MARKETPLACE_ABI = {
  name: 'Agents Marketplace',
  /** Env can override; apps/frontend also hydrates from data/contracts.json after deploy */
  address: AGENTS_MARKETPLACE_ADDRESS,
  version: '0.1.0',
  endpoints: {
    listAgentAction: {
      name: 'listAgentAction',
      payable: false,
      inputs: [
        { name: 'agent_id', type: 'ManagedBuffer' },
        { name: 'price', type: 'BigUint' }, // atomic EGLD
      ],
    },
    buyAgentAction: {
      name: 'buyAgentAction',
      payable: true, // EGLD
      inputs: [{ name: 'listing_id', type: 'u64' }],
    },
    cancelListing: {
      name: 'cancelListing',
      payable: false,
      inputs: [{ name: 'listing_id', type: 'u64' }],
    },
    getListing: {
      name: 'getListing',
      payable: false,
      readonly: true,
      inputs: [{ name: 'listing_id', type: 'u64' }],
      outputs: [{ name: 'listing', type: 'Option<AgentListing>' }],
    },
    listingCount: {
      name: 'listingCount',
      payable: false,
      readonly: true,
      inputs: [],
    },
  },
  events: ['list', 'buy'],
  initArgs: { fee_bps: 250 }, // 2.5% default on deploy
} as const

export type AgentListingView = {
  listingId: number
  seller: string
  agentId: string
  priceEgld: string
  active: boolean
}
