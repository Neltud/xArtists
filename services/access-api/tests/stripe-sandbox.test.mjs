import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { stripeSandboxConfig, verifyStripeEvent, buildStripeSession,
  validateStripeSession, createStripeSandboxService } from '../src/stripeCheckout.mjs'
import { handleStripe } from '../src/stripeHttp.mjs'

const now = 1804350000000
const secret = 'whsec_fixture'
const env = { STRIPE_SANDBOX_SECRET_KEY: 'sk_test_fixture',
  STRIPE_SANDBOX_WEBHOOK_SECRET: secret, STRIPE_SANDBOX_DATABASE_URL: 'test-fixture',
  STRIPE_SANDBOX_CHECKOUT_ENABLED: '1', STRIPE_SANDBOX_RETURN_BASE: 'https://neltud.github.io/xArtists' }
const buyer = 'erd1' + 'a'.repeat(58)
const input = { buyer, pack_id: 'pulse', request_id: '11111111-1111-4111-8111-111111111111' }
const order = { order_id: 'xs_fixture', buyer, pack_id: 'pulse', amount_cents: 11000, created_ms: now }
const session = { object: 'checkout.session', id: 'cs_test_fixture', livemode: false,
  mode: 'payment', client_reference_id: order.order_id, metadata: { order_id: order.order_id, pack_id: 'pulse' },
  currency: 'eur', amount_total: 11000, payment_status: 'paid', payment_intent: 'pi_fixture',
  url: 'https://checkout.stripe.com/c/pay/cs_test_fixture' }
function signed(overrides = {}, timestamp = now / 1000) {
  const event = { object: 'event', id: 'evt_fixture', livemode: false,
    type: 'checkout.session.completed', data: { object: session }, ...overrides }
  const raw = Buffer.from(JSON.stringify(event))
  const digest = crypto.createHmac('sha256', secret).update(`${timestamp}.`).update(raw).digest('hex')
  return { raw, header: `t=${timestamp},v1=${digest}` }
}
const service = store => createStripeSandboxService({ store, env, now: () => now })

test('defaults deny checkout; live credentials never enable the sandbox', () => {
  assert.equal(stripeSandboxConfig({}).checkout_enabled, false)
  for (const key of ['sk_live_fixture', 'rk_live_fixture', '']) {
    const c = stripeSandboxConfig({ ...env, STRIPE_SANDBOX_SECRET_KEY: key })
    assert.equal(c.checkout_enabled, false)
    assert.equal(c.live_enabled, false)
  }
  assert.equal(stripeSandboxConfig(env).checkout_enabled, true)
  assert.equal(stripeSandboxConfig({ ...env, STRIPE_SANDBOX_CHECKOUT_ENABLED: '0' }).webhook_ready, true)
  assert.equal(stripeSandboxConfig({ ...env, STRIPE_SANDBOX_DATABASE_URL: '', DATABASE_URL: 'production' }).webhook_ready, false)
})

test('catalogue controls prices; client URLs, currency and amount are absent', () => {
  const params = buildStripeSession(order, env.STRIPE_SANDBOX_RETURN_BASE)
  assert.equal(params.get('line_items[0][price_data][unit_amount]'), '11000')
  assert.equal(params.get('line_items[0][price_data][currency]'), 'eur')
  assert.equal(params.get('client_reference_id'), order.order_id)
  assert.match(params.get('success_url'), /stripe_order=xs_fixture/)
  assert.equal(params.get('metadata[buyer]'), null)
  for (const pack_id of ['__proto__', 'constructor', 'unknown']) {
    assert.throws(() => buildStripeSession({ ...order, pack_id }, env.STRIPE_SANDBOX_RETURN_BASE))
  }
  assert.throws(() => buildStripeSession({ ...order, amount_cents: 1 }, env.STRIPE_SANDBOX_RETURN_BASE))
  for (const target of ['http://example.com', 'https://user:pass@example.com', 'https://example.com/#evil']) {
    assert.throws(() => buildStripeSession(order, target))
  }
})

test('signature authenticates exact bytes, allows rotated v1 and rejects stale/future replays', () => {
  const { raw, header } = signed()
  assert.equal(verifyStripeEvent(raw, header, secret, now).id, 'evt_fixture')
  assert.equal(verifyStripeEvent(raw, header + ',v1=' + '0'.repeat(64), secret, now).id, 'evt_fixture')
  assert.throws(() => verifyStripeEvent(Buffer.concat([raw, Buffer.from(' ')]), header, secret, now))
  assert.throws(() => verifyStripeEvent(raw, header.replace('v1=', 'v0='), secret, now))
  assert.throws(() => verifyStripeEvent(raw, header + ',t=1', secret, now))
  for (const delta of [-301, 301]) {
    const other = signed({}, now / 1000 + delta)
    assert.throws(() => verifyStripeEvent(other.raw, other.header, secret, now))
  }
})

test('live and Connect events are refused even when correctly signed', () => {
  for (const overrides of [{ livemode: true }, { account: 'acct_other' }]) {
    const s = signed(overrides)
    assert.throws(() => verifyStripeEvent(s.raw, s.header, secret, now))
  }
})

test('session validation binds currency, cents, mode, order, pack and session', () => {
  validateStripeSession(session, order)
  for (const changes of [{ currency: 'usd' }, { amount_total: 1 }, { amount_total: '11000' },
    { livemode: true }, { mode: 'subscription' }, { id: 'cs_live_fixture' },
    { client_reference_id: 'xs_other' }, { metadata: { order_id: order.order_id, pack_id: 'sentinel' } }]) {
    assert.throws(() => validateStripeSession({ ...session, ...changes }, order))
  }
  assert.throws(() => validateStripeSession(session, { ...order, session_id: 'cs_test_other' }))
})

test('unpaid completions and irrelevant events do not mutate storage', async () => {
  const svc = service({ recordPaid: () => assert.fail('must not record payment') })
  for (const overrides of [{ type: 'customer.created' }, { data: { object: { ...session, payment_status: 'unpaid' } } }]) {
    const s = signed(overrides)
    assert.equal((await svc.webhook(s.raw, s.header)).ignored, true)
  }
})

test('paid events reach ledger with bound session and no mint callback', async () => {
  let count = 0
  const svc = service({ recordPaid: async (event, candidate, validate) => {
    validate(candidate, order)
    count++
    return { ok: true, delivery_verified: false }
  } })
  const s = signed()
  assert.equal((await svc.webhook(s.raw, s.header)).delivery_verified, false)
  assert.equal(count, 1)
  const bad = signed({ data: { object: { ...session, payment_intent: null } } })
  await assert.rejects(svc.webhook(bad.raw, bad.header), /missing_stripe_payment_intent/)
})

test('refund validation rejects impossible totals; verified refunds go to reconciliation only', async () => {
  const charge = { object: 'charge', livemode: false, currency: 'eur', payment_intent: 'pi_fixture',
    amount: 11000, amount_refunded: 5000 }
  let calls = 0
  const svc = service({ recordRefund: async () => { calls++; return { ok: true, payment_verified: false } } })
  const s = signed({ type: 'charge.refunded', data: { object: charge } })
  assert.equal((await svc.webhook(s.raw, s.header)).payment_verified, false)
  for (const changes of [{ amount_refunded: 11001 }, { amount_refunded: -1 }, { amount_refunded: '5000' }, { currency: 'usd' }]) {
    const bad = signed({ type: 'charge.refunded', data: { object: { ...charge, ...changes } } })
    await assert.rejects(svc.webhook(bad.raw, bad.header))
  }
  assert.equal(calls, 1)
})

test('unknown outcomes retry the exact provider key; stored session reuse makes no second call', async () => {
  let reserved
  const keys = []
  const store = { reserve: async data => reserved ||= data,
    attach: async (id, sid, url) => { reserved.session_id = sid; reserved.session_url = url } }
  const svc = createStripeSandboxService({ store, env, now: () => now,
    fetchImpl: async (url, options) => {
      keys.push(options.headers['Idempotency-Key'])
      if (keys.length === 1) throw new Error('timeout')
      return { ok: true, json: async () => ({ ...session,
        client_reference_id: reserved.order_id, metadata: { order_id: reserved.order_id, pack_id: reserved.pack_id } }) }
    } })
  await assert.rejects(svc.checkout(input), /outcome_unknown/)
  await svc.checkout(input)
  await svc.checkout(input)
  assert.equal(keys.length, 2)
  assert.equal(keys[0], keys[1])
  await assert.rejects(svc.checkout({ ...input, pack_id: 'sentinel' }), /idempotency_conflict/)
})

test('expired unknown outcomes, invalid packs, and live response never become checkout URLs', async () => {
  const store = { reserve: async data => ({ ...data, created_ms: now - 24 * 3600000 }) }
  await assert.rejects(service(store).checkout(input), /reconciliation_required/)
  await assert.rejects(service(store).checkout({ ...input, pack_id: '__proto__' }), /invalid_checkout_request/)
  const svc = createStripeSandboxService({ env, now: () => now,
    store: { reserve: async data => data, attach: () => assert.fail('must not persist live') },
    fetchImpl: async () => ({ ok: true, json: async () => ({ ...session, livemode: true }) }) })
  await assert.rejects(svc.checkout(input), /session_mismatch/)
})

test('HTTP legacy route stays closed; sandbox rejects unverified wallet JWT before store access', async () => {
  let reply
  const ctx = { path: '/v1/checkout/session', json: (res, code, body) => { reply = { code, body } },
    jwtSecret: 'fixture-secret-long-enough', originAllowed: () => true,
    verifyJwt: () => ({ sub: buyer, iss: 'xartists-access-api', wallet_proof_verified: false }), erdToPubkey: () => true }
  await handleStripe({ method: 'POST', headers: {} }, {}, ctx)
  assert.equal(reply.code, 503)
  await handleStripe({ method: 'POST', headers: {} }, {}, { ...ctx, path: '/v1/stripe/sandbox/session' })
  assert.equal(reply.code, 401)
  await handleStripe({ method: 'POST', headers: { origin: 'https://evil.example' } }, {},
    { ...ctx, path: '/v1/stripe/sandbox/session', originAllowed: () => false })
  assert.equal(reply.code, 403)
})
