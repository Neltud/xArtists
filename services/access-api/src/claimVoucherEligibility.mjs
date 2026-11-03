/**
 * Candidate screening ONLY for PayBox -> MultiversX claim-voucher v1.
 *
 * This is a pure, read-only guard, not a signer, entitlement or S1/S2 receipt.
 * A future issuer MUST load a consistent, trusted DB snapshot inside a
 * transaction and recheck refund/revocation/uniqueness at commit time.
 * Never accept an order or snapshot from an HTTP client as proof of payment.
 */
import { PACK_FIAT_CENTS } from './quote.mjs'
import { decodeErdAddress } from './claimVoucherCodec.mjs'

const ORDER_ID = /^[A-Za-z0-9_-]{1,64}$/
const PSP_TX = /^[A-Za-z0-9_:.\-]{1,128}$/
function isValidBuyerAddress(address) {
  try { decodeErdAddress(address); return true }
  catch { return false }
}
const deny = reason => Object.freeze({ candidate_eligible: false, reason })

export function assessPaidClaimCandidate({ order, ordersSnapshot } = {}) {
  if (!order || typeof order !== 'object' || !Array.isArray(ordersSnapshot)) {
    return deny('trusted_order_snapshot_required')
  }
  if (!ORDER_ID.test(String(order.order_id ?? '')) ||
      !PSP_TX.test(String(order.provider_tx_id ?? '')) ||
      !isValidBuyerAddress(order.buyer_address)) {
    return deny('invalid_order_payment_or_buyer_identity')
  }
  if (!Object.hasOwn(PACK_FIAT_CENTS, order.pack_id) ||
      !Number.isSafeInteger(order.amount_cents) ||
      order.amount_cents !== PACK_FIAT_CENTS[order.pack_id] ||
      order.currency !== 'EUR') {
    return deny('pack_or_catalogue_amount_mismatch')
  }
  if (order.status !== 'paid' ||
      order.server_confirmed !== true ||
      order.payment_verified !== true) {
    return deny('payment_not_server_verified')
  }
  if (order.delivery_verified === true || order.delivery === 'confirmed' ||
      order.delivered_at != null || order.chain_tx_hash || order.nft_identifier) {
    return deny('order_already_delivered_or_receipted')
  }
  const same = ordersSnapshot.filter(o => o?.order_id === order.order_id)
  if (same.length !== 1 ||
      same[0].provider_tx_id !== order.provider_tx_id ||
      same[0].status !== order.status ||
      same[0].server_confirmed !== true ||
      same[0].payment_verified !== true ||
      same[0].buyer_address !== order.buyer_address ||
      same[0].pack_id !== order.pack_id ||
      same[0].amount_cents !== order.amount_cents ||
      same[0].currency !== order.currency ||
      same[0].delivery_verified === true ||
      same[0].delivery === 'confirmed' ||
      same[0].delivered_at != null) {
    return deny('order_snapshot_stale_or_incomplete')
  }
  if (ordersSnapshot.some(o => o?.order_id !== order.order_id &&
      o?.provider_tx_id === order.provider_tx_id)) {
    return deny('provider_transaction_reused')
  }
  return Object.freeze({
    candidate_eligible: true,
    reason: 'candidate_only_requires_atomic_db_issuance_and_onchain_replay_guard',
    order_id: order.order_id,
    pack_id: order.pack_id,
    buyer_address: order.buyer_address,
    amount_cents: order.amount_cents,
  })
}
