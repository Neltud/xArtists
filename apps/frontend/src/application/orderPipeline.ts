/**
 * Order pipeline use-cases — pure orchestration of domain transitions.
 * Does not broadcast; SUBMITTED+ requires injected adapters (Phase 3+).
 */

import { transition, type OrderState } from '../domain/order'
import { hashDigest, type OrderDigestFields } from '../domain/orderDigest'
import { checkPolicy } from '../domain/riskPolicy'
import type { DraftIntent, OrderId, OrderRecord, QuoteInput, ServiceResult } from './types'

function now(): number {
  return Math.floor(Date.now() / 1000)
}

function newId(): OrderId {
  return `ord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function createDraftOrder(
  intent: DraftIntent,
  opts?: { spentUsdToday?: number; liveTradingEnabled?: boolean },
): ServiceResult<OrderRecord> {
  if (!intent.walletAddress?.trim()) {
    return { ok: false, reason: 'missing_wallet' }
  }
  if (!intent.intentId?.trim()) {
    return { ok: false, reason: 'missing_intent' }
  }
  const t = now()
  const record: OrderRecord = {
    id: newId(),
    state: 'DRAFT',
    digestFields: null,
    digestHash: null,
    amountUsd: null,
    spentUsdToday: opts?.spentUsdToday ?? 0,
    liveTradingEnabled: opts?.liveTradingEnabled ?? false,
    createdAt: t,
    updatedAt: t,
  }
  // stash intent on a side channel via digest skeleton (amount filled at quote)
  ;(record as OrderRecord & { _intent?: DraftIntent })._intent = intent
  return { ok: true, value: record }
}

/** Internal: recover draft intent (not part of public OrderRecord). */
function getIntent(order: OrderRecord): DraftIntent | null {
  return (order as OrderRecord & { _intent?: DraftIntent })._intent ?? null
}

export function attachQuote(order: OrderRecord, quote: QuoteInput): ServiceResult<OrderRecord> {
  if (order.state !== 'DRAFT') {
    return { ok: false, reason: `expected_DRAFT_got_${order.state}` }
  }
  const intent = getIntent(order)
  if (!intent) {
    return { ok: false, reason: 'missing_draft_intent' }
  }
  if (!/^[0-9]+$/.test(quote.amountAtomic)) {
    return { ok: false, reason: 'invalid_amount_atomic' }
  }
  if (!Number.isFinite(quote.amountUsd) || quote.amountUsd <= 0) {
    return { ok: false, reason: 'invalid_amount_usd' }
  }
  if (quote.expiry <= now()) {
    return { ok: false, reason: 'quote_expired' }
  }

  const digestFields: OrderDigestFields = {
    chainId: intent.chainId,
    walletAddress: intent.walletAddress,
    walletRole: intent.walletRole,
    intentId: intent.intentId,
    amountAtomic: quote.amountAtomic,
    tokenIn: intent.tokenIn,
    tokenOut: intent.tokenOut,
    slippageBps: quote.slippageBps,
    quoteId: quote.quoteId,
    expiry: quote.expiry,
  }

  let state: OrderState
  try {
    state = transition(order.state, 'QUOTED')
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) }
  }

  const next: OrderRecord = {
    ...order,
    state,
    digestFields,
    digestHash: hashDigest(digestFields),
    amountUsd: quote.amountUsd,
    updatedAt: now(),
  }
  ;(next as OrderRecord & { _intent?: DraftIntent })._intent = intent
  return { ok: true, value: next }
}

export function runPolicyCheck(order: OrderRecord): ServiceResult<OrderRecord> {
  if (order.state !== 'QUOTED') {
    return { ok: false, reason: `expected_QUOTED_got_${order.state}` }
  }
  if (!order.digestFields || order.amountUsd == null) {
    return { ok: false, reason: 'missing_quote_data' }
  }

  const policy = checkPolicy({
    chainId: order.digestFields.chainId,
    walletRole: order.digestFields.walletRole,
    amountUsd: order.amountUsd,
    spentUsdToday: order.spentUsdToday,
    slippageBps: order.digestFields.slippageBps,
    liveTradingEnabled: order.liveTradingEnabled,
    amountAtomic: order.digestFields.amountAtomic,
  })

  if (!policy.ok) {
    return { ok: false, reason: policy.reason }
  }

  try {
    const state = transition(order.state, 'POLICY_CHECKED')
    return {
      ok: true,
      value: { ...order, state, updatedAt: now() },
    }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Move to AWAITING_HUMAN_APPROVAL.
 * Does NOT accept an approver string as proof — only advances state so UI/server
 * can collect a real one-time, expiry-bound approval bound to digestHash.
 */
export function requestHumanApproval(order: OrderRecord): ServiceResult<OrderRecord> {
  if (order.state !== 'POLICY_CHECKED') {
    return { ok: false, reason: `expected_POLICY_CHECKED_got_${order.state}` }
  }
  if (!order.digestHash) {
    return { ok: false, reason: 'missing_digest' }
  }
  try {
    const state = transition(order.state, 'AWAITING_HUMAN_APPROVAL')
    return {
      ok: true,
      value: { ...order, state, updatedAt: now() },
    }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Apply server-verified approval for the exact digest.
 * Call only after authenticated, one-time, expiry-bound check against digestHash.
 */
export function markApproved(
  order: OrderRecord,
  verifiedDigestHash: string,
): ServiceResult<OrderRecord> {
  if (order.state !== 'AWAITING_HUMAN_APPROVAL') {
    return { ok: false, reason: `expected_AWAITING_HUMAN_APPROVAL_got_${order.state}` }
  }
  if (!order.digestHash || order.digestHash !== verifiedDigestHash) {
    return { ok: false, reason: 'digest_mismatch' }
  }
  try {
    const state = transition(order.state, 'APPROVED')
    return {
      ok: true,
      value: { ...order, state, updatedAt: now() },
    }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) }
  }
}

export function markSubmitted(order: OrderRecord): ServiceResult<OrderRecord> {
  if (order.state !== 'APPROVED') {
    return { ok: false, reason: `expected_APPROVED_got_${order.state}` }
  }
  try {
    const state = transition(order.state, 'SUBMITTED')
    return { ok: true, value: { ...order, state, updatedAt: now() } }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) }
  }
}

export function markConfirmed(order: OrderRecord): ServiceResult<OrderRecord> {
  if (order.state !== 'SUBMITTED') {
    return { ok: false, reason: `expected_SUBMITTED_got_${order.state}` }
  }
  try {
    const state = transition(order.state, 'CONFIRMED')
    return { ok: true, value: { ...order, state, updatedAt: now() } }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) }
  }
}

export function markFailed(order: OrderRecord, reason: string): ServiceResult<OrderRecord> {
  try {
    const state = transition(order.state, 'FAILED')
    return {
      ok: true,
      value: { ...order, state, lastError: reason, updatedAt: now() },
    }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) }
  }
}

/** Fail-closed: do not auto-retry after UNKNOWN. */
export function markUnknown(order: OrderRecord, reason?: string): ServiceResult<OrderRecord> {
  if (order.state !== 'SUBMITTED') {
    return { ok: false, reason: `expected_SUBMITTED_got_${order.state}` }
  }
  try {
    const state = transition(order.state, 'UNKNOWN')
    return {
      ok: true,
      value: { ...order, state, lastError: reason ?? 'broadcast_outcome_unknown', updatedAt: now() },
    }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) }
  }
}

export function markHalted(order: OrderRecord, reason?: string): ServiceResult<OrderRecord> {
  try {
    const state = transition(order.state, 'HALTED')
    return {
      ok: true,
      value: { ...order, state, lastError: reason ?? 'kill_switch', updatedAt: now() },
    }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) }
  }
}
