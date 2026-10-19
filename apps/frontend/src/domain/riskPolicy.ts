/**
 * Proposed risk caps (ADR 0001) — product intent until enforced server-side.
 * Pure validation: rejects NaN, Infinity, bad decimals, over-cap.
 */

import type { ChainId } from './chain'
import type { WalletRole } from './walletRole'

/** Proposed defaults — not security guarantees until trusted service enforces. */
export const RISK_CAPS = {
  maxUsdPerOrder: 5,
  maxUsdPerDay: 15,
  maxSlippageBps: 50,
} as const

export type PolicyInput = {
  chainId: ChainId
  walletRole: WalletRole
  /** Notional in USD (display quote); must be finite */
  amountUsd: number
  /** Already spent today in USD for this user (from trusted ledger when available) */
  spentUsdToday: number
  slippageBps: number
  /** Live trading flag — LIA Ops blocked when false */
  liveTradingEnabled: boolean
  amountAtomic: string
}

export type PolicyResult =
  | { ok: true }
  | { ok: false; reason: string }

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n)
}

function isAtomicString(s: string): boolean {
  return /^[0-9]+$/.test(s) && s.length > 0
}

export function checkPolicy(input: PolicyInput): PolicyResult {
  if (!isFiniteNumber(input.amountUsd) || input.amountUsd < 0) {
    return { ok: false, reason: 'invalid_amount_usd' }
  }
  if (!isFiniteNumber(input.spentUsdToday) || input.spentUsdToday < 0) {
    return { ok: false, reason: 'invalid_spent_usd_today' }
  }
  if (!isFiniteNumber(input.slippageBps) || input.slippageBps < 0) {
    return { ok: false, reason: 'invalid_slippage' }
  }
  if (!isAtomicString(input.amountAtomic)) {
    return { ok: false, reason: 'invalid_amount_atomic' }
  }
  if (input.amountUsd > RISK_CAPS.maxUsdPerOrder) {
    return { ok: false, reason: 'over_per_order_cap' }
  }
  if (input.spentUsdToday + input.amountUsd > RISK_CAPS.maxUsdPerDay) {
    return { ok: false, reason: 'over_daily_cap' }
  }
  if (input.slippageBps > RISK_CAPS.maxSlippageBps) {
    return { ok: false, reason: 'over_slippage_cap' }
  }
  if (input.walletRole === 'lia_ops' && !input.liveTradingEnabled) {
    return { ok: false, reason: 'lia_ops_paper_only' }
  }
  if (input.amountUsd === 0) {
    return { ok: false, reason: 'zero_amount' }
  }
  return { ok: true }
}
