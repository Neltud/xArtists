/** Stripe sandbox adapter. Deliberately cannot accept live keys or mint NFTs. */
import crypto from 'node:crypto'

export const STRIPE_PACKS = Object.freeze({
  pulse: Object.freeze({ name: 'Pulse Pack', cents: 11000 }),
  yield: Object.freeze({ name: 'Yield Pack', cents: 7500 }),
  sentinel: Object.freeze({ name: 'Sentinel Pack', cents: 5000 }),
})
const fail = (message, statusCode = 400) => { throw Object.assign(new Error(message), { statusCode }) }

export function stripeSandboxConfig(env = process.env) {
  const webhookReady = /^sk_test_\S+$/.test(env.STRIPE_SANDBOX_SECRET_KEY || '') &&
    /^whsec_\S+$/.test(env.STRIPE_SANDBOX_WEBHOOK_SECRET || '') && Boolean(env.STRIPE_SANDBOX_DATABASE_URL)
  return { mode: 'test', live_enabled: false, delivery_enabled: false,
    webhook_ready: webhookReady,
    checkout_enabled: webhookReady && env.STRIPE_SANDBOX_CHECKOUT_ENABLED === '1' }
}

// Stripe manual verification protocol: exact bytes, v1 only, rotation signatures,
// constant-time comparison and a bounded clock window. Never log raw events.
export function verifyStripeEvent(raw, signature, secret, now = Date.now()) {
  if (!Buffer.isBuffer(raw) || raw.length > 262144) fail('invalid_webhook_body')
  if (!/^whsec_\S+$/.test(secret || '')) fail('stripe_webhook_unconfigured', 503)
  if (typeof signature !== 'string' || signature.length > 4096) fail('invalid_stripe_signature')
  const fields = signature.split(',').map(x => x.trim().split('='))
  const timestamps = fields.filter(([k]) => k === 't')
  if (timestamps.length !== 1 || !/^\d{1,12}$/.test(timestamps[0][1])) fail('invalid_stripe_signature')
  const timestamp = timestamps[0][1]
  if (Math.abs(now / 1000 - Number(timestamp)) > 300) fail('stale_stripe_signature')
  const expected = crypto.createHmac('sha256', secret).update(timestamp + '.').update(raw).digest()
  const valid = fields.some(([k, v]) => k === 'v1' && /^[a-f0-9]{64}$/.test(v || '') &&
    crypto.timingSafeEqual(expected, Buffer.from(v, 'hex')))
  if (!valid) fail('invalid_stripe_signature')
  let event
  try { event = JSON.parse(raw.toString('utf8')) } catch { fail('invalid_stripe_event') }
  if (!event || !/^evt_[A-Za-z0-9]+$/.test(event.id || '') ||
      event.object !== 'event' || event.livemode !== false || typeof event.type !== 'string' ||
      !event.data?.object || event.account) fail('unsupported_stripe_event')
  return event
}

export function buildStripeSession(order, returnBase) {
  const pack = Object.hasOwn(STRIPE_PACKS, order.pack_id) && STRIPE_PACKS[order.pack_id]
  if (!pack || pack.cents !== order.amount_cents) fail('invalid_pack')
  let url
  try { url = new URL(returnBase) } catch { fail('stripe_return_url_required', 503) }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    fail('stripe_return_url_required', 503)
  }
  const base = url.href.replace(/\/$/, '')
  return new URLSearchParams({
    mode: 'payment', success_url: `${base}/#/my-packs?stripe_order=${order.order_id}`,
    cancel_url: `${base}/#/my-packs?cancelled=1`, client_reference_id: order.order_id,
    'metadata[order_id]': order.order_id, 'metadata[pack_id]': order.pack_id,
    'line_items[0][quantity]': '1', 'line_items[0][price_data][currency]': 'eur',
    'line_items[0][price_data][unit_amount]': String(pack.cents),
    'line_items[0][price_data][product_data][name]': pack.name,
    // Fix EUR totals until reconciliation supports converted currencies.
    'adaptive_pricing[enabled]': 'false',
  })
}

export function validateStripeSession(session, order) {
  if (session?.object !== 'checkout.session' || session.livemode !== false ||
      !/^cs_test_[A-Za-z0-9]+$/.test(session.id || '') || session.mode !== 'payment' ||
      session.client_reference_id !== order.order_id ||
      session.metadata?.order_id !== order.order_id || session.metadata?.pack_id !== order.pack_id ||
      session.currency !== 'eur' || session.amount_total !== order.amount_cents) fail('stripe_session_mismatch')
  if (order.session_id && order.session_id !== session.id) fail('stripe_session_mismatch')
}

export function createStripeSandboxService({ store, env = process.env, fetchImpl = fetch, now = Date.now }) {
  return {
    async checkout({ pack_id, request_id, buyer }) {
      if (!stripeSandboxConfig(env).checkout_enabled) fail('stripe_sandbox_checkout_disabled', 503)
      if (!Object.hasOwn(STRIPE_PACKS, pack_id) || !/^[a-f0-9-]{36}$/.test(request_id || '')) fail('invalid_checkout_request')
      if (!/^erd1[a-z0-9]{58}$/.test(buyer || '')) fail('wallet_auth_required', 401)
      const orderId = 'xs_' + crypto.createHash('sha256').update(buyer + ':' + request_id).digest('hex').slice(0, 40)
      const order = await store.reserve({ order_id: orderId, buyer, pack_id,
        amount_cents: STRIPE_PACKS[pack_id].cents, created_ms: now() })
      if (order.buyer !== buyer || order.pack_id !== pack_id) fail('idempotency_conflict', 409)
      if (order.session_id) return { id: order.session_id, url: order.session_url, mode: 'test' }
      // v1 may prune idempotency keys after 24h. Unknown outcomes require reconciliation.
      if (now() - order.created_ms > 23 * 3600000) fail('stripe_reconciliation_required', 409)
      const body = buildStripeSession(order, env.STRIPE_SANDBOX_RETURN_BASE)
      let response
      try {
        response = await fetchImpl('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST', headers: { Authorization: `Bearer ${env.STRIPE_SANDBOX_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': orderId },
          body, signal: AbortSignal.timeout(10000), redirect: 'error',
        })
      } catch { fail('stripe_outcome_unknown_retry_same_request', 503) }
      if (!response.ok) fail('stripe_session_unavailable', 503)
      const session = await response.json()
      validateStripeSession(session, order)
      let target
      try { target = new URL(session.url) } catch { fail('invalid_stripe_checkout_url', 503) }
      if (target.origin !== 'https://checkout.stripe.com' || target.username || target.password) fail('invalid_stripe_checkout_url', 503)
      await store.attach(orderId, session.id, session.url)
      return { id: session.id, url: session.url, mode: 'test' }
    },
    async webhook(raw, signature) {
      if (!stripeSandboxConfig(env).webhook_ready) fail('stripe_sandbox_webhook_disabled', 503)
      const event = verifyStripeEvent(raw, signature, env.STRIPE_SANDBOX_WEBHOOK_SECRET, now())
      if (event.type === 'charge.refunded') {
        const charge = event.data.object
        if (charge.object !== 'charge' || charge.livemode !== false || charge.currency !== 'eur' ||
            !/^pi_[A-Za-z0-9]+$/.test(charge.payment_intent || '') ||
            !Number.isSafeInteger(charge.amount_refunded) || charge.amount_refunded <= 0 ||
            !Number.isSafeInteger(charge.amount) || charge.amount_refunded > charge.amount) fail('invalid_stripe_refund')
        return store.recordRefund(event, charge)
      }
      const allowed = ['checkout.session.completed', 'checkout.session.async_payment_succeeded']
      if (!allowed.includes(event.type)) return { ok: true, ignored: true }
      const session = event.data.object
      // An async completion is not necessarily paid. Never infer paid from event name.
      if (session.payment_status !== 'paid') return { ok: true, ignored: true }
      if (!/^pi_[A-Za-z0-9]+$/.test(session.payment_intent || '')) fail('missing_stripe_payment_intent')
      return store.recordPaid(event, session, validateStripeSession)
    },
  }
}
