import test from 'node:test'
import assert from 'node:assert/strict'
import { composeClaimGate } from '../src/claimComposeGate.mjs'

const buyer = 'erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th'
const valid = () => ({
  order_id: 'xa_compose_1',
  provider_tx_id: 'PBX.compose:1',
  buyer_address: buyer,
  pack_id: 'sentinel',
  amount_cents: 5000,
  currency: 'EUR',
  status: 'paid',
  server_confirmed: true,
  payment_verified: true,
  delivery: 'pending',
  delivery_verified: false,
  delivered_at: null,
  chain_tx_hash: null,
  nft_identifier: null,
})

test('compose ok yields order_hash and ttl without signing', () => {
  const order = valid()
  const out = composeClaimGate({ order, ordersSnapshot: [order] })
  assert.equal(out.ok, true)
  assert.equal(out.signed, false)
  assert.equal(out.order_hash_hex.length, 64)
  assert.ok(out.expires_at > out.not_before)
})

test('compose fails eligibility on refund', () => {
  const order = { ...valid(), status: 'refunded' }
  const out = composeClaimGate({ order, ordersSnapshot: [order] })
  assert.equal(out.ok, false)
  assert.equal(out.stage, 'eligibility')
})

test('compose fails issuance when chargeback flag set after paid shape', () => {
  // eligibility requires status paid — chargeback flag still caught by issuance if status stays paid
  const order = { ...valid(), chargeback: true }
  const out = composeClaimGate({ order, ordersSnapshot: [order] })
  assert.equal(out.ok, false)
  assert.equal(out.stage, 'issuance_gate')
  assert.equal(out.revoke_on_chain, true)
})
