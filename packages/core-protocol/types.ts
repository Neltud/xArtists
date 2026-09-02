/**
 * LIA Intent Protocol (LIP) — contrat de vérité inter-modules.
 * Montants atomiques en string (BigInt-safe). Immuable après scellage Guardian.
 */

export type ChainId = 'ethereum' | 'polygon' | 'base' | 'multiversx' | 'arbitrum'

export type IntentActionFamily = 'FINANCIAL' | 'CREATIVE' | 'TRAVEL' | 'INFO' | 'UNKNOWN'

export type FinancialAction = 'TRANSFER' | 'SWAP' | 'STAKE'
export type CreativeAction = 'MINT' | 'LIST' | 'TRANSFER_IP'
export type TravelAction = 'SEARCH' | 'RESERVE' | 'PAY_BOOKING'

export type IntentType =
  | FinancialAction
  | CreativeAction
  | TravelAction
  | 'BALANCE'
  | 'INFO'
  | 'UNKNOWN'

/** Objet Intention LIP */
export interface LiaIntent {
  readonly protocol: 'LIP-1'
  readonly intent_type: IntentType
  readonly family: IntentActionFamily
  readonly raw: string
  readonly chain: ChainId
  /** Unités atomiques — string pour JSON sûr */
  readonly amount_atomic: string
  readonly decimals: 6 | 18
  readonly asset: string
  readonly target_address?: string
  readonly reason: string
  readonly confidence_score: number
  readonly requires_human_approval: boolean
  readonly sealed: boolean
  readonly created_at: string
  readonly metadata?: Record<string, string | number | boolean>
}

export type TxLifecycle =
  | 'CREATED'
  | 'GUARDIAN_CHECK'
  | 'SIGNED'
  | 'BROADCASTED'
  | 'CONFIRMED'
  | 'FAILED'
  | 'REVERSED'

export interface TransactionReceipt {
  tx_hash: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED'
  chain: ChainId
  gas_spent_by_relayer: string
  final_atomic_amount: string
  lifecycle: TxLifecycle
}

export interface PaymentIntent {
  amount_fiat: number
  currency_fiat: string
  target_asset: string
  target_chain: 'ETHEREUM' | 'MULTIVERSX'
  destination_address: string
}

export interface GuardianVerdict {
  allowed: boolean
  code: string
  message: string
  risk_score: number
}

export interface ILiaBrainAdapter {
  parse(raw: string): Promise<LiaIntent>
}

export interface IActionAdapter {
  execute(intent: LiaIntent): Promise<TransactionReceipt>
}

export interface IUiAdapter {
  setState(state: 'idle' | 'thinking' | 'success' | 'error', detail?: string): void
}
