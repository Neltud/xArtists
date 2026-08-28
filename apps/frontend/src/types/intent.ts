/**
 * Sprint 1 — Protocole d'intention (schéma strict).
 * LIA commande ; $TRO = actif économique séparé (mint/burn/stake policy).
 */

export type IntentType =
  | 'TRADE_SWAP'
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
  /** Slippage bps, e.g. 50 = 0.5% */
  slippageBps?: number
  /** Gas limit hint (MVX gas limit units) */
  gasLimit?: number
  /** Human note / NL source */
  reason?: string
  /** Confidence 0–1 from parser */
  confidence?: number
  /** Paper simulation — never broadcast */
  paper?: boolean
  /** Explicit user confirmation for live */
  userConfirmedLive?: boolean
}

export interface Intent {
  type: IntentType
  /** ESDT id or EGLD */
  assetFrom: string
  assetTo: string
  /** Atomic amount as decimal string (no float) */
  amount: string
  /** erd1… for transfers */
  targetAddress?: string
  chain: IntentChain
  metadata: IntentMetadata
  timestamp: string
  /** Optional correlation id */
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
  /** true → may proceed to wallet sign path (still needs provider) */
  canExecute: boolean
  /** true → UI paper path only */
  forcePaper: boolean
}

export type TxLifecycle = 'idle' | 'validating' | 'pending_signature' | 'broadcast' | 'pending' | 'success' | 'error' | 'rejected'

export interface ExecutionResult {
  lifecycle: TxLifecycle
  txHash?: string
  message: string
  paper: boolean
  intent: Intent
}
