/**
 * P0 HTTP → RSA-SHA256 signed IPN → PostgreSQL → replay reconciliation proof.
 * Synthetic merchant/PSP fixtures only; no external PSP, wallets or mint.
 * Strictly refuses any database except an opted-in local disposable instance.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import crypto from 'node:crypto'
import { startServer } from './server-fixture.mjs'

const databaseUrl = process.env.TEST_IPN_DATABASE_URL || ''
const sandboxOnly = (() => {
  try {
    const url = new URL(databaseUrl)
    return process.env.ALLOW_EPHEMERAL_MINT_PG_TEST === '1' &&
      url.protocol === 'postgres:' &&
      ['localhost', '127.0.0.1'].includes(url.hostname) &&
      url.pathname === '/xartists_ipn_probe'
  } catch { return false }
})()

const BUYER = 'erd1' + 'q'.repeat(58)
const HMAC_FIXTURE = '0123456789ABCDEF'.repeat(4)
const PATH = '/v1/checkout/paybox/ipn'

test('signed PayBox callback, concurrency and restart use one durable Postgres order', {
  skip: !sandboxOnly && 'Requires an explicitly authorized disposable localhost PostgreSQL DB',
}, async () => {
  // The only database used by this test is the dedicated disposable CI DB.
  process.env.DATABASE_URL = databaseUrl
  process.env.PGSSL = '0'
  const { createOrder, getOrder, publicOrderDelivery } = await import('../src/orders.mjs')
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
  })
  const pubPem = publicKey.export({ type: 'spki', format: 'pem' })
  const timestamp = Date.now()
  const orderId = 'xa_ipn_' + timestamp
  const secondId = 'xa_ipn_other_' + timestamp
  const providerTx = 'fixture_tx_' + timestamp

  const env = {
    DATABASE_URL: databaseUrl,
    PGSSL: '0',
    PAYBOX_ENV: 'preprod',
    PAYBOX_SITE: '1999888',
    PAYBOX_RANG: '32',
    PAYBOX_HMAC_KEY: HMAC_FIXTURE,
    PAYBOX_PUBKEY_PEM: pubPem,
    PAYBOX_CHECKOUT_ENABLED: '0',
    MINT_DISPATCH_ENABLED: '0',
    MINT_GITHUB_PAT: '',
    GITHUB_TOKEN: '',
    MINT_DRY_RUN: '1',
    MINT_LIVE_ENABLED: '0',
    LIA_LIVE_TRADING: '0',
  }
  const sign = data => crypto.sign(
    'RSA-SHA256', Buffer.from(data, 'utf8'), privateKey,
  ).toString('base64')
  const body = (data, signature = sign(data)) =>
    data + '&sign=' + encodeURIComponent(signature)
  const send = (server, encodedBody) => fetch(server.base + PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: encodedBody,
  })
  const data = [
    'amount=7500',
    'ref=' + orderId,
    'auto=fixture_auth',
    'error=00000',
    'idtrans=' + providerTx,
    'site=1999888',
    'devise=978',
  ].join('&')
  const signed = body(data)
  await createOrder({
    order_id: orderId, pack_id: 'yield',
    amount_cents: 7500, buyer_address: BUYER,
  })
  await createOrder({
    order_id: secondId, pack_id: 'sentinel',
    amount_cents: 5000, buyer_address: BUYER,
  })

  let server = await startServer(env)
  try {
    const health = await (await fetch(server.base + '/health')).json()
    assert.equal(health.paybox_configured, true)
    assert.equal(health.paybox_checkout_enabled, false)
    assert.equal(health.mint_dispatch_enabled, false)
    assert.equal(health.mint_dry_run, true)
    assert.equal(health.mint_live_enabled, false)
    assert.equal(health.lia_live_trading, '0')

    const unsigned = await send(server, data)
    assert.equal(unsigned.status, 400)
    assert.equal((await unsigned.json()).ok, false)

    const tampered = await send(server, body(data.replace('amount=7500', 'amount=1'), sign(data)))
    assert.equal(tampered.status, 400)
    assert.equal((await tampered.json()).error, 'bad_signature')

    const noTx = [
      'amount=7500', 'ref=' + orderId, 'auto=fixture_auth',
      'error=00000', 'site=1999888', 'devise=978',
    ].join('&')
    const missingTransaction = await send(server, body(noTx))
    assert.equal(missingTransaction.status, 400)
    assert.equal((await missingTransaction.json()).error, 'missing_provider_transaction_id')

    const mismatch = await send(server, body(data.replace('site=1999888', 'site=9999999')))
    assert.equal(mismatch.status, 400)
    assert.equal((await mismatch.json()).error, 'merchant_mismatch')

    const ambiguous = await fetch(server.base + PATH + '?' + signed, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: signed,
    })
    assert.equal(ambiguous.status, 400)
    assert.equal((await ambiguous.json()).error, 'ambiguous_signed_sources')

    assert.equal((await getOrder(orderId)).status, 'created')
    const [a, b] = await Promise.all([send(server, signed), send(server, signed)])
    assert.equal(a.status, 200)
    assert.equal(b.status, 200)
    const replies = await Promise.all([a.json(), b.json()])
    assert.equal(replies.filter(x => x.duplicate === false).length, 1)
    assert.equal(replies.filter(x => x.duplicate === true).length, 1)
    for (const response of replies) {
      assert.equal(response.ok, true)
      assert.equal(response.status, 'paid')
      assert.equal(response.delivery, 'pending')
      assert.equal(response.server_confirmed, true)
      assert.notEqual(response.mint_dispatch?.ok, true)
    }
    const persisted = await getOrder(orderId)
    assert.equal(persisted.status, 'paid')
    assert.equal(persisted.server_confirmed, true)
    assert.equal(persisted.payment_verified, true)
    assert.equal(persisted.provider_tx_id, providerTx)
    assert.equal(persisted.ipn_count, 2)
    assert.equal(persisted.delivered_at, null)
    assert.equal(persisted.delivery_verified, false)
    assert.equal(persisted.mint_status, 'awaiting_dispatch')
    assert.deepEqual(publicOrderDelivery(persisted), {
      delivery: 'pending', delivery_verified: false, delivered_at: null,
    })

    const reused = [
      'amount=5000', 'ref=' + secondId, 'auto=fixture_auth',
      'error=00000', 'idtrans=' + providerTx,
      'site=1999888', 'devise=978',
    ].join('&')
    const reusedResponse = await send(server, body(reused))
    assert.equal(reusedResponse.status, 400)
    assert.equal((await reusedResponse.json()).error, 'provider_tx_reused')
    assert.equal((await getOrder(secondId)).status, 'created')
  } finally {
    await server.close()
  }

  // Fresh server process must observe durable state and refuse replay.
  server = await startServer(env)
  try {
    const replay = await fetch(server.base + PATH + '?' + signed)
    assert.equal(replay.status, 200)
    const result = await replay.json()
    assert.equal(result.duplicate, true)
    assert.equal(result.status, 'paid')
    assert.equal(result.delivery, 'pending')
    assert.equal((await getOrder(orderId)).ipn_count, 3)
    assert.equal((await getOrder(orderId)).delivered_at, null)
    console.log('SIGNED_IPN_POSTGRES_OK: RSA verified, one payment, concurrent/restart replay guarded, delivery pending')
  } finally {
    await server.close()
  }
})
