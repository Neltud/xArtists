/**
 * Binary message layout for future xartists.claim-pack.v1 (Ed25519 over these bytes).
 * Symbiosis with PR #312 docs — encode only; never signs; no secrets.
 *
 * Domain: literal ASCII "XA-CLAIM-PACK-V1" + 0x00 (17 bytes total).
 */
import crypto from 'node:crypto'

export const CLAIM_DOMAIN = Buffer.from('XA-CLAIM-PACK-V1\0', 'ascii')
export const PACK_TYPE_CODE = Object.freeze({ pulse: 1, yield: 2, sentinel: 3 })

function u8(n) {
  if (!Number.isInteger(n) || n < 0 || n > 255) throw new Error('u8_out_of_range')
  return Buffer.from([n])
}
function u16be(n) {
  if (!Number.isInteger(n) || n < 0 || n > 0xffff) throw new Error('u16_out_of_range')
  const b = Buffer.alloc(2)
  b.writeUInt16BE(n)
  return b
}
function u32be(n) {
  if (!Number.isInteger(n) || n < 0 || n > 0xffffffff) throw new Error('u32_out_of_range')
  const b = Buffer.alloc(4)
  b.writeUInt32BE(n)
  return b
}
function u64be(n) {
  if (typeof n !== 'bigint' && !Number.isSafeInteger(n)) throw new Error('u64_invalid')
  const v = typeof n === 'bigint' ? n : BigInt(n)
  if (v < 0n || v > 0xffffffffffffffffn) throw new Error('u64_out_of_range')
  const b = Buffer.alloc(8)
  b.writeBigUInt64BE(v)
  return b
}

/** order_hash = SHA-256("xartists/order/v1\0" + utf8(order_id)) */
export function orderHash(orderId) {
  const id = String(orderId)
  return crypto.createHash('sha256').update('xartists/order/v1\0', 'utf8').update(id, 'utf8').digest()
}

/**
 * @param {object} p
 * @param {string} p.chain_id ascii e.g. "1"
 * @param {Buffer} p.sc_address 32 bytes
 * @param {number} p.signer_epoch u32
 * @param {string} p.order_id
 * @param {'pulse'|'yield'|'sentinel'} p.pack_id
 * @param {Buffer} p.buyer 32-byte address pubkey/hash as stored by SC convention (opaque 32B)
 * @param {number} p.amount_cents
 * @param {number|bigint} p.not_before unix s
 * @param {number|bigint} p.expires_at unix s
 * @param {number} p.catalog_version
 */
export function encodeClaimMessage(p) {
  if (CLAIM_DOMAIN.length !== 17) throw new Error('domain_length_invariant')
  const chain = Buffer.from(String(p.chain_id), 'ascii')
  if (chain.length < 1 || chain.length > 32) throw new Error('chain_id_length')
  if (!Buffer.isBuffer(p.sc_address) || p.sc_address.length !== 32) throw new Error('sc_address_32')
  if (!Buffer.isBuffer(p.buyer) || p.buyer.length !== 32) throw new Error('buyer_32')
  const pack = PACK_TYPE_CODE[p.pack_id]
  if (!pack) throw new Error('unknown_pack')
  if (!Number.isSafeInteger(p.amount_cents) || p.amount_cents <= 0) throw new Error('amount_cents')

  return Buffer.concat([
    CLAIM_DOMAIN,
    u8(chain.length),
    chain,
    p.sc_address,
    u32be(p.signer_epoch),
    orderHash(p.order_id),
    u8(pack),
    p.buyer,
    u64be(p.amount_cents),
    u64be(p.not_before),
    u64be(p.expires_at),
    u16be(p.catalog_version),
  ])
}

export function encodeClaimMessageHex(p) {
  return encodeClaimMessage(p).toString('hex')
}
