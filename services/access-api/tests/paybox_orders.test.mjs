/**
 * Order store + session unit tests (no HTTP).
 * IPN crypto coverage is in paybox_v2.test.mjs (RSA-SHA256/2048 only).
 */
import assert from 'node:assert/strict'
import { test, before, after } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import {
  createOrder,
  getOrder,
  getOrderForBuyer,
  applyIpn,
  newOrderId,
  resolveArtistBeneficiary,
  loadOrders,
} from '../src/orders.mjs'
import {
  payboxConfig,
  createPayboxSession,
  IPN_POLICY,
  verifyPayboxIpn,
} from '../src/paybox.mjs'

const HMAC_HEX = '0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF'
const BUYER = 'erd1' + 'a'.repeat(58)
const OTHER = 'erd1' + 'b'.repeat(58)
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pbx-ord-'))
const ordersPath = path.join(tmpDir, 'orders.json')

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
const testPubPem = publicKey.export({ type: 'spki', format: 'pem' })

function signIpn(dataString) {
  return crypto.sign('RSA-SHA256', Buffer.from(dataString, 'utf8'), privateKey).toString('base64')
}

before(() => {
  process.env.PAYBOX_ORDERS_PATH = ordersPath
  process.env.PAYBOX_ARTIST_ALLOWLIST = ''
  process.env.PAYBOX_PUBKEY_PEM = testPubPem
  delete process.env.DATABASE_URL
})

after(() => {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch { /* */ }
})

test('newOrderId is unique and bounded', () => {
  const a = newOrderId('pulse', BUYER)
  const b = newOrderId('pulse', BUYER)
  assert.notEqual(a, b)
  assert.ok(a.length <= 30)
  assert.ok(a.startsWith('xa_'))
})

test('createOrder + applyIpn amount mismatch + idempotent delivery', async () => {
  const id = newOrderId('yield', BUYER)
  await createOrder({
    order_id: id,
    pack_id: 'yield',
    amount_cents: 7500,
    buyer_address: BUYER,
  })
  const bad = await applyIpn({ order_id: id, amount_cents: 1, error_code: '00000' })
  assert.equal(bad.ok, false)
  assert.equal(bad.reason, 'amount_mismatch')

  const first = await applyIpn({ order_id: id, amount_cents: 7500, error_code: '00000', authorization: 'AUTH1' })
  assert.equal(first.ok, true)
  assert.equal(first.duplicate, false)
  assert.equal(first.status, 'paid')
  assert.equal(first.delivery, 'simulated')

  const second = await applyIpn({ order_id: id, amount_cents: 7500, error_code: '00000', authorization: 'AUTH1' })
  assert.equal(second.ok, true)
  assert.equal(second.duplicate, true)
  assert.equal((await getOrder(id)).ipn_count, 2)
})

test('getOrderForBuyer denies cross-user access', async () => {
  const id = newOrderId('pulse', BUYER)
  await createOrder({ order_id: id, pack_id: 'pulse', amount_cents: 11000, buyer_address: BUYER })
  assert.equal((await getOrderForBuyer(id, BUYER)).order_id, id)
  await assert.rejects(() => getOrderForBuyer(id, OTHER), (e) => e.statusCode === 403)
})

test('artist allowlist required when beneficiary is designated', () => {
  process.env.PAYBOX_ARTIST_ALLOWLIST = 'erd1' + 'c'.repeat(58)
  assert.equal(resolveArtistBeneficiary(undefined), null)
  assert.throws(() => resolveArtistBeneficiary('erd1' + 'd'.repeat(58)), { statusCode: 403 })
  assert.equal(resolveArtistBeneficiary('erd1' + 'c'.repeat(58)), 'erd1' + 'c'.repeat(58))
  process.env.PAYBOX_ARTIST_ALLOWLIST = ''
  assert.throws(() => resolveArtistBeneficiary('erd1' + 'c'.repeat(58)), { statusCode: 403 })
})

test('HMAC session fails closed without credentials; RSA IPN only with fixtures', () => {
  assert.equal(payboxConfig({}).ready, false)
  const cfg = payboxConfig({
    PAYBOX_SITE: '1999888',
    PAYBOX_RANG: '32',
    PAYBOX_HMAC_KEY: HMAC_HEX,
    PAYBOX_ENV: 'preprod',
  })
  assert.equal(cfg.ready, true)
  const session = createPayboxSession(
    {
      pack: { id: 'pulse', price_cents: 11000 },
      buyerAddress: BUYER,
      orderId: 'xa_pulse_ord_001',
      successUrl: 'https://neltud.github.io/xArtists/#/ok',
      cancelUrl: 'https://neltud.github.io/xArtists/#/ko',
      ipnUrl: 'https://api.example/v1/checkout/paybox/ipn',
    },
    cfg
  )
  assert.equal(session.amount_cents, 11000)
  assert.equal(session.delivery, 'ipn_only')
  assert.ok(session.fields.PBX_HMAC)
  assert.equal(session.fields.PBX_IPNALGOSIGN, 'SHA_256')
  assert.equal(session.fields.PBX_SIGN_KEYSIZE, '2048')
  assert.ok(String(session.fields.PBX_RETOUR).endsWith('sign:K'))

  const data = 'amount=11000&ref=xa_test&auto=X&error=00000&idtrans=1'
  const sign = signIpn(data)
  assert.equal(
    verifyPayboxIpn(
      { amount: '11000', ref: 'xa_test', auto: 'X', error: '00000', idtrans: '1', sign },
      11000,
      cfg,
      { rawSignedData: data, pubKey: publicKey }
    ).ok,
    true
  )
  assert.equal(
    verifyPayboxIpn(
      { amount: '11000', ref: 'xa_test', auto: 'X', error: '00000', idtrans: '1', sign: 'DEAD' },
      11000,
      cfg,
      { rawSignedData: data, pubKey: publicKey }
    ).ok,
    false
  )
  assert.equal(IPN_POLICY.algorithm, 'SHA_256')
})

test('loadOrders returns schema after writes', async () => {
  const db = await loadOrders()
  assert.equal(db.schema, 'xartists_paybox_orders/v1')
  assert.ok(typeof db.orders === 'object')
})

test('file store keeps all concurrent creates under wx lock', async () => {
  const ids = [0, 1, 2].map((i) => newOrderId(`c${i}`, BUYER))
  await Promise.all(ids.map((id) => createOrder({
    order_id: id,
    pack_id: 'pulse',
    amount_cents: 11000,
    buyer_address: BUYER,
  })))
  const db = await loadOrders()
  for (const id of ids) {
    assert.ok(db.orders[id], `missing concurrent order ${id}`)
  }
})
