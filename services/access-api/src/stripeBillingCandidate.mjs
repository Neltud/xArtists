/**
 * Stripe Billing EUR subscription evidence preflight, SANDBOX ONLY.
 *
 * Pure, offline and read-only: no HTTP routes, no Stripe API calls, no
 * PostgreSQL writes, no Checkout session, no wallet signing and no mint.
 * A signed webhook event is only a CANDIDATE for operator reconciliation;
 * the durable ledger and server-side account bindings must be verified
 * independently before any subscription service entitlement is granted.
 *
 * The older one-time Stripe pack sandbox remains separate and never
 * becomes a recurring membership provider by importing this module.
 */
import { verifyStripeEvent } from './stripeCheckout.mjs'

const ID = {
  customer: /^cus_[A-Za-z0-9]{6,128}$/,
  subscription: /^sub_[A-Za-z0-9]{6,128}$/,
  price: /^price_[A-Za-z0-9]{6,128}$/,
}
const NO_GO = Object.freeze({
  grant_access: false,
  nft_owned: false,
  mint_allowed: false,
  checkout_enabled: false,
  delivery_verified: false,
  operator_review_required: true,
})

const hold = reason => ({ ...NO_GO, candidate_verified: false, reason })
const candidate = (kind, eventId, subscriptionId) => ({
  ...NO_GO,
  candidate_verified: true,
  reason: 'verified_test_event_requires_atomic_ledger_reconciliation',
  kind,
  event_id: eventId,
  stripe_subscription_id: subscriptionId,
})

const validBinding = binding =>
  binding && typeof binding === 'object' && !Array.isArray(binding) &&
  ID.customer.test(binding.customer_id ?? '') &&
  ID.subscription.test(binding.subscription_id ?? '') &&
  ID.price.test(binding.price_id ?? '') &&
  (binding.plan === 'tca_monthly' || binding.plan === 'tca_annual') &&
  (binding.currency === 'eur')

function invoiceSubscriptionId(invoice) {
  const direct = invoice.subscription
  const nested = invoice.parent?.subscription_details?.subscription
  if (direct != null && nested != null && direct !== nested) return null
  return direct ?? nested ?? null
}

function invoicePriceId(invoice) {
  const lines = invoice.lines
  // No customer-selected price, ambiguous invoice, addon or partial invoice
  // may certify an entitlement in this limited preflight.
  if (!Array.isArray(lines?.data) || lines.data.length !== 1 ||
      lines.has_more === true) return null
  const line = lines.data[0]
  const legacy = line?.price?.id
  const modern = line?.pricing?.price_details?.price
  if (legacy != null && modern != null && legacy !== modern) return null
  return legacy ?? modern ?? null
}

/**
 * The binding is supplied by a TRUSTED server-side snapshot of the intended
 * xArtists service-plan/customer/price/subscription mapping. It MUST NOT be
 * taken from a request, Stripe metadata alone or a success redirect.
 */
export function inspectStripeBillingSandboxEvent({
  raw, signature, webhookSecret, binding, now = Date.now(),
} = {}) {
  if (!validBinding(binding)) return hold('trusted_service_binding_missing')
  let event
  try { event = verifyStripeEvent(raw, signature, webhookSecret, now) }
  catch { return hold('stripe_webhook_not_verified') }
  const object = event.data.object
  if (!object || object.livemode !== false ||
      object.customer !== binding.customer_id) return hold('stripe_customer_mismatch')

  if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
    if (object.object !== 'invoice' ||
        invoiceSubscriptionId(object) !== binding.subscription_id ||
        object.currency !== 'eur' || invoicePriceId(object) !== binding.price_id) {
      return hold('stripe_invoice_binding_mismatch')
    }
    if (event.type === 'invoice.payment_failed') {
      // Payment failure triggers review/revocation; never grants access.
      return candidate('failed_invoice_reconcile', event.id, binding.subscription_id)
    }
    if (object.status !== 'paid' || object.paid !== true ||
        !Number.isSafeInteger(object.amount_paid) || object.amount_paid <= 0 ||
        !['subscription_create', 'subscription_cycle', 'subscription_update'].includes(object.billing_reason)) {
      return hold('invoice_not_paid_or_trial_unapproved')
    }
    return candidate('paid_invoice_reconcile', event.id, binding.subscription_id)
  }

  if (event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted') {
    if (object.object !== 'subscription' ||
        object.id !== binding.subscription_id ||
        !['active', 'past_due', 'unpaid', 'incomplete', 'trialing',
          'canceled', 'incomplete_expired', 'paused'].includes(object.status)) {
      return hold('subscription_binding_or_status_mismatch')
    }
    if (event.type === 'customer.subscription.deleted' && object.status !== 'canceled') {
      return hold('subscription_deletion_not_confirmed')
    }
    // An 'active' status alone cannot prove a paid invoice.
    return candidate('subscription_status_reconcile', event.id, binding.subscription_id)
  }

  return hold('unsupported_stripe_billing_event')
}
