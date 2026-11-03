/**
 * Pure policy: when a paid candidate must NOT receive a voucher / must be revoked on-chain.
 * Complements assessPaidClaimCandidate (#312). No DB, no signing.
 */

const TERMINAL_BAD = new Set([
  'refunded',
  'cancelled',
  'refused',
  'chargeback',
  'disputed',
])

/**
 * @param {object} order trusted row
 * @returns {{ issuable: boolean, revoke_on_chain: boolean, reason: string }}
 */
export function assessClaimIssuanceGate(order) {
  if (!order || typeof order !== 'object') {
    return { issuable: false, revoke_on_chain: false, reason: 'missing_order' }
  }
  const status = String(order.status || '')
  if (TERMINAL_BAD.has(status)) {
    return {
      issuable: false,
      revoke_on_chain: true,
      reason: `status_${status}`,
    }
  }
  if (order.refunded === true || order.chargeback === true) {
    return { issuable: false, revoke_on_chain: true, reason: 'refund_or_chargeback_flag' }
  }
  if (order.server_confirmed !== true || order.payment_verified !== true || status !== 'paid') {
    return { issuable: false, revoke_on_chain: false, reason: 'not_server_verified_paid' }
  }
  if (order.delivery_verified === true || order.delivery === 'confirmed') {
    return { issuable: false, revoke_on_chain: false, reason: 'already_delivered' }
  }
  if (order.voucher_revoked === true || order.claim_revoked === true) {
    return { issuable: false, revoke_on_chain: true, reason: 'explicit_revocation' }
  }
  return { issuable: true, revoke_on_chain: false, reason: 'issuable_candidate_only' }
}

/** TTL policy defaults (seconds) — issuer must enforce; SC checks expires_at. */
export const CLAIM_VOUCHER_TTL_POLICY = Object.freeze({
  default_ttl_sec: 30 * 60,
  max_ttl_sec: 2 * 60 * 60,
  min_ttl_sec: 5 * 60,
  require_onchain_revoke_before_go: true,
})

export function clampVoucherTtlSec(requested) {
  const n = Number(requested)
  if (!Number.isFinite(n)) return CLAIM_VOUCHER_TTL_POLICY.default_ttl_sec
  return Math.min(
    CLAIM_VOUCHER_TTL_POLICY.max_ttl_sec,
    Math.max(CLAIM_VOUCHER_TTL_POLICY.min_ttl_sec, Math.floor(n)),
  )
}
