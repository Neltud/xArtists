/**
 * Node-side: vouchers for different MultiversX chain ids must not share preimage.
 * Does not prove on-chain runtime identity (#328 residual).
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, sign } from 'node:crypto'
import { encodeClaimVoucherV1, verifyClaimVoucherSignatureOfflineV1 } from '../src/claimVoucherCodec.mjs'

const sc = new Uint8Array(32).fill(0x11)
const buyer = new Uint8Array(32).fill(0x22)
const base = {
  sc_address: sc,
  signer_epoch: 1,
  order_id: 'xa_chain_sep_1',
  pack_type: 3,
  buyer,
  amount_cents: 5000,
  not_before: 1_730_000_000n,
  expires_at: 1_730_000_600n,
  catalog_version: 1,
}

test('testnet T and mainnet 1 produce different voucher bytes', () => {
  const t = encodeClaimVoucherV1({ ...base, chain_id: 'T' })
  const m = encodeClaimVoucherV1({ ...base, chain_id: '1' })
  assert.equal(t.length, 146)
  assert.equal(m.length, 146)
  assert.notEqual(t.toString('hex'), m.toString('hex'))
})

test('devnet D differs from T and 1', () => {
  const t = encodeClaimVoucherV1({ ...base, chain_id: 'T' }).toString('hex')
  const d = encodeClaimVoucherV1({ ...base, chain_id: 'D' }).toString('hex')
  const m = encodeClaimVoucherV1({ ...base, chain_id: '1' }).toString('hex')
  assert.notEqual(d, t)
  assert.notEqual(d, m)
})

test('invalid chain id rejected', () => {
  assert.throws(() => encodeClaimVoucherV1({ ...base, chain_id: 'X' }), /chain/)
})

test('signed testnet T voucher cannot verify for mainnet 1 or devnet D inputs', () => {
  // This checks only the OFFLINE Ed25519 voucher domain separation.
  // It cannot demonstrate runtime chain attestation inside the SC.
  const { publicKey, privateKey } = generateKeyPairSync('ed25519')
  const key = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32)
  const testnet = { ...base, chain_id: 'T' }
  const signature = sign(null, encodeClaimVoucherV1(testnet), privateKey)
  assert.equal(verifyClaimVoucherSignatureOfflineV1(testnet, signature, key), true)
  assert.equal(verifyClaimVoucherSignatureOfflineV1({ ...base, chain_id: '1' }, signature, key), false)
  assert.equal(verifyClaimVoucherSignatureOfflineV1({ ...base, chain_id: 'D' }, signature, key), false)
})

test('even valid T voucher does not certify SC execution network', () => {
  const t = encodeClaimVoucherV1({ ...base, chain_id: 'T' })
  // The SC itself hardcodes T and reconstructs these bytes. Deploying an
  // identical SC at an identical address on another chain remains a risk.
  assert.equal(t[18], 'T'.charCodeAt(0))
  assert.equal(t.length, 146)
})
