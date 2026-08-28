/**
 * Intent protocol — Sprint 1 + Sprint 2 (Métabolisme).
 * LIA commande ; $TRO = actif économique séparé.
 */

export type IntentType =
  | 'TRADE_SWAP'
  | 'SWAP_EXCHANGE'
  | 'ADD_LIQUIDITY'
  | 'REMOVE_LIQUIDITY'
  | 'TRANSFER_TOKEN'
  | 'STAKE_ASSET'
  | 'UNSTAKE_ASSET'
  | 'TIP'
  | 'MINT_NFT'
  | 'BALANCE_QUERY'
  | 'INFO'
  | 'UNKNOWN'

export type IntentChain = 'multiversx'

export interface IntentMetadata {
  slippageBps?: number
  gasLimit?: number
  reason?: string
  confidence?: number
  paper?: boolean
  userConfirmedLive?: boolean
  /** Sprint 2 — quote snapshot */
  quoteId?: string
  expectedOutAtomic?: string
  routeDex?: string
  priceImpactBps?: number
}

export interface Intent {
  type: IntentType
  assetFrom: string
  assetTo: string
  /** Atomic amount string (BigInt-safe) */
  amount: string
  targetAddress?: string
  chain: IntentChain
  metadata: IntentMetadata
  timestamp: string
  id?: string
}

export type ValidationLevel = 'SYNTAX' | 'SECURITY' | 'PARAMETERS'

export interface ValidationIssue {
  level: ValidationLevel
  code: string
  message: string
}

export interface ValidationResult {
  ok: boolean
  issues: ValidationIssue[]
  canExecute: boolean
  forcePaper: boolean
}

export type TxLifecycle =
  | 'idle'
  | 'validating'
  | 'pending_signature'
  | 'broadcast'
  | 'pending'
  | 'success'
  | 'error'
  | 'rejected'

export interface ExecutionResult {
  lifecycle: TxLifecycle
  txHash?: string
  message: string
  paper: boolean
  intent: Intent
}

/** Sprint 2 — quote affichée pendant la frappe */
export interface SwapQuotePreview {
  assetFrom: string
  assetTo: string
  amountInHuman: string
  amountOutHuman: string
  rate: number
  dex: string
  priceImpactBps: number
  route: string[]
  stale: boolean
  paper: true
}
