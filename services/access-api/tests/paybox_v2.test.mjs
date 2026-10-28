import assert from 'node:assert/strict'
import { test, before, after } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import {
  payboxConfig,
  createPayboxSession,
  verifyPayboxIpn,
  verifyPayboxRsaSignature,
  extractRawSignedData,
  IPN_POLICY,
  loadPayboxPublicKey2048,
} from '../src/paybox.mjs'
import {
  createOrder,
  getOrder,
  getOrderForBuyer,
  applyIpn,
  newOrderId,
  resolveArtistBeneficiary,
  loadOrders,
} from '../src/orders.mjs'
import { resolveAuthenticatedBuyer } from '../src/buyerAuth.mjs'
import { signJwt } from '../src/verifyAccess.mjs'

const HMAC_HEX = '0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF'
const BUYER = 'erd1' + 'a'.repeat(58)
const OTHER = 'erd1' + 'b'.repeat(58)
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pbx-v2-'))
const ordersPath = path.join(tmpDir, 'orders.json')
const JWT_SECRET = 'test-jwt-secret-min-16-chars'

// Test fixtures: RSA-2048 only (matches production policy)
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
const testPubPem = publicKey.export({ type: 'spki', format: 'pem' })

function signIpn(dataString) {
  return crypto.sign('RSA-SHA256', Buffer.from(dataString, 'utf8'), privateKey).toString('base64')
}

before(() => {
  process.env.PAYBOX_ORDERS_PATH = ordersPath
  process.env.PAYBOX_ARTIST_ALLOWLIST = ''
  process.env.PAYBOX_PUBKEY_PEM = testPubPem
})

after(() => {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch { /* */ }
})

test('IPN policy is SHA_256 / 2048 with no SHA1 fallback', () => {
  assert.equal(IPN_POLICY.algorithm, 'SHA_256')
  assert.equal(IPN_POLICY.keySize, 2048)
  assert.equal(IPN_POLICY.opensslDigest, 'RSA-SHA256')
  assert.equal(IPN_POLICY.expectedSigBytes, 256)
})

test('session includes PBX_IPNALGOSIGN, PBX_SIGN_KEYSIZE, BILLING, SHOPPINGCART, sign:K last', () => {
  const cfg = payboxConfig({
    PAYBOX_SITE: '1999888', PAYBOX_RANG: '32', PAYBOX_HMAC_KEY: HMAC_HEX, PAYBOX_ENV: 'preprod',
  })
  const session = createPayboxSession({
    pack: { id: 'pulse', price_cents: 11000 },
    buyerAddress: BUYER,
    orderId: 'xa_pulse_test_001',
    successUrl: 'https://neltud.github.io/xArtists/#/ok',
    cancelUrl: 'https://neltud.github.io/xArtists/#/ko',
    ipnUrl: 'https://api.example/ipn',
  }, cfg)
  assert.equal(session.fields.PBX_IPNALGOSIGN, 'SHA_256')
  assert.equal(session.fields.PBX_SIGN_KEYSIZE, '2048')
  assert.ok(session.fields.PBX_BILLING.includes('Billing'))
  assert.ok(session.fields.PBX_SHOPPINGCART.includes('shoppingcart'))
  assert.ok(String(session.fields.PBX_RETOUR).endsWith('sign:K'))
  assert.equal(session.auth_inbound, 'rsa_sha256_2048')
})

test('rejects 1024-bit / SHA1 signatures', () => {
  const weak = crypto.generateKeyPairSync('rsa', { modulusLength: 1024 })
  const data = 'amount=1&ref=x&auto=a&error=00000&idtrans=1'
  const sig = crypto.sign('RSA-SHA1', Buffer.from(data), weak.privateKey).toString('base64')
  assert.equal(verifyPayboxRsaSignature(data, sig, weak.publicKey), false)
  // 1024-bit key size must fail policy load
  process.env.PAYBOX_PUBKEY_PEM = weak.publicKey.export({ type: 'spki', format: 'pem' })
  assert.throws(() => loadPayboxPublicKey2048(), /2048/)
  process.env.PAYBOX_PUBKEY_PEM = testPubPem
})

test('IPN valid RSA-SHA256 + raw signed data path', () => {
  const data = 'amount=7500&ref=xa_y_1&auto=A1&error=00000&idtrans=9'
  const sign = signIpn(data)
  const r = verifyPayboxIpn(
    { amount: '7500', ref: 'xa_y_1', auto: 'A1', error: '00000', idtrans: '9', sign },
    7500,
    {},
    { rawSignedData: data, pubKey: publicKey },
  )
  assert.equal(r.ok, true)
  assert.equal(r.paid, true)
})

test('altered encoded data fails signature', () => {
  const data = 'amount=7500&ref=xa_y_2&auto=A1&error=00000&idtrans=9'
  const sign = signIpn(data)
  const r = verifyPayboxIpn(
    { amount: '7500', ref: 'xa_y_2', auto: 'A1', error: '00000', idtrans: '9', sign },
    7500,
    {},
    { rawSignedData: data + 'x', pubKey: publicKey },
  )
  assert.equal(r.ok, false)
  assert.equal(r.reason, 'bad_signature')
})

test('extractRawSignedData keeps encoding before sign', () => {
  const raw = 'amount=100&ref=abc&auto=X&error=00000&idtrans=1&sign=BASE64SIG'
  assert.equal(extractRawSignedData(raw), 'amount=100&ref=abc&auto=X&error=00000&idtrans=1')
})

test('artist designated without allowlist is rejected', () => {
  process.env.PAYBOX_ARTIST_ALLOWLIST = ''
  assert.throws(() => resolveArtistBeneficiary('erd1' + 'c'.repeat(58)), { statusCode: 403 })
  process.env.PAYBOX_ARTIST_ALLOWLIST = 'erd1' + 'c'.repeat(58)
  assert.equal(resolveArtistBeneficiary('erd1' + 'c'.repeat(58)), 'erd1' + 'c'.repeat(58))
  process.env.PAYBOX_ARTIST_ALLOWLIST = ''
})

test('buyer auth: JWT required; address spoof denied', () => {
  const token = signJwt({ sub: BUYER, exp: Math.floor(Date.now() / 1000) + 600 }, JWT_SECRET)
  const ok = resolveAuthenticatedBuyer({
    headers: { authorization: `Bearer ${token}` },
    body: { buyer_address: BUYER },
    jwtSecret: JWT_SECRET,
  })
  assert.equal(ok.ok, true)
  const spoof = resolveAuthenticatedBuyer({
    headers: { authorization: `Bearer ${token}` },
    body: { buyer_address: OTHER },
    jwtSecret: JWT_SECRET,
  })
  assert.equal(spoof.ok, false)
  assert.equal(spoof.statusCode, 403)
  const bare = resolveAuthenticatedBuyer({
    headers: {},
    body: { buyer_address: BUYER },
    jwtSecret: JWT_SECRET,
  })
  assert.equal(bare.ok, false)
  assert.equal(bare.statusCode, 401)
})

test('order access: other user denied', async () => {
  const id = newOrderId('pulse', 't2')
  await createOrder({ order_id: id, pack_id: 'pulse', amount_cents: 11000, buyer_address: BUYER })
  await assert.rejects(() => getOrderForBuyer(id, OTHER), { statusCode: 403 })
})

test('idempotent delivery + restart persistence', async () => {
  const id = newOrderId('yield', 't3')
  await createOrder({ order_id: id, pack_id: 'yield', amount_cents: 7500, buyer_address: BUYER })
  const a = await applyIpn({ order_id: id, amount_cents: 7500, error_code: '00000', authorization: 'X' })
  assert.equal(a.duplicate, false)
  const b = await applyIpn({ order_id: id, amount_cents: 7500, error_code: '00000', authorization: 'X' })
  assert.equal(b.duplicate, true)
  const orders = await loadOrders()
  assert.equal(orders.orders[id].status, 'paid')
  assert.equal(orders.orders[id].delivery, 'simulated')
})

test('fail closed without merchant config', () => {
  assert.equal(payboxConfig({}).ready, false)
})
