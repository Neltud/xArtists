import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash, generateKeyPairSync, sign } from 'node:crypto'
import {
  CLAIM_V1_DOMAIN, CLAIM_V1_ORDER_DOMAIN, CLAIM_V1_MAX_TTL_SECONDS,
  decodeErdAddress, orderHashV1, encodeClaimVoucherV1,
  verifyClaimVoucherSignatureOfflineV1,
} from '../src/claimVoucherCodec.mjs'

const TEST_VECTOR = Object.freeze({
  chain_id: 'T',
  sc_address: Buffer.alloc(32, 0x11),
  signer_epoch: 7,
  order_id: 'xa_test_001',
  pack_type: 1,
  buyer: Buffer.alloc(32, 0x22),
  amount_cents: 11000,
  not_before: 1793707200, // 2026-11-03T12:00:00Z
  expires_at: 1793707800, // 10-minute short-lived voucher
  catalog_version: 1,
})
const ORDER_HASH_HEX = 'e6bc635174d7e7662636b2d416874a7395948ff38dac0bb0bb426add2b84be8c'
const PAYLOAD_SHA256_HEX = 'd0db4848cb62c46a4ff7fbfde9306f705b9373a17add313aad6aa6a272b62a4c'
const EXPECTED_BYTES = [
  '58412d434c41494d2d5041434b2d563100', // 17-byte domain including NUL
  '0154', // one-byte chain id length + ASCII T
  '11'.repeat(32), // SC raw 32-byte address
  '00000007', // signer epoch
  ORDER_HASH_HEX, // SHA256(order domain + utf8 order ID)
  '01', // Pulse pack type
  '22'.repeat(32), // buyer raw 32-byte address
  '0000000000002af8', // 11000 cents EUR
  '000000006ae9ccc0', // 2026-11-03T12:00:00Z
  '000000006ae9cf18', // expires at 12:10 UTC
  '0001', // Rule1 catalogue version
].join('')

test('cross-language golden fixture fixes layout and endian order (146 bytes)', () => {
  assert.equal(CLAIM_V1_DOMAIN.length, 17)
  assert.equal(CLAIM_V1_ORDER_DOMAIN.length, 18)
  assert.equal(CLAIM_V1_MAX_TTL_SECONDS, 900n)
  assert.equal(orderHashV1(TEST_VECTOR.order_id).toString('hex'), ORDER_HASH_HEX)
  const encoded = encodeClaimVoucherV1(TEST_VECTOR)
  assert.equal(encoded.length, 146)
  assert.equal(encoded.toString('hex'), EXPECTED_BYTES)
  assert.equal(createHash('sha256').update(encoded).digest('hex'), PAYLOAD_SHA256_HEX)
})

test('official sample erd1 address is checksum verified, not regex-trusted', () => {
  const sample = 'erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6tq'
  // Use the documented (correct) address as the authoritative vector.
  const official = 'erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th'
  const decoded = decodeErdAddress(official)
  assert.equal(decoded.length, 32)
  assert.throws(() => decodeErdAddress(sample), /checksum/)
  assert.throws(() => decodeErdAddress(official.toUpperCase()), /bech32/)
  assert.throws(() => decodeErdAddress(official.slice(0, -1) + 'q'), /checksum/)
  assert.throws(() => decodeErdAddress('erd1' + 'q'.repeat(58)), /checksum/)
  const v = { ...TEST_VECTOR, buyer: official }
  assert.deepEqual(encodeClaimVoucherV1(v).subarray(88, 120), decoded)
})

test('cryptographic Ed25519 offline verification, domain-separated and fail-closed', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519')
  const rawPublic = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32)
  const payload = encodeClaimVoucherV1(TEST_VECTOR)
  const signature = sign(null, payload, privateKey) // local test key ONLY
  assert.equal(signature.length, 64)
  assert.equal(verifyClaimVoucherSignatureOfflineV1(TEST_VECTOR, signature, rawPublic), true)
  for (const [field, value] of [
    ['chain_id', '1'], // testnet signature cannot be replayed on mainnet
    ['sc_address', Buffer.alloc(32, 0x12)],
    ['signer_epoch', 8],
    ['order_id', 'xa_test_002'],
    ['pack_type', 2],
    ['buyer', Buffer.alloc(32, 0x23)],
    ['not_before', TEST_VECTOR.not_before + 1],
    ['expires_at', TEST_VECTOR.expires_at - 1],
  ]) {
    const next = { ...TEST_VECTOR, [field]: value }
    if (field === 'pack_type') next.amount_cents = 7500
    assert.equal(verifyClaimVoucherSignatureOfflineV1(next, signature, rawPublic), false, field)
  }
  const corrupted = Buffer.from(signature)
  corrupted[13] ^= 0xff
  assert.equal(verifyClaimVoucherSignatureOfflineV1(TEST_VECTOR, corrupted, rawPublic), false)
  assert.equal(verifyClaimVoucherSignatureOfflineV1(TEST_VECTOR, signature.subarray(1), rawPublic), false)
  assert.equal(verifyClaimVoucherSignatureOfflineV1(TEST_VECTOR, signature, Buffer.alloc(32)), false)
})

test('rejects wrong chain IDs, bogus pack prices and versions', () => {
  for (const value of ['E', '', '1\0', 'TT', 'mainnet']) {
    assert.throws(() => encodeClaimVoucherV1({ ...TEST_VECTOR, chain_id: value }), /chain_id/)
  }
  for (const [pack_type, amount_cents] of [[1,100], [2,11000],[3,7500],[4,5000]]) {
    assert.throws(() => encodeClaimVoucherV1({ ...TEST_VECTOR, pack_type, amount_cents }),
      /catalogue_amount_mismatch|invalid_pack_type/)
  }
  assert.throws(() => encodeClaimVoucherV1({ ...TEST_VECTOR, catalog_version: 2 }), /catalog_version/)
  assert.throws(() => encodeClaimVoucherV1({ ...TEST_VECTOR, signer_epoch: 0 }), /signer_epoch/)
})

test('rejects bad times, oversized unsigned values and malformed identifiers', () => {
  assert.throws(() => encodeClaimVoucherV1({ ...TEST_VECTOR, expires_at: TEST_VECTOR.not_before }), /window/)
  assert.throws(() => encodeClaimVoucherV1({ ...TEST_VECTOR, expires_at: TEST_VECTOR.not_before + 901 }), /window/)
  assert.throws(() => encodeClaimVoucherV1({ ...TEST_VECTOR, not_before: -2 }), /not_before/)
  assert.throws(() => encodeClaimVoucherV1({ ...TEST_VECTOR, not_before: Number.MAX_SAFE_INTEGER + 1 }), /exact_integer/)
  assert.throws(() => encodeClaimVoucherV1({ ...TEST_VECTOR, signer_epoch: 4294967296 }), /signer_epoch/)
  assert.throws(() => encodeClaimVoucherV1({ ...TEST_VECTOR, buyer: 'erd1' + 'q'.repeat(58) }), /checksum/)
  assert.throws(() => encodeClaimVoucherV1({ ...TEST_VECTOR, sc_address: Buffer.alloc(31) }), /32_bytes/)
  assert.throws(() => orderHashV1('id with spaces'), /invalid_order_id/)
  assert.throws(() => orderHashV1('é'), /invalid_order_id/)
})
