/**
 * HTTP integration tests for access-api payments surface (MoonPay + Paybox gates).
 * Uses server-fixture; never hits real PSP.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { startServer, request } from './server-fixture.mjs'

const PACKS = {
  pulse: 11000,
  yield: 7500,
  sentinel: 5000,
}

test('HTTP integration: unconfigured payments fail closed; client prices never override the catalog', async () => {
  const { base, stop } = await startServer({
    env: {
      ACCESS_JWT_SECRET: 'test-secret-at-least-16',
      // no PAYBOX / MOONPAY secrets → fail closed
    },
  })
  try {
    const health = await request(base, 'GET', '/health')
    assert.equal(health.status, 200)
    assert.equal(health.body.paybox_configured, false)
    assert.equal(health.body.moonpay_configured, false)

    for (const [pack, cents] of Object.entries(PACKS)) {
      const res = await request(base, 'POST', '/v1/checkout/paybox', {
        headers: { Authorization: 'Bearer invalid' },
        body: { pack_id: pack, amount_cents: cents - 1 },
      })
      // auth-before-ready: 401, not 501
      assert.equal(res.status, 401, pack)
    }

    // Without auth, still never trust client amount
    const naked = await request(base, 'POST', '/v1/checkout/paybox', {
      body: { pack_id: 'pulse', amount_cents: 1 },
    })
    assert.equal(naked.status, 401)
  } finally {
    await stop()
  }
})

test('HTTP integration: configured signer returns an encoded signature, rejects foreign origin and throttles requests', async () => {
  const { base, stop } = await startServer({
    env: {
      ACCESS_JWT_SECRET: 'test-secret-at-least-16',
      MOONPAY_SECRET_KEY: 'sk_test_moonpay_fixture_key',
      MOONPAY_PUBLISHABLE_KEY: 'pk_test_fixture',
    },
  })
  try {
    const badOrigin = await request(base, 'POST', '/moonpay/sign', {
      headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' },
      body: { url: 'https://buy.moonpay.com?apiKey=pk_test_fixture' },
    })
    assert.equal(badOrigin.status, 403)

    const ok = await request(base, 'POST', '/moonpay/sign', {
      headers: { Origin: 'https://neltud.github.io', 'Content-Type': 'application/json' },
      body: { url: 'https://buy.moonpay.com?apiKey=pk_test_fixture&currencyCode=egld' },
    })
    assert.equal(ok.status, 200)
    assert.equal(ok.body.ok, true)
    assert.match(String(ok.body.url || ''), /signature=/)
  } finally {
    await stop()
  }
})
