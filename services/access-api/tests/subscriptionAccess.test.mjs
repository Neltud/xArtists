import { test } from 'node:test'
import assert from 'node:assert/strict'
import { projectSubscriptionAccess } from '../src/subscriptionAccess.mjs'

const now = Date.parse('2026-11-09T12:00:00Z')
const paid = {
  status: 'active', providerVerified: true,
  periodEnd: '2026-12-09T12:00:00Z', now,
}
test('active provider-verified subscription grants service access but never NFT', () => {
  const result = projectSubscriptionAccess(paid)
  assert.equal(result.has_access, true)
  assert.equal(result.entitlement_source, 'verified_subscription')
  assert.equal(result.nft_owned, false)
  assert.equal(result.mint_allowed, false)
})
test('client-claimed subscription without provider proof is rejected', () => {
  assert.equal(projectSubscriptionAccess({ ...paid, providerVerified: false }).has_access, false)
  assert.equal(projectSubscriptionAccess({ ...paid, providerVerified: 'true' }).has_access, false)
})
test('expired, invalid and missing periods are denied', () => {
  for (const periodEnd of [undefined, '', 'invalid', '2026-11-09T12:00:00Z', '2026-11-08T12:00:00Z']) {
    assert.equal(projectSubscriptionAccess({ ...paid, periodEnd }).has_access, false)
  }
})
test('refund, past due, unpaid and incomplete subscriptions are denied', () => {
  assert.equal(projectSubscriptionAccess({ ...paid, refunded: true }).has_access, false)
  for (const status of ['past_due', 'unpaid', 'incomplete', 'unknown']) {
    assert.equal(projectSubscriptionAccess({ ...paid, status }).has_access, false)
  }
})
test('canceled subscription retains paid-through access only with cancellation evidence', () => {
  assert.equal(projectSubscriptionAccess({ ...paid, status: 'canceled' }).has_access, false)
  assert.equal(projectSubscriptionAccess({
    ...paid, status: 'canceled', canceledAt: '2026-11-08T12:00:00Z',
  }).has_access, true)
  assert.equal(projectSubscriptionAccess({
    ...paid, status: 'canceled', canceledAt: 'invalid',
  }).has_access, false)
})
