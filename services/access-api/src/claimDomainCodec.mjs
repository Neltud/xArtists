/**
 * Backwards-compatible adapter used by Grok's phase-0 compose gate.
 * The ONLY canonical encoder is claimVoucherCodec.mjs (#312, main).
 * This facade MUST NOT implement a second divergent binary protocol.
 * Pure / offline. No signing, HTTP, transaction, or entitlements.
 */
import {
  CLAIM_V1_DOMAIN, CLAIM_V1_PACK, orderHashV1, encodeClaimVoucherV1,
} from './claimVoucherCodec.mjs'

export const CLAIM_DOMAIN = CLAIM_V1_DOMAIN
export const PACK_TYPE_CODE = CLAIM_V1_PACK
export const orderHash = orderHashV1

export function encodeClaimMessage(p) {
  if (!p || typeof p !== 'object') throw new TypeError('voucher_payload_required')
  if (!(p.sc_address instanceof Uint8Array) || p.sc_address.length !== 32) {
    throw new TypeError('sc_address_32')
  }
  if (!(p.buyer instanceof Uint8Array) || p.buyer.length !== 32) {
    throw new TypeError('buyer_32')
  }
  if (!Object.hasOwn(PACK_TYPE_CODE, p.pack_id)) {
    throw new TypeError('unknown_pack')
  }
  return encodeClaimVoucherV1({
    chain_id: p.chain_id,
    sc_address: p.sc_address,
    signer_epoch: p.signer_epoch,
    order_id: p.order_id,
    pack_type: PACK_TYPE_CODE[p.pack_id],
    buyer: p.buyer,
    amount_cents: p.amount_cents,
    not_before: p.not_before,
    expires_at: p.expires_at,
    catalog_version: p.catalog_version,
  })
}

export function encodeClaimMessageHex(p) {
  return encodeClaimMessage(p).toString('hex')
}
