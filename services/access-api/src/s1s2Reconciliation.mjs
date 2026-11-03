/**
 * S1/S2 read-only candidate attestation for operator review.
 *
 * This library never marks a PayBox order delivered and never changes a mint job.
 * Live contract pricing, refunds and durable uniqueness across the full ledger
 * still require separate operator approval before commercial delivery.
 *
 * Caller MUST pass a trusted, complete snapshot of the orders and mint jobs and
 * separately reviewed issuer/collection approval for that pack. Never call with buyer-supplied
 * receipt parameters or an incomplete snapshot and treat the result as delivery.
 */
import { PACK_FIAT_CENTS } from './quote.mjs'
import { verifyMainnetNftReceipt } from './mvxReceiptVerifier.mjs'

const HASH = /^[a-f0-9]{64}$/i
const COLLECTION = /^[A-Z0-9]{3,20}-[0-9a-f]{6}$/i
const TX_ID = /^[A-Za-z0-9_\-:.]{1,128}$/
const ID = /^[A-Za-z0-9_-]{1,64}$/
const blocked = reason => ({ candidate_verified: false, reason, delivery_verified: false })

export function expectedNftIdentifier(collection, nonce) {
  if (!COLLECTION.test(String(collection || '')) ||
      !(typeof nonce === 'number' && Number.isSafeInteger(nonce) && nonce > 0 ||
        typeof nonce === 'string' && /^[1-9][0-9]*$/.test(nonce))) return null
  const hex = BigInt(nonce).toString(16)
  return collection + '-' + (hex.length % 2 ? '0' + hex : hex)
}

/** Offline, early fail-closed checks. No HTTP or filesystem side effects. */
export function verifyOrderReceiptBindings({
  order, mintJob, receipt, approved, ordersSnapshot, jobsSnapshot,
} = {}) {
  if (!order || !mintJob || !receipt || !approved ||
      !Array.isArray(ordersSnapshot) || !Array.isArray(jobsSnapshot)) {
    return blocked('missing_reconciled_evidence_snapshot')
  }
  if (!ID.test(String(order.order_id || '')) ||
      !TX_ID.test(String(order.provider_tx_id || '')) ||
      order.status !== 'paid' || order.server_confirmed !== true ||
      order.payment_verified !== true ||
      order.delivery_verified === true || order.delivery === 'confirmed' ||
      order.delivered_at || order.status === 'refunded' ||
      order.currency !== 'EUR' ||
      order.amount_cents !== PACK_FIAT_CENTS[order.pack_id]) {
    return blocked('s1_payment_not_reconciled_or_amount_mismatch')
  }
  if (!/^erd1[a-z0-9]{58}$/.test(String(order.buyer_address || ''))) {
    return blocked('invalid_buyer')
  }
  // A synthetic GitHub 204 or OIDC dry run is NEVER a mainnet NFT receipt.
  if (mintJob.order_id !== order.order_id ||
      mintJob.provider_tx_id !== order.provider_tx_id ||
      mintJob.amount_cents !== order.amount_cents ||
      mintJob.buyer_address !== order.buyer_address ||
      mintJob.pack_id !== order.pack_id ||
      mintJob.mode !== 'live' || mintJob.micro_price === true ||
      mintJob.github_dispatch_accepted !== true ||
      !['submitted', 'confirmed'].includes(mintJob.status)) {
    return blocked('mint_job_not_live_or_not_correlated')
  }
  if (!receipt || !HASH.test(String(receipt.txHash || '')) ||
      !COLLECTION.test(String(receipt.collection || '')) ||
      receipt.collection !== approved.collection ||
      approved.pack_id !== order.pack_id ||
      typeof receipt.issuer !== 'string' ||
      receipt.issuer !== approved.issuer ||
      receipt.buyer !== order.buyer_address ||
      receipt.amount !== 1) {
    return blocked('untrusted_or_inconsistent_chain_receipt')
  }
  const nftIdentifier = expectedNftIdentifier(receipt.collection, receipt.nonce)
  if (!nftIdentifier || mintJob.nft_identifier !== nftIdentifier ||
      String(mintJob.chain_tx_hash || '').toLowerCase() !== receipt.txHash.toLowerCase()) {
    return blocked('nft_identifier_or_tx_mismatch')
  }
  // Snapshots must include the current rows. A production caller must obtain
  // them together from a trusted consistent DB read, NOT from a request body.
  const sameOrder = ordersSnapshot.filter(o => o?.order_id === order.order_id)
  const sameJob = jobsSnapshot.filter(j => j?.order_id === mintJob.order_id)
  if (sameOrder.length !== 1 || sameJob.length !== 1 ||
      sameOrder[0].provider_tx_id !== order.provider_tx_id ||
      sameOrder[0].status !== order.status ||
      sameOrder[0].server_confirmed !== order.server_confirmed ||
      sameOrder[0].payment_verified !== order.payment_verified ||
      sameOrder[0].amount_cents !== order.amount_cents ||
      sameOrder[0].pack_id !== order.pack_id ||
      sameOrder[0].buyer_address !== order.buyer_address ||
      sameOrder[0].delivery_verified !== order.delivery_verified ||
      sameJob[0].chain_tx_hash !== mintJob.chain_tx_hash ||
      sameJob[0].provider_tx_id !== mintJob.provider_tx_id ||
      sameJob[0].status !== mintJob.status ||
      sameJob[0].mode !== mintJob.mode ||
      sameJob[0].amount_cents !== mintJob.amount_cents ||
      sameJob[0].buyer_address !== mintJob.buyer_address ||
      sameJob[0].nft_identifier !== mintJob.nft_identifier) {
    return blocked('incomplete_or_inconsistent_snapshot')
  }
  if (ordersSnapshot.some(o => o?.order_id !== order.order_id &&
      o?.provider_tx_id === order.provider_tx_id)) {
    return blocked('provider_tx_reused')
  }
  if (jobsSnapshot.some(j => j?.order_id !== order.order_id &&
      ((String(j?.chain_tx_hash || '').toLowerCase() === receipt.txHash.toLowerCase()) ||
       j?.nft_identifier === nftIdentifier))) {
    return blocked('chain_tx_or_nft_reused')
  }
  return { candidate_verified: true, delivery_verified: false, nft_identifier: nftIdentifier }
}

/**
 * Three independent read-only mainnet gateway checks AFTER the strict S1
 * and ledger binding checks. No order or mint_job state mutation.
 */
export async function attestS1S2Candidate(evidence, fetchImpl = fetch) {
  const bound = verifyOrderReceiptBindings(evidence)
  if (!bound.candidate_verified) return bound
  const { receipt, order, approved } = evidence
  const chain = await verifyMainnetNftReceipt({
    txHash: receipt.txHash,
    buyer: order.buyer_address,
    issuer: approved.issuer,
    collection: approved.collection,
    nonce: receipt.nonce,
    amount: 1,
  }, fetchImpl)
  if (!chain.verified) return blocked('s2_chain_receipt_not_verified')
  return {
    candidate_verified: true,
    delivery_verified: false, // requires a separately reviewed durable state transition
    order_id: order.order_id,
    chain_tx_hash: chain.chain_tx_hash,
    nft_identifier: bound.nft_identifier,
    reason: 'operator_review_and_atomic_delivery_commit_required',
  }
}
