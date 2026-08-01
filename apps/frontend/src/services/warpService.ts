export interface WarpInput {
  name: string
  label: string
  type: string
  source: 'field' | 'query' | 'user:wallet' | 'hidden'
  position?: string
  required?: boolean
  description?: string
  default?: string | number | boolean
  modifier?: string
  min?: number
}

export interface WarpTemplate {
  protocol: 'warp:3.0.0'
  chain: 'multiversx'
  name: string
  title: string
  description: string
  actions: Array<{
    type: 'contract' | 'query'
    label: string
    address: string
    func: string
    gasLimit?: number
    auto?: boolean
    inputs?: WarpInput[]
  }>
  messages?: Record<string, string>
}

interface BuildWarpParams {
  address: string
  listingId?: number
  agentId?: string
  priceEgld?: string
}

const EMPTY_ADDRESS = '{{AGENTS_MARKETPLACE_ADDRESS}}'

function normalizeAddress(address: string): string {
  return address.startsWith('erd1') ? address : EMPTY_ADDRESS
}

function normalizeEgld(priceEgld?: string): string {
  return priceEgld && priceEgld.trim() ? priceEgld.trim() : '0.01'
}

export function buildBuyAgentWarp({ address, listingId = 1, priceEgld }: BuildWarpParams): WarpTemplate {
  return {
    protocol: 'warp:3.0.0',
    chain: 'multiversx',
    name: 'xartists-buy-agent-action',
    title: 'Buy Agent Action',
    description: 'Buy an xArtists agent action listing with EGLD.',
    actions: [
      {
        type: 'contract',
        label: 'Buy now',
        address: normalizeAddress(address),
        func: 'buyAgentAction',
        gasLimit: 18_000_000,
        inputs: [
          {
            name: 'listing_id',
            label: 'Listing ID',
            description: 'Listing identifier returned by listAgentAction.',
            type: 'u64',
            position: 'arg:1',
            source: 'field',
            required: true,
            default: listingId,
            min: 1,
          },
          {
            name: 'payment_egld',
            label: 'Payment (EGLD)',
            description: 'EGLD value sent with buyAgentAction.',
            type: 'biguint',
            position: 'value',
            source: 'field',
            required: true,
            default: normalizeEgld(priceEgld),
            modifier: 'scale:18',
            min: 0.000001,
          },
        ],
      },
    ],
    messages: {
      success: 'buyAgentAction submitted to your MultiversX wallet.',
    },
  }
}

export function buildListAgentWarp({ address, agentId = 'LIA-v6', priceEgld }: BuildWarpParams): WarpTemplate {
  return {
    protocol: 'warp:3.0.0',
    chain: 'multiversx',
    name: 'xartists-list-agent-action',
    title: 'List Agent Action',
    description: 'Create an xArtists agent action listing priced in EGLD.',
    actions: [
      {
        type: 'contract',
        label: 'List now',
        address: normalizeAddress(address),
        func: 'listAgentAction',
        gasLimit: 12_000_000,
        inputs: [
          {
            name: 'agent_id',
            label: 'Agent ID',
            description: 'Agent identifier exposed in the xArtists agents marketplace.',
            type: 'string',
            position: 'arg:1',
            source: 'field',
            required: true,
            default: agentId,
          },
          {
            name: 'price_egld',
            label: 'Price (EGLD)',
            description: 'Listing price converted to BigUint atomic EGLD.',
            type: 'biguint',
            position: 'arg:2',
            source: 'field',
            required: true,
            default: normalizeEgld(priceEgld),
            modifier: 'scale:18',
            min: 0.000001,
          },
        ],
      },
    ],
    messages: {
      success: 'listAgentAction submitted to your MultiversX wallet.',
    },
  }
}
