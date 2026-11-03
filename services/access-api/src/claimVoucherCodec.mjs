/**
 * xartists.claim-pack.v1 — canonical offline voucher codec only.
 *
 * NO signer, no HTTP route, no entitlement, no database writes and no SC call.
 * Production issuance requires atomic S1 reservation + refund/revoke checks,
 * a claim-only key in a vault, on-chain single-use, and independent S2 receipts.
 */
import { createHash, createPublicKey, verify as edVerify } from 'node:crypto'
import { PACK_FIAT_CENTS } from './quote.mjs'

export const CLAIM_V1_DOMAIN = Buffer.from('XA-CLAIM-PACK-V1\0', 'ascii')
export const CLAIM_V1_ORDER_DOMAIN = Buffer.from('xartists/order/v1\0', 'ascii')
export const CLAIM_V1_MAX_TTL_SECONDS = 15n * 60n
export const CLAIM_V1_PACK = Object.freeze({ pulse: 1, yield: 2, sentinel: 3 })
const PRICE_BY_TYPE = Object.freeze({
  1: PACK_FIAT_CENTS.pulse,
  2: PACK_FIAT_CENTS.yield,
  3: PACK_FIAT_CENTS.sentinel,
})
const BECH32_CHARS = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const BECH32_GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
const SPKI_ED25519_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')
const VALID_ORDER_ID = /^[A-Za-z0-9_-]{1,64}$/
const MAX_U64 = (1n << 64n) - 1n

function requireUnsigned(value, bits, field) {
  if (!(typeof value === 'bigint' ||
      (typeof value === 'number' && Number.isSafeInteger(value)))) {
    throw new TypeError(field + '_not_an_exact_integer')
  }
  const n = BigInt(value)
  if (n < 0n || n >= (1n << BigInt(bits))) {
    throw new RangeError(field + '_out_of_range')
  }
  return n
}
function bigEndian(value, bytes, field) {
  const n = requireUnsigned(value, bytes * 8, field)
  const out = Buffer.alloc(bytes)
  for (let i = 0; i < bytes; i++) {
    out[bytes - i - 1] = Number((n >> (8n * BigInt(i))) & 0xffn)
  }
  return out
}
function bech32Polymod(values) {
  let chk = 1
  for (const value of values) {
    const top = chk >>> 25
    chk = ((chk & 0x1ffffff) << 5) ^ value
    for (let i = 0; i < 5; i++) {
      if ((top >>> i) & 1) chk ^= BECH32_GENERATORS[i]
    }
  }
  return chk >>> 0
}
function expandHrp(hrp) {
  return [
    ...[...hrp].map(c => c.charCodeAt(0) >>> 5),
    0,
    ...[...hrp].map(c => c.charCodeAt(0) & 31),
  ]
}

/** Decode AND verify the erd Bech32 checksum, not merely an erd1 regex. */
export function decodeErdAddress(address) {
  if (typeof address !== 'string' ||
      !/^erd1[a-z0-9]{58}$/.test(address)) {
    throw new TypeError('invalid_bech32_address')
  }
  const data = []
  for (const ch of address.slice(4)) {
    const value = BECH32_CHARS.indexOf(ch)
    if (value < 0) throw new TypeError('invalid_bech32_character')
    data.push(value)
  }
  if (bech32Polymod([...expandHrp('erd'), ...data]) !== 1) {
    throw new TypeError('invalid_bech32_checksum')
  }
  const values = data.slice(0, -6)
  let acc = 0, bits = 0
  const out = []
  for (const value of values) {
    acc = ((acc << 5) | value) & 0x7fffffff
    bits += 5
    while (bits >= 8) {
      bits -= 8
      out.push((acc >>> bits) & 0xff)
    }
  }
  if (bits >= 5 || ((acc << (8 - bits)) & 0xff) !== 0 || out.length !== 32) {
    throw new TypeError('invalid_bech32_padding')
  }
  return Buffer.from(out)
}

function addressBytes(value, field) {
  if (typeof value === 'string') return decodeErdAddress(value)
  if (!(value instanceof Uint8Array) || value.length !== 32) {
    throw new TypeError(field + '_must_be_32_bytes_or_bech32')
  }
  return Buffer.from(value)
}

export function orderHashV1(orderId) {
  if (typeof orderId !== 'string' || !VALID_ORDER_ID.test(orderId)) {
    throw new TypeError('invalid_order_id')
  }
  return createHash('sha256')
    .update(CLAIM_V1_ORDER_DOMAIN)
    .update(Buffer.from(orderId, 'utf8'))
    .digest()
}

/**
 * Binary layout (all unsigned integers big-endian):
 * domain[17] | chain_id_len[1] | chain_id_ascii[1] | sc[32] |
 * signer_epoch[4] | order_hash[32] | pack_type[1] | buyer[32] |
 * eur_amount_cents[8] | not_before[8] | expires_at[8] |
 * catalog_version[2] = exactly 146 bytes for the allowed V1 chain IDs.
 */
export function encodeClaimVoucherV1(input) {
  if (!input || typeof input !== 'object') throw new TypeError('voucher_required')
  const chain = String(input.chain_id ?? '')
  if (!['1', 'T', 'D'].includes(chain)) throw new TypeError('invalid_chain_id')
  const epoch = requireUnsigned(input.signer_epoch, 32, 'signer_epoch')
  if (epoch === 0n) throw new TypeError('unconfigured_signer_epoch')
  const packType = input.pack_type
  if (!Number.isInteger(packType) || !Object.hasOwn(PRICE_BY_TYPE, packType)) {
    throw new TypeError('invalid_pack_type')
  }
  if (input.amount_cents !== PRICE_BY_TYPE[packType]) {
    throw new TypeError('catalogue_amount_mismatch')
  }
  const start = requireUnsigned(input.not_before, 64, 'not_before')
  const expiry = requireUnsigned(input.expires_at, 64, 'expires_at')
  if (start === 0n || expiry <= start ||
      expiry - start > CLAIM_V1_MAX_TTL_SECONDS || expiry > MAX_U64) {
    throw new RangeError('invalid_claim_window')
  }
  if (input.catalog_version !== 1) throw new TypeError('unsupported_catalog_version')
  const encoded = Buffer.concat([
    CLAIM_V1_DOMAIN,
    Buffer.from([1, chain.charCodeAt(0)]),
    addressBytes(input.sc_address, 'sc_address'),
    bigEndian(epoch, 4, 'signer_epoch'),
    orderHashV1(input.order_id),
    Buffer.from([packType]),
    addressBytes(input.buyer, 'buyer'),
    bigEndian(input.amount_cents, 8, 'amount_cents'),
    bigEndian(start, 8, 'not_before'),
    bigEndian(expiry, 8, 'expires_at'),
    bigEndian(input.catalog_version, 2, 'catalog_version'),
  ])
  if (encoded.length !== 146) throw new Error('unexpected_voucher_length')
  return encoded
}

/**
 * Cryptographic verification for test vectors and future SC parity testing.
 * A valid signature alone NEVER establishes a PayBox payment, delivery, or
 * entitlement. It does not check chain state, signer epoch, refund, or replay.
 */
export function verifyClaimVoucherSignatureOfflineV1(input, signature, publicKey) {
  if (!(signature instanceof Uint8Array) || signature.length !== 64 ||
      !(publicKey instanceof Uint8Array) || publicKey.length !== 32) {
    return false
  }
  try {
    const key = createPublicKey({
      key: Buffer.concat([SPKI_ED25519_PREFIX, Buffer.from(publicKey)]),
      format: 'der',
      type: 'spki',
    })
    return edVerify(null, encodeClaimVoucherV1(input), key, Buffer.from(signature))
  } catch {
    return false
  }
}
