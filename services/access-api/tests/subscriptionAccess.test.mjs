import { test } from 'node:test'
import assert from 'node:assert/strict'
import { projectSubscriptionAccess } from '../src/subscriptionAccess.mjs'

const now = Date.parse('2026-11-09T12:00:00Z')
const paid = {
  status: 'active', providerVerified: true,
  periodEnd: '2026-12-09T12:00:00Z', now,
}
function denied(input) {
  const result = projectSubscriptionAccess(input)
  assert.equal(result.has_access, false)
  assert.equal(result.entitlement_source, null)
  assert.equal(result.nft_owned, false)
  assert.equal(result.mint_allowed, false)
}

test('active provider-verified subscription grants service access but never NFT', () => {
  const result = projectSubscriptionAccess(paid)
  assert.equal(result.has_access, true)
  assert.equal(result.entitlement_source, 'verified_subscription')
  assert.equal(result.nft_owned, false)
  assert.equal(result.mint_allowed, false)
})
test('client-claimed subscription without provider proof is rejected', () => {
  denied({ ...paid, providerVerified: false })
  denied({ ...paid, providerVerified: 'true' })
  denied({ ...paid, providerVerified: 1 })
})
test('expired, invalid and missing periods are denied', () => {
  for (const periodEnd of [undefined, '', 'invalid', '2026-11-09T12:00:00Z', '2026-11-08T12:00:00Z']) {
    denied({ ...paid, periodEnd })
  }
})
test('nonexistent calendar days are rejected rather than normalized by Date.parse', () => {
  for (const periodEnd of [
    '2026-02-30T12:00:00Z',
    '2026-02-29T12:00:00Z',
    '2027-04-31T12:00:00Z',
    '2026-12-32T12:00:00Z',
    '2026-00-01T12:00:00Z',
    '2026-13-01T12:00:00Z',
  ]) {
    denied({ ...paid, periodEnd })
  }
  assert.equal(projectSubscriptionAccess({
    ...paid, periodEnd: '2028-02-29T12:00:00Z',
  }).has_access, true)
})
test('period end requires explicit canonical UTC seconds with bounded milliseconds', () => {
  for (const periodEnd of [
    1800000000000,
    new Date('2026-12-09T12:00:00Z'),
    '2026-12-09', '2026-12-09T12:00:00',
    '2026-12-09T12:00:00+00:00',
    '2026-12-09T12:00:00.1234Z',
    '2026-12-09T24:00:00Z',
    '2026-12-09T12:60:00Z',
    '2026-12-09T12:00:60Z',
  ]) {
    denied({ ...paid, periodEnd })
  }
  for (const periodEnd of ['2026-12-09T12:00:00.1Z', '2026-12-09T12:00:00.123Z']) {
    assert.equal(projectSubscriptionAccess({ ...paid, periodEnd }).has_access, true)
  }
})
test('refund, past due, unpaid and incomplete subscriptions are denied', () => {
  for (const refunded of [true, 'true', 'false', 0, null]) denied({ ...paid, refunded })
  for (const status of ['past_due', 'unpaid', 'incomplete', 'unknown', null]) {
    denied({ ...paid, status })
  }
})
test('canceled subscription retains paid-through access only with verified actual cancellation', () => {
  denied({ ...paid, status: 'canceled' })
  assert.equal(projectSubscriptionAccess({
    ...paid, status: 'canceled', canceledAt: '2026-11-08T12:00:00Z',
  }).has_access, true)
  for (const canceledAt of [
    'invalid', '2026-11-31T12:00:00Z',
    '2026-11-10T12:00:00Z',
    '2027-01-01T12:00:00Z',
    '2026-11-08T12:00:00+00:00',
  ]) denied({ ...paid, status: 'canceled', canceledAt })
})
test('future or malformed cancellation evidence never grants an active subscription', () => {
  for (const canceledAt of ['2026-11-10T12:00:00Z', '2026-02-30T12:00:00Z', 0]) {
    denied({ ...paid, status: 'active', canceledAt })
  }
  denied({ ...paid, status: 'trialing', canceledAt: '2026-11-08T12:00:00Z' })
})
test('invalid clocks and millisecond-expired periods are denied', () => {
  for (const clock of [NaN, Infinity, '2026-11-09T12:00:00Z', new Date(now)]) {
    denied({ ...paid, now: clock })
  }
  denied({
    ...paid, now: Date.parse('2026-12-09T12:00:00.123Z'),
    periodEnd: '2026-12-09T12:00:00.123Z',
  })
})
