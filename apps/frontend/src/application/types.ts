/**
 * Application-layer types for the order pipeline (ADR 0001 Phase 2).
 * No network; orchestrates domain only until adapters are injected.
 */

import type { ChainId } from '../domain/chain'
import type { OrderState } from '../domain/order'
import type { OrderDigestFields } from '../domain/orderDigest'
import type { WalletRole } from '../domain/walletRole'

export type OrderId = string

export type OrderRecord = {
  id: OrderId
  state: OrderState
  digestFields: OrderDigestFields | null
  digestHash: string | null
  /** USD notional for policy (from quote); null until QUOTED */
  amountUsd: number | null
  spentUsdToday: number
  liveTradingEnabled: boolean
  createdAt: number
  updatedAt: number
  lastError?: string
}

export type DraftIntent = {
  chainId: ChainId
  walletAddress: string
  walletRole: WalletRole
  intentId: string
  tokenIn: string
  tokenOut: string
  /** Optional hint; final atomic set at quote */
  amountAtomicHint?: string
}

export type QuoteInput = {
  amountAtomic: string
  amountUsd: number
  slippageBps: number
  quoteId: string
  /** Unix seconds */
  expiry: number
}

export type ServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string }
