/**
 * Offline V2 deployment-instance separation only. Same address and same key
 * on two networks: a changed VM-captured deploy tx hash must reject replay.
 * No mock can establish real-world VM tx hash semantics (#328 hard blocker).
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, sign, verify as edVerify } from 'node:crypto'
import { encodeClaimVoucherV1 } from '../src/claimVoucherCodec.mjs'
import {
  CLAIM_V2_DOMAIN, CLAIM_V2_SIZE, encodeClaimVoucherV2,
  verifyClaimVoucherSignatureOfflineV2,
} from '../src/claimVoucherCodecV2.mjs'

const base = Object.freeze({
  chain_id: 'T',
  deployment_tx_hash: '11'.repeat(32),
  sc_address: new Uint8Array(32).fill(0x33),
  signer_epoch: 1,
  order_id: 'v2_offline_test_1',
  pack_type: 3,
  buyer: new Uint8Array(32).fill(0x44),
  amount_cents: 5000,
  not_before: 1_793_707_200n,
  expires_at: 1_793_707_800n,
  catalog_version: 1,
})

test('V2 has exact byte layout and does not reuse V1 domain', () => {
  const b = encodeClaimVoucherV2(base)
  assert.equal(CLAIM_V2_DOMAIN.byteLength, 17)
  assert.equal(b.byteLength, CLAIM_V2_SIZE)
  assert.equal(b.subarray(0, 17).toString(), 'XA-CLAIM-PACK-V2\\0'.replace('\\0', '\0'))
  assert.deepEqual([...b.subarray(17, 19)], [1, 'T'.charCodeAt(0)])
  assert.equal(b.subarray(19, 51).toString('hex'), base.deployment_tx_hash)
  assert.deepEqual(b.subarray(51), encodeClaimVoucherV1(base).subarray(19))
})

test('same SC address, signer, order and buyer but different deployment domains reject replay', () => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519')
  const key = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32)
  const onTestnet = { ...base, deployment_tx_hash: '11'.repeat(32) }
  const onMainnet = { ...base, deployment_tx_hash: '22'.repeat(32) }
  const signature = sign(null, encodeClaimVoucherV2(onTestnet), privateKey)
  assert.equal(verifyClaimVoucherSignatureOfflineV2(onTestnet, signature, key), true)
  assert.equal(verifyClaimVoucherSignatureOfflineV2(onMainnet, signature, key), false)
  assert.notDeepEqual(encodeClaimVoucherV2(onTestnet), encodeClaimVoucherV2(onMainnet))
})

test('changing order/buyer/epoch/amount/TTL never permits a V2 replay', () => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519')
  const key = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32)
  const sig = sign(null, encodeClaimVoucherV2(base), privateKey)
  const mutated = [
    { order_id: 'v2_offline_test_2' },
    { buyer: new Uint8Array(32).fill(0x45) },
    { signer_epoch: 2 },
    { expires_at: base.expires_at - 1n },
  ]
  for (const mod of mutated) {
    assert.equal(verifyClaimVoucherSignatureOfflineV2({ ...base, ...mod }, sig, key), false)
  }
  assert.equal(verifyClaimVoucherSignatureOfflineV2({ ...base, amount_cents: 4999 }, sig, key), false)
})

test('V1 signature cannot be accepted for V2 (no downgrade)', () => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519')
  const key = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32)
  const v1signature = sign(null, encodeClaimVoucherV1(base), privateKey)
  assert.equal(verifyClaimVoucherSignatureOfflineV2(base, v1signature, key), false)
  const v2signature = sign(null, encodeClaimVoucherV2(base), privateKey)
  assert.equal(edVerify(null, encodeClaimVoucherV1(base), publicKey, v2signature), false)
})

test('rejects unknown/unbound chain intent, missing or invalid deployment hash', () => {
  for (const id of ['1', 'D', 'X', undefined, null]) {
    assert.throws(() => encodeClaimVoucherV2({ ...base, chain_id: id }), /testnet_chain_intent/)
  }
  for (const hash of [undefined, '', 'AA'.repeat(32), 'gg'.repeat(32),
    '11'.repeat(31), '00'.repeat(32), new Uint8Array(31), new Uint8Array(32)]) {
    assert.throws(() => encodeClaimVoucherV2({ ...base, deployment_tx_hash: hash }), /deployment_tx_hash/)
  }
})

test('byte array deployment hash is snapshotted and caller mutation does not affect encoded voucher', () => {
  const hash = new Uint8Array(32).fill(0x77)
  const a = encodeClaimVoucherV2({ ...base, deployment_tx_hash: hash })
  hash.fill(0x99)
  assert.equal(a.subarray(19, 51).toString('hex'), '77'.repeat(32))
})

test('negative control: identical VM deploy hash still permits byte-for-byte replay', () => {
  // This deliberately exposes the honest-VM assumption; it is NOT a positive
  // cross-network security claim or a substitute for chain-ID attestation.
  const testnet = encodeClaimVoucherV2(base)
  const copiedToOtherNetwork = encodeClaimVoucherV2({ ...base })
  assert.deepEqual(testnet, copiedToOtherNetwork)
})

test('offline verifier fails closed on malformed keys or signatures', () => {
  assert.equal(verifyClaimVoucherSignatureOfflineV2(base, new Uint8Array(64), new Uint8Array(31)), false)
  assert.equal(verifyClaimVoucherSignatureOfflineV2(base, new Uint8Array(63), new Uint8Array(32)), false)
  assert.equal(verifyClaimVoucherSignatureOfflineV2({ ...base, deployment_tx_hash: '00'.repeat(32) }, new Uint8Array(64), new Uint8Array(32)), false)
})
