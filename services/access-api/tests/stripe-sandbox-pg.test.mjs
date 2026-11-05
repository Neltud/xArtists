import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createStripePgStore } from '../src/stripeStore.mjs'
import { validateStripeSession } from '../src/stripeCheckout.mjs'

const connectionString = process.env.STRIPE_TEST_DATABASE_URL
test('Stripe sandbox PostgreSQL transactions', { skip: !connectionString }, async t => {
  const { default: pg } = await import('pg')
  const admin = new pg.Pool({ connectionString, ssl: false })
  const schema = 'stripe_test_' + crypto.randomBytes(8).toString('hex')
  await admin.query(`CREATE SCHEMA ${schema}`)
  const pool = new pg.Pool({ connectionString, ssl: false, max: 8, options: `-c search_path=${schema}` })
  try {
    await pool.query(await readFile(new URL('../migrations/stripe_sandbox.sql', import.meta.url), 'utf8'))
    const store = createStripePgStore(pool)
    const makeOrder = async id => {
      const order = { order_id: 'xs_' + id, buyer: 'fixture', pack_id: 'pulse', amount_cents: 11000, created_ms: Date.now() }
      await store.reserve(order)
      await store.attach(order.order_id, 'cs_test_' + id, 'https://checkout.stripe.com/c/pay/test')
      return order
    }
    const session = (order, pi = order.order_id) => ({ object: 'checkout.session', id: 'cs_test_' + order.order_id.slice(3),
      livemode: false, mode: 'payment', client_reference_id: order.order_id, amount_total: 11000, currency: 'eur',
      payment_intent: 'pi_' + pi, metadata: { order_id: order.order_id, pack_id: 'pulse' } })
    const event = id => ({ id: 'evt_' + id })
    const row = async order => (await pool.query('SELECT * FROM stripe_sandbox_orders WHERE order_id=$1', [order.order_id])).rows[0]

    await t.test('concurrent duplicate events and separate events for one session settle once', async () => {
      const order = await makeOrder('concurrent')
      const s = session(order)
      const results = await Promise.all(Array.from({ length: 6 }, (_, i) =>
        store.recordPaid(event(i < 3 ? 'same' : 'different' + i), s, validateStripeSession)))
      assert.equal(results.filter(r => !r.duplicate).length, 1)
      assert.equal((await row(order)).payment_verified, true)
      assert.ok(results.every(r => r.delivery_verified === false && r.nft_minted === false))
    })

    await t.test('wrong amounts roll back event and order writes', async () => {
      const order = await makeOrder('wrongamount')
      await assert.rejects(store.recordPaid(event('wrongamount'), { ...session(order), amount_total: 1 }, validateStripeSession))
      assert.equal((await row(order)).payment_verified, false)
      assert.equal((await pool.query("SELECT * FROM stripe_sandbox_events WHERE event_id='evt_wrongamount'")).rowCount, 0)
    })

    await t.test('one provider payment cannot settle two orders', async () => {
      const a = await makeOrder('first')
      const b = await makeOrder('second')
      await store.recordPaid(event('first'), session(a, 'shared'), validateStripeSession)
      await assert.rejects(store.recordPaid(event('second'), session(b, 'shared'), validateStripeSession))
      assert.equal((await row(b)).payment_verified, false)
    })

    await t.test('refunds are monotone; a replayed payment never restores refunded access', async () => {
      const order = await makeOrder('refund')
      const s = session(order)
      await store.recordPaid(event('paidrefund'), s, validateStripeSession)
      const charge = { payment_intent: s.payment_intent, amount: 11000, amount_refunded: 11000 }
      await store.recordRefund(event('refundfull'), charge)
      await store.recordRefund(event('refundolder'), { ...charge, amount_refunded: 1000 })
      const r = await store.recordPaid(event('paidreplay'), s, validateStripeSession)
      assert.equal(r.payment_verified, false)
      assert.equal((await row(order)).refunded_cents, 11000)
      assert.equal((await row(order)).payment_verified, false)
    })

    await t.test('refund before bound payment is retriable and never acknowledged as applied', async () => {
      await assert.rejects(store.recordRefund(event('earlyrefund'),
        { payment_intent: 'pi_unknown', amount: 11000, amount_refunded: 11000 }))
      assert.equal((await pool.query("SELECT * FROM stripe_sandbox_events WHERE event_id='evt_earlyrefund'")).rowCount, 0)
    })

    await t.test('new pool after restart sees the bound session and processed event', async () => {
      const order = await makeOrder('restart')
      const s = session(order)
      await store.recordPaid(event('restart'), s, validateStripeSession)
      const freshPool = new pg.Pool({ connectionString, ssl: false, options: `-c search_path=${schema}` })
      try {
        const fresh = createStripePgStore(freshPool)
        const restored = await fresh.reserve(order)
        assert.equal(restored.session_id, s.id)
        assert.equal(restored.payment_verified, true)
        assert.equal((await fresh.recordPaid(event('restart'), s, validateStripeSession)).duplicate, true)
      } finally { await freshPool.end() }
    })
  } finally {
    await pool.end()
    await admin.query(`DROP SCHEMA ${schema} CASCADE`)
    await admin.end()
  }
})
