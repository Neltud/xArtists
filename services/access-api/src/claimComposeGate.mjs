/**
 * Compose #312 eligibility + revocation policy for a future voucher issuer.
 * Pure / fail-closed. Never signs. Never talks to chain.
 */
import { assessPaidClaimCandidate } from './claimVoucherEligibility.mjs'
import { assessClaimIssuanceGate, clampVoucherTtlSec } from './claimRevocationPolicy.mjs'
import { orderHash } from './claimDomainCodec.mjs'

/**
 * @param {{ order: object, ordersSnapshot: object[], ttl_sec?: number }} input
 */
export function composeClaimGate(input = {}) {
  const eligibility = assessPaidClaimCandidate({
    order: input.order,
    ordersSnapshot: input.ordersSnapshot,
  })
  if (!eligibility.candidate_eligible) {
    return Object.freeze({
      ok: false,
      stage: 'eligibility',
      reason: eligibility.reason,
      candidate_eligible: false,
      issuable: false,
      revoke_on_chain: false,
    })
  }
  const issuance = assessClaimIssuanceGate(input.order)
  if (!issuance.issuable) {
    return Object.freeze({
      ok: false,
      stage: 'issuance_gate',
      reason: issuance.reason,
      candidate_eligible: true,
      issuable: false,
      revoke_on_chain: issuance.revoke_on_chain,
    })
  }
  const ttl = clampVoucherTtlSec(input.ttl_sec)
  const now = Math.floor(Date.now() / 1000)
  return Object.freeze({
    ok: true,
    stage: 'compose_ready_no_sign',
    reason: 'ready_for_atomic_db_reservation_and_claim_only_signer',
    candidate_eligible: true,
    issuable: true,
    revoke_on_chain: false,
    order_id: eligibility.order_id,
    pack_id: eligibility.pack_id,
    buyer_address: eligibility.buyer_address,
    amount_cents: eligibility.amount_cents,
    order_hash_hex: orderHash(eligibility.order_id).toString('hex'),
    voucher_ttl_sec: ttl,
    not_before: now,
    expires_at: now + ttl,
    // Explicit: caller must still lock DB + sign with claim-only key + SC single-use
    signed: false,
  })
}
