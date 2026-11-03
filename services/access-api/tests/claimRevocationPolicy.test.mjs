import test from 'node:test'
import assert from 'node:assert/strict'
import {
  assessClaimIssuanceGate,
  clampVoucherTtlSec,
  CLAIM_VOUCHER_TTL_POLICY,
} from '../src/claimRevocationPolicy.mjs'

const paid = () => ({
  status: 'paid',
  server_confirmed: true,
  payment_verified: true,
  delivery: 'pending',
  delivery_verified: false,
})

test('paid verified is issuable candidate', () => {
  const r = assessClaimIssuanceGate(paid())
  assert.equal(r.issuable, true)
  assert.equal(r.revoke_on_chain, false)
})

test('refunded requires on-chain revoke capability', () => {
  const r = assessClaimIssuanceGate({ ...paid(), status: 'refunded' })
  assert.equal(r.issuable, false)
  assert.equal(r.revoke_on_chain, true)
})

test('chargeback flag blocks issuance', () => {
  const r = assessClaimIssuanceGate({ ...paid(), chargeback: true })
  assert.equal(r.issuable, false)
  assert.equal(r.revoke_on_chain, true)
})

test('TTL clamp respects bounds', () => {
  assert.equal(clampVoucherTtlSec(60), CLAIM_VOUCHER_TTL_POLICY.min_ttl_sec)
  assert.equal(clampVoucherTtlSec(999999), CLAIM_VOUCHER_TTL_POLICY.max_ttl_sec)
  assert.equal(clampVoucherTtlSec(1800), 1800)
})

test('GO policy requires on-chain revoke', () => {
  assert.equal(CLAIM_VOUCHER_TTL_POLICY.require_onchain_revoke_before_go, true)
})
