/**
 * v3.0 — Protocole d’intention LIA (typage strict).
 * Amounts = chaînes atomic uniquement (BigInt-safe). Jamais de number float pour TX.
 */

export type IntentType =
  | 'SWAP'
  | 'TRADE_SWAP'
  | 'SWAP_EXCHANGE'
  | 'ADD_LIQUIDITY'
  | 'REMOVE_LIQUIDITY'
  | 'TRANSFER'
  | 'TRANSFER_TOKEN'
  | 'STAKE'
  | 'STAKE_ASSET'
  | 'UNSTAKE_ASSET'
  | 'TIP'
  | 'MINT'
  | 'MINT_NFT'
  | 'BALANCE_QUERY'
  | 'INFO'
  | 'UNKNOWN'

export type AssetId = string
/** Atomic integer as decimal string — parse with BigInt() only */
export type AmountAtomic = string

export type IntentChain = 'multiversx'

export type NetworkMode = 'mainnet' | 'devnet' | 'testnet'

export interface IntentMetadata {
  slippageBps?: number
  gasLimit?: number
  reason?: string
  confidence?: number
  /** true = never broadcast */
  paper?: boolean
  userConfirmedLive?: boolean
  quoteId?: string
  expectedOutAtomic?: AmountAtomic
  routeDex?: string
  priceImpactBps?: number
  network?: NetworkMode
}

export interface Intent {
  type: IntentType
  assetFrom: AssetId
  assetTo: AssetId
  amount: AmountAtomic
  targetAddress?: string
  chain: IntentChain
  metadata: IntentMetadata
  timestamp: string
  id?: string
}

export type ValidationLevel = 'SYNTAX' | 'SECURITY' | 'PARAMETERS' | 'ASSET'

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
  | 'validated'
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
  stageError?: 'VALIDATION' | 'SIGNATURE' | 'TRANSMISSION' | 'CONFIRMATION' | null
}

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

/** Normalize legacy type aliases */
export function canonicalIntentType(t: IntentType): IntentType {
  if (t === 'TRADE_SWAP' || t === 'SWAP_EXCHANGE') return 'SWAP'
  if (t === 'TRANSFER_TOKEN') return 'TRANSFER'
  if (t === 'STAKE_ASSET') return 'STAKE'
  if (t === 'MINT_NFT') return 'MINT'
  return t
}
