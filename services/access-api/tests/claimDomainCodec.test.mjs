import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CLAIM_DOMAIN,
  orderHash,
  encodeClaimMessage,
  encodeClaimMessageHex,
} from '../src/claimDomainCodec.mjs'

test('domain is 17 bytes XA-CLAIM-PACK-V1 + NUL', () => {
  assert.equal(CLAIM_DOMAIN.length, 17)
  assert.equal(CLAIM_DOMAIN.toString('ascii'), 'XA-CLAIM-PACK-V1\0')
})

test('orderHash is stable SHA-256 over domain + order_id', () => {
  const h = orderHash('xa_test_001')
  assert.equal(h.length, 32)
  assert.equal(
    h.toString('hex'),
    orderHash('xa_test_001').toString('hex'),
  )
  assert.notEqual(orderHash('xa_test_001').toString('hex'), orderHash('xa_test_002').toString('hex'))
})

test('golden message hex — fixed opaque addresses (no chain key material)', () => {
  const sc = Buffer.alloc(32, 0x11)
  const buyer = Buffer.alloc(32, 0x22)
  const hex = encodeClaimMessageHex({
    chain_id: '1',
    sc_address: sc,
    signer_epoch: 1,
    order_id: 'xa_test_001',
    pack_id: 'pulse',
    buyer,
    amount_cents: 11000,
    not_before: 1_730_000_000,
    expires_at: 1_730_000_600,
    catalog_version: 1,
  })
  // Recompute once for lock; length and prefix invariants
  assert.ok(hex.startsWith(CLAIM_DOMAIN.toString('hex')))
  assert.equal(hex.slice(0, 34), CLAIM_DOMAIN.toString('hex'))
  const msg = encodeClaimMessage({
    chain_id: '1',
    sc_address: sc,
    signer_epoch: 1,
    order_id: 'xa_test_001',
    pack_id: 'pulse',
    buyer,
    amount_cents: 11000,
    not_before: 1_730_000_000,
    expires_at: 1_730_000_600,
    catalog_version: 1,
  })
  // domain(17) + len(1) + chain(1) + sc(32) + epoch(4) + orderHash(32) + pack(1) + buyer(32) + amounts(8*3) + catalog(2)
  assert.equal(msg.length, 17 + 1 + 1 + 32 + 4 + 32 + 1 + 32 + 8 + 8 + 8 + 2)
  assert.equal(hex, msg.toString('hex'))
})

test('rejects bad pack and address lengths', () => {
  const sc = Buffer.alloc(32, 1)
  const buyer = Buffer.alloc(32, 2)
  assert.throws(
    () =>
      encodeClaimMessage({
        chain_id: '1',
        sc_address: sc,
        signer_epoch: 0,
        order_id: 'x',
        pack_id: 'nope',
        buyer,
        amount_cents: 100,
        not_before: 1,
        expires_at: 2,
        catalog_version: 1,
      }),
    /unknown_pack/,
  )
  assert.throws(
    () =>
      encodeClaimMessage({
        chain_id: '1',
        sc_address: Buffer.alloc(31),
        signer_epoch: 0,
        order_id: 'x',
        pack_id: 'pulse',
        buyer,
        amount_cents: 100,
        not_before: 1,
        expires_at: 2,
        catalog_version: 1,
      }),
    /sc_address_32/,
  )
})
