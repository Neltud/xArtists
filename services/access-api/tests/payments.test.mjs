import assert from 'node:assert/strict'
import { test } from 'node:test'
import { startServer, post } from './server-fixture.mjs'
import { moonpayConfig, signMoonpayUrl, appendMoonpaySignature } from '../src/moonpay.mjs'
import { signJwt } from '../src/verifyAccess.mjs'

const env = { MOONPAY_PUBLIC_KEY: 'pk_test_ReleaseFixture123', MOONPAY_SECRET_KEY: 'sk_test_NotARealCredential123' }
const config = moonpayConfig(env)
const base = 'https://buy-sandbox.moonpay.com/?apiKey=pk_test_ReleaseFixture123&currencyCode=egld&baseCurrencyCode=eur'

test('MoonPay signature matches the official fixed documentation vector', () => {
  const url = 'https://buy-sandbox.moonpay.com/?apiKey=pk_test_DocsVector00&currencyCode=eth&walletAddress=0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe'
  assert.equal(appendMoonpaySignature(url, 'sk_test_DocsVector00'), url + '&signature=oIJxSghyzll%2FBLhUFdQZhkxf7DAS8REFaWr%2FibO%2BK8Q%3D')
})

test('signer binds host, API key, asset, recipient and return site; rejects duplicate parameters', () => {
  const raw = base + '&walletAddress=erd1' + 'q'.repeat(58) + '&email=artist%2Btest%40example.com&redirectURL=' + encodeURIComponent('https://neltud.github.io/xArtists/#/wallet?moonpay=done')
  const signed = signMoonpayUrl(raw, config)
  assert(signed.startsWith(raw + '&signature='))
  assert.equal(new URL(signed).searchParams.getAll('signature').length, 1)
  const invalid = [
    base.replace('buy-sandbox.moonpay.com', 'attacker.example'),
    base.replace('buy-sandbox', 'buy'),
    base.replace('pk_test_ReleaseFixture123', 'pk_test_DifferentKey123'),
    base.replace('egld', 'tro'),
    base + '&apiKey=duplicate', base + '&signature=old', base + '#fragment',
    base + '&walletAddress=erd1invalid', base + '&baseCurrencyAmount=0',
    base + '&baseCurrencyAmount=NaN', base + '&baseCurrencyAmount=10001',
    base + '&redirectURL=https%3A%2F%2Fattacker.example%2F',
    base + '&redirectURL=https%3A%2F%2Fneltud.github.io%2Fother%2F',
  ]
  for (const url of invalid) assert.throws(() => signMoonpayUrl(url, config))
  assert.throws(() => signMoonpayUrl(base, moonpayConfig({})), { statusCode: 503 })
  assert.equal(moonpayConfig({ ...env, MOONPAY_SECRET_KEY: 'sk_live_MismatchedMode123' }).ready, false)
})

test('HTTP integration: unconfigured payments fail closed; client prices never override the catalog', async () => {
  const server = await startServer()
  try {
    const health = await (await fetch(server.base + '/health')).json()
    assert.equal(health.moonpay_configured, false)
    assert.equal(health.paybox_configured, false)
    assert.equal((await post(server.base + '/moonpay/sign', { url: base })).status, 503)
    // Auth runs before paybox_not_configured (P0): unauthenticated → 401, not 501
    for (const [pack_id] of [['pulse', 11000], ['yield', 7500], ['sentinel', 5000]]) {
      const response = await post(server.base + '/v1/checkout/paybox', { pack_id, amount_cents: 1 })
      assert.equal(response.status, 401)
      const body = await response.json()
      assert.ok(body.error === 'buyer_auth_required' || body.error)
      assert.equal(body.url, undefined)
    }
    assert.equal((await fetch(server.base + '/v1/checkout/paybox?amount_cents=1')).status, 405)
    assert.equal((await post(server.base + '/v1/checkout/paybox', { pack_id: 'unknown' })).status, 400)
    assert.equal((await post(server.base + '/moonpay/sign', '{invalid')).status, 400)
    assert.equal((await post(server.base + '/moonpay/sign', 'x'.repeat(17000))).status, 413)
    assert.equal((await fetch(server.base + '/health')).status, 200)
  } finally { await server.close() }
})

test('HTTP integration: configured signer returns an encoded signature, rejects foreign origin and throttles requests', async () => {
  const server = await startServer(env)
  try {
    const health = await (await fetch(server.base + '/health')).json()
    assert.equal(health.moonpay_configured, true)
    assert.equal(health.moonpay_mode, 'test')
    const response = await post(server.base + '/moonpay/sign', { url: base }, { Origin: 'https://neltud.github.io' })
    assert.equal(response.status, 200)
    assert.equal((await response.json()).url, signMoonpayUrl(base, config))
    assert.equal((await post(server.base + '/moonpay/sign', { url: base }, { Origin: 'https://attacker.example' })).status, 403)
    for (let i = 0; i < 29; i++) {
      assert.equal((await post(server.base + '/moonpay/sign', { url: base }, { 'X-Forwarded-For': `192.0.2.${i}` })).status, 200)
    }
    assert.equal((await post(server.base + '/moonpay/sign', { url: base }, { 'X-Forwarded-For': '192.0.2.99' })).status, 429)
  } finally { await server.close() }
})

test('HTTP introspection preserves both response formats and rejects invalid or weak-secret sessions', async () => {
  const secret = 'test-only-introspection-secret-188'
  const payload = { sub: 'erd1' + 'q'.repeat(58), access_level: 'SAMPLE', exp: Math.floor(Date.now() / 1000) + 60 }
  const server = await startServer({ ACCESS_JWT_SECRET: secret })
  try {
    const url = server.base + '/v1/access/introspect'
    assert.equal((await fetch(url)).status, 401)
    assert.equal((await fetch(url, { headers: { Authorization: 'Bearer invalid' } })).status, 401)
    const response = await fetch(url, { headers: { Authorization: `Bearer ${signJwt(payload, secret)}` } })
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.deepEqual(body.payload, payload)
    assert.equal(body.sub, payload.sub)
    assert.equal(body.status, payload.access_level)
    assert.equal(body.exp, payload.exp)
  } finally { await server.close() }

  const weakServer = await startServer({ ACCESS_JWT_SECRET: 'short' })
  try {
    const response = await fetch(weakServer.base + '/v1/access/introspect', {
      headers: { Authorization: `Bearer ${signJwt(payload, 'short')}` },
    })
    assert.equal(response.status, 401)
  } finally { await weakServer.close() }
})
