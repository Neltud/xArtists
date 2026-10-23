/**
 * HTTP integration for Paybox routes.
 * Auth: JWT required on checkout + order status (buyer identity).
 * IPN: RSA-SHA256 fixtures only — no real PSP traffic.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { signJwt } from '../src/verifyAccess.mjs'

const HMAC_HEX = '0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF'
const BUYER = 'erd1' + 'f'.repeat(58)
const OTHER = 'erd1' + 'e'.repeat(58)
const JWT_SECRET = 'test-jwt-secret-min-16-chars-xx'

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
const testPubPem = publicKey.export({ type: 'spki', format: 'pem' })

function signIpn(dataString) {
  return crypto.sign('RSA-SHA256', Buffer.from(dataString, 'utf8'), privateKey).toString('base64')
}

function buyerToken(addr = BUYER) {
  return signJwt({ sub: addr, status: 'FULL', exp: Math.floor(Date.now()/1000) + 3600 }, JWT_SECRET)
}

async function startServer(extraEnv = {}) {
  const ordersPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pbx-http-')), 'orders.json')
  const child = spawn(process.execPath, [new URL('../src/server.mjs', import.meta.url).pathname], {
    env: {
      ...process.env,
      PORT: '0',
      CORS_ORIGIN: 'https://neltud.github.io',
      MOONPAY_PUBLIC_KEY: '',
      MOONPAY_SECRET_KEY: '',
      STRIPE_SECRET_KEY: '',
      ACCESS_JWT_SECRET: JWT_SECRET,
      JWT_SECRET,
      REQUIRE_SIWX: '0',
      PULSE_ALLOWLIST: '',
      PULSE_COLLECTION: '',
      LIA_LIVE_TRADING: '0',
      PAYBOX_ORDERS_PATH: ordersPath,
      PAYBOX_PUBKEY_PEM: testPubPem,
      ...extraEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const port = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill()
      reject(new Error('server_start_timeout'))
    }, 8000)
    child.once('exit', code => {
      clearTimeout(timeout)
      reject(new Error(`server_exit_${code}`))
    })
    child.stdout.on('data', chunk => {
      const match = chunk.toString().match(/access-api :(\d+)/)
      if (match) {
        clearTimeout(timeout)
        resolve(Number(match[1]))
      }
    })
  })
  return {
    base: `http://127.0.0.1:${port}`,
    ordersPath,
    async close() {
      child.kill()
      await once(child, 'exit')
    },
  }
}

const post = (url, body, headers = {}) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })

test('unconfigured paybox stays 501; client amount ignored; auth still required', async () => {
  const server = await startServer()
  try {
    const health = await (await fetch(server.base + '/health')).json()
    assert.equal(health.paybox_configured, false)
    assert.equal(health.lia_live_trading, '0')

    const noAuth = await post(server.base + '/v1/checkout/paybox', {
      pack_id: 'pulse',
      amount_cents: 1,
      buyer_address: BUYER,
    })
    assert.equal(noAuth.status, 401)

    const r = await post(
      server.base + '/v1/checkout/paybox',
      { pack_id: 'pulse', amount_cents: 1, buyer_address: BUYER },
      { Authorization: `Bearer ${buyerToken()}` }
    )
    assert.equal(r.status, 501)
    const body = await r.json()
    assert.equal(body.amount_cents, 11000)
    assert.equal(body.url, undefined)
  } finally {
    await server.close()
  }
})

test('sandbox fixtures: JWT session + RSA IPN idempotent + buyer-bound order poll', async () => {
  const server = await startServer({
    PAYBOX_SITE: '1999888',
    PAYBOX_RANG: '32',
    PAYBOX_HMAC_KEY: HMAC_HEX,
    PAYBOX_ENV: 'preprod',
  })
  try {
    const health = await (await fetch(server.base + '/health')).json()
    assert.equal(health.paybox_configured, true)
    assert.equal(health.paybox_auth_inbound, 'rsa_sha256_2048')

    const noAuth = await post(server.base + '/v1/checkout/paybox', {
      pack_id: 'yield',
      amount_cents: 1,
      buyer_address: BUYER,
    })
    assert.equal(noAuth.status, 401)

    const spoof = await post(
      server.base + '/v1/checkout/paybox',
      { pack_id: 'yield', amount_cents: 1, buyer_address: OTHER },
      { Authorization: `Bearer ${buyerToken()}` }
    )
    assert.equal(spoof.status, 403)

    const sessionRes = await post(
      server.base + '/v1/checkout/paybox',
      { pack_id: 'yield', amount_cents: 1, buyer_address: BUYER },
      { Authorization: `Bearer ${buyerToken()}` }
    )
    assert.equal(sessionRes.status, 200)
    const session = await sessionRes.json()
    assert.equal(session.amount_cents, 7500)
    assert.ok(session.order_id)
    assert.ok(session.url.includes('preprod-tpeweb.paybox.com'))
    assert.equal(session.delivery, 'ipn_only')
    assert.equal(session.fields.PBX_IPNALGOSIGN, 'SHA_256')
    assert.equal(session.fields.PBX_SIGN_KEYSIZE, '2048')
    assert.ok(String(session.fields.PBX_RETOUR).endsWith('sign:K'))
    assert.ok(session.fields.PBX_BILLING)
    assert.ok(session.fields.PBX_SHOPPINGCART)

    const preUnauth = await fetch(server.base + `/v1/checkout/paybox/order/${session.order_id}`)
    assert.equal(preUnauth.status, 401)

    const preOther = await fetch(
      server.base + `/v1/checkout/paybox/order/${session.order_id}`,
      { headers: { Authorization: `Bearer ${buyerToken(OTHER)}` } }
    )
    assert.equal(preOther.status, 403)

    const pre = await (
      await fetch(server.base + `/v1/checkout/paybox/order/${session.order_id}`, {
        headers: { Authorization: `Bearer ${buyerToken()}` },
      })
    ).json()
    assert.equal(pre.server_confirmed, false)

    const data = `amount=7500&ref=${session.order_id}&auto=AUTH99&error=00000&idtrans=42`
    const sign = signIpn(data)
    const ipn1 = await post(server.base + '/v1/checkout/paybox/ipn', {
      amount: '7500',
      ref: session.order_id,
      auto: 'AUTH99',
      error: '00000',
      idtrans: '42',
      sign,
    })
    assert.equal(ipn1.status, 200)
    const ipnBody1 = await ipn1.json()
    assert.equal(ipnBody1.status, 'paid')
    assert.equal(ipnBody1.duplicate, false)

    const ipn2 = await post(server.base + '/v1/checkout/paybox/ipn', {
      amount: '7500',
      ref: session.order_id,
      auto: 'AUTH99',
      error: '00000',
      idtrans: '42',
      sign,
    })
    const ipnBody2 = await ipn2.json()
    assert.equal(ipnBody2.duplicate, true)

    const postStatus = await (
      await fetch(server.base + `/v1/checkout/paybox/order/${session.order_id}`, {
        headers: { Authorization: `Bearer ${buyerToken()}` },
      })
    ).json()
    assert.equal(postStatus.server_confirmed, true)
    assert.equal(postStatus.status, 'paid')
  } finally {
    await server.close()
  }
})
