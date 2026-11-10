import test from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { inspectStripeBillingSandboxEvent as inspect } from '../src/stripeBillingCandidate.mjs'

const now = Date.parse('2026-11-10T12:00:00Z')
const secret = 'whsec_subscription_fixture'
const binding = {
  customer_id: 'cus_customerfixture',
  subscription_id: 'sub_subscriptionfixture',
  price_id: 'price_recurringfixture',
  currency: 'eur',
  plan: 'tca_monthly',
}
const invoice = {
  object: 'invoice', livemode: false, id: 'in_fixturebill',
  customer: binding.customer_id, subscription: binding.subscription_id,
  currency: 'eur', status: 'paid', paid: true,
  amount_paid: 2900, billing_reason: 'subscription_cycle',
  lines: { data: [{ price: { id: binding.price_id } }], has_more: false },
}
const subscription = {
  object: 'subscription', livemode: false, id: binding.subscription_id,
  customer: binding.customer_id, status: 'active',
}
function signed(type = 'invoice.paid', obj = invoice, fields = {}, timestamp = now / 1000) {
  const event = { id: 'evt_subscriptionfixture', object: 'event', livemode: false,
    type, data: { object: obj }, ...fields }
  const raw = Buffer.from(JSON.stringify(event))
  const digest = createHmac('sha256', secret).update(String(timestamp) + '.').update(raw).digest('hex')
  return { raw, signature: 't=' + timestamp + ',v1=' + digest, webhookSecret: secret, binding, now }
}
function held(x, reason) {
  assert.equal(x.candidate_verified, false)
  assert.equal(x.reason, reason)
  assert.equal(x.grant_access, false)
  assert.equal(x.mint_allowed, false)
  assert.equal(x.checkout_enabled, false)
  assert.equal(x.nft_owned, false)
}
function noRights(x) {
  assert.equal(x.grant_access, false)
  assert.equal(x.delivery_verified, false)
  assert.equal(x.nft_owned, false)
  assert.equal(x.checkout_enabled, false)
  assert.equal(x.mint_allowed, false)
  assert.equal(x.operator_review_required, true)
}
test('signed paid test invoice becomes a REVIEW candidate, never a paid entitlement', () => {
  const x = inspect(signed())
  assert.equal(x.candidate_verified, true)
  assert.equal(x.kind, 'paid_invoice_reconcile')
  assert.equal(x.event_id, 'evt_subscriptionfixture')
  assert.equal(x.stripe_subscription_id, binding.subscription_id)
  noRights(x)
})
test('subscription active status alone cannot activate access or mint', () => {
  const x = inspect(signed('customer.subscription.updated', subscription))
  assert.equal(x.candidate_verified, true)
  assert.equal(x.kind, 'subscription_status_reconcile')
  noRights(x)
})
test('cancellation and failed invoices are review candidates, never direct delivery', () => {
  const canceled = inspect(signed('customer.subscription.deleted', { ...subscription, status: 'canceled' }))
  assert.equal(canceled.kind, 'subscription_status_reconcile')
  noRights(canceled)
  const failed = inspect(signed('invoice.payment_failed', { ...invoice,
    paid: false, status: 'open', amount_paid: 0 }))
  assert.equal(failed.kind, 'failed_invoice_reconcile')
  noRights(failed)
})
test('wrong signature, stale event, live event and Stripe Connect are denied', () => {
  const s = signed()
  held(inspect({ ...s, raw: Buffer.concat([s.raw, Buffer.from(' ')]) }), 'stripe_webhook_not_verified')
  held(inspect({ ...s, signature: 't=' + now / 1000 + ',v1=' + '0'.repeat(64) }), 'stripe_webhook_not_verified')
  held(inspect(signed('invoice.paid', invoice, {}, now / 1000 - 3600)), 'stripe_webhook_not_verified')
  held(inspect(signed('invoice.paid', invoice, { livemode: true })), 'stripe_webhook_not_verified')
  held(inspect(signed('invoice.paid', invoice, { account: 'acct_connected' })), 'stripe_webhook_not_verified')
  held(inspect(signed('invoice.paid', { ...invoice, livemode: true })), 'stripe_customer_mismatch')
})
test('trusted customer, subscription, recurring price and EUR must all match', () => {
  for (const wrong of [
    { customer: 'cus_othercustomer' },
    { subscription: 'sub_othersubscription' },
    { currency: 'usd' },
    { lines: { data: [{ price: { id: 'price_otherprice' } }] } },
    { lines: { data: [{ price: { id: binding.price_id } }, { price: { id: binding.price_id } }] } },
    { lines: { data: [{ price: { id: binding.price_id } }], has_more: true } },
    { lines: { data: [{ price: { id: binding.price_id },
      pricing: { price_details: { price: 'price_unapproved' } } }] } },
    { parent: { subscription_details: { subscription: 'sub_otherparent' } } },
  ]) {
    const x = inspect(signed('invoice.paid', { ...invoice, ...wrong }))
    assert.equal(x.candidate_verified, false, JSON.stringify(wrong))
    noRights(x)
  }
})
test('nonpaid, zero amount, unknown billing reason and Stripe customer-only events cannot certify', () => {
  for (const wrong of [
    { status: 'open' }, { paid: false }, { amount_paid: 0 },
    { amount_paid: '2900' }, { billing_reason: 'manual' },
  ]) held(inspect(signed('invoice.paid', { ...invoice, ...wrong })),
    'invoice_not_paid_or_trial_unapproved')
  held(inspect(signed('checkout.session.completed', invoice)), 'unsupported_stripe_billing_event')
  held(inspect(signed('charge.refunded', invoice)), 'unsupported_stripe_billing_event')
  held(inspect(signed('invoice.paid', { ...invoice, customer: 'cus_othercustomer' })), 'stripe_customer_mismatch')
})
test('untrusted or absent server binding cannot authorize even authentic Stripe events', () => {
  const s = signed()
  for (const b of [
    undefined, {}, { ...binding, currency: 'usd' },
    { ...binding, price_id: 'price_live?' },
    { ...binding, plan: 'nft_pulse' },
    { ...binding, customer_id: 'cus_bad?' },
  ]) held(inspect({ ...s, binding: b }), 'trusted_service_binding_missing')
})
test('invoice modern subscription and line price shapes are supported without broadening trust', () => {
  const modern = { ...invoice, subscription: undefined,
    parent: { subscription_details: { subscription: binding.subscription_id } },
    lines: { data: [{ pricing: { price_details: { price: binding.price_id } } }] } }
  const x = inspect(signed('invoice.paid', modern))
  assert.equal(x.kind, 'paid_invoice_reconcile')
  noRights(x)
})
test('a mismatched subscription id and unsupported status never trigger a change', () => {
  for (const item of [
    { ...subscription, id: 'sub_wrongsubscription' },
    { ...subscription, status: 'secret_admin' },
    { ...subscription, customer: 'cus_othercustomer' },
  ]) {
    const x = inspect(signed('customer.subscription.updated', item))
    assert.equal(x.candidate_verified, false)
    noRights(x)
  }
  held(inspect(signed('customer.subscription.deleted', subscription)), 'subscription_deletion_not_confirmed')
})
