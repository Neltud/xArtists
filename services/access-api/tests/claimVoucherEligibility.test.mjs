import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assessPaidClaimCandidate } from '../src/claimVoucherEligibility.mjs'

const buyer = 'erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th'
const valid = () => ({
  order_id: 'xa_test_001', provider_tx_id: 'PBX.20261103:123',
  buyer_address: buyer, pack_id: 'pulse', amount_cents: 11000,
  currency: 'EUR', status: 'paid', server_confirmed: true,
  payment_verified: true, delivery: 'pending', delivery_verified: false,
  delivered_at: null, chain_tx_hash: null, nft_identifier: null,
})
const check = (order, snapshot = [order]) =>
  assessPaidClaimCandidate({ order, ordersSnapshot: snapshot })

test('S1 verified order is only a candidate, never delivered/claimed', () => {
  const result = check(valid())
  assert.equal(result.candidate_eligible, true)
  assert.match(result.reason, /candidate_only/)
  assert.equal(Object.hasOwn(result, 'delivery_verified'), false)
})
for (const [name, field, value] of [
  ['unconfirmed IPN', 'server_confirmed', false],
  ['missing PSP verification', 'payment_verified', false],
  ['redirect only', 'status', 'redirected'],
  ['refunded', 'status', 'refunded'],
  ['wrong fiat price', 'amount_cents', 10999],
  ['wrong currency', 'currency', 'USD'],
  ['wrong buyer format', 'buyer_address', 'guest:abc'],
  ['wrong buyer checksum', 'buyer_address', 'erd1' + 'q'.repeat(58)],
  ['no PSP transaction', 'provider_tx_id', null],
  ['already verified delivery', 'delivery_verified', true],
  ['delivery marked confirmed', 'delivery', 'confirmed'],
  ['receipt already present', 'chain_tx_hash', 'a'.repeat(64)],
  ['previous NFT identifier', 'nft_identifier', 'XAIPLS-2cf72b-01'],
  ['previous delivered timestamp', 'delivered_at', '2026-11-03T11:00:00Z'],
]) {
  test('reject ' + name, () => {
    const order = { ...valid(), [field]: value }
    assert.equal(check(order).candidate_eligible, false)
  })
}
test('reject missing or stale snapshot', () => {
  const order = valid()
  assert.equal(assessPaidClaimCandidate({ order }).candidate_eligible, false)
  assert.equal(check(order, []).candidate_eligible, false)
  assert.equal(check(order, [{ ...order, server_confirmed: false }]).candidate_eligible, false)
})
test('reject provider transaction collision across orders', () => {
  const order = valid()
  assert.equal(check(order, [order, { ...order, order_id: 'other' }]).candidate_eligible, false)
})
test('reject repeated order id in a purported snapshot', () => {
  const order = valid()
  assert.equal(check(order, [order, order]).candidate_eligible, false)
})
test('support all exact Rule1 EUR catalogue anchors', () => {
  for (const [pack_id, amount_cents] of [['pulse',11000],['yield',7500],['sentinel',5000]]) {
    const order = { ...valid(), pack_id, amount_cents }
    assert.equal(check(order).candidate_eligible, true)
  }
})
