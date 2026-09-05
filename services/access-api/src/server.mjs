/**
 * Access API stub — Stripe Checkout + Paybox session scaffold.
 * Deploy: node services/access-api/src/server.mjs
 * Replace TODOs with real Stripe / Paybox HMAC before prod.
 */
import http from 'node:http'
import { URL } from 'node:url'

const PORT = Number(process.env.PORT || 8787)
const CORS = process.env.CORS_ORIGIN || '*'
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || ''

function json(res, code, body) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': CORS,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  })
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  const chunks = []
  for await (const c of req) chunks.push(c)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

/** Stripe Checkout Session — requires stripe package + STRIPE_SECRET_KEY in real deploy */
async function stripeSession(body) {
  if (!STRIPE_KEY) {
    return {
      ok: false,
      status: 501,
      body: {
        error: 'STRIPE_SECRET_KEY not set — set env or use Payment Links on the front',
      },
    }
  }
  // Production: use stripe.checkout.sessions.create
  // Here we return a clear TODO so ops know the wire is ready.
  return {
    ok: false,
    status: 501,
    body: {
      error: 'Install stripe SDK and implement sessions.create',
      received: {
        pack_id: body.pack_id,
        buyer_address: body.buyer_address,
      },
    },
  }
}

function payboxSession(body) {
  const orderId = `xa-${body.pack_id || 'pack'}-${Date.now().toString(36)}`
  // Production: HMAC sign PBX_* params, return preprod-tpeweb.paybox.com URL
  const preprod =
    process.env.PAYBOX_ENV === 'prod'
      ? 'https://tpeweb.paybox.com/cgi/MYchoix_pagepaiement.cgi'
      : 'https://preprod-tpeweb.paybox.com/cgi/MYchoix_pagepaiement.cgi'
  return {
    ok: true,
    status: 200,
    body: {
      order_id: orderId,
      url: null,
      message:
        'Sign PBX params with PAYBOX_HMAC_KEY then set url to Paybox CGI. Stub only.',
      stub: true,
      hint_cgi: preprod,
      amount_cents: body.amount_cents,
      buyer_address: body.buyer_address,
      pack_id: body.pack_id,
    },
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    json(res, 204, {})
    return
  }

  const u = new URL(req.url || '/', `http://127.0.0.1:${PORT}`)
  const path = u.pathname.replace(/\/$/, '') || '/'

  if (req.method === 'GET' && path === '/health') {
    json(res, 200, { ok: true, stripe: Boolean(STRIPE_KEY), service: 'access-api' })
    return
  }

  if (req.method === 'POST' && path === '/v1/checkout/session') {
    const body = await readBody(req)
    const out = await stripeSession(body)
    json(res, out.status, out.body)
    return
  }

  if (req.method === 'POST' && path === '/v1/checkout/paybox') {
    const body = await readBody(req)
    const out = payboxSession(body)
    json(res, out.status, out.body)
    return
  }

  if (req.method === 'GET' && path.startsWith('/v1/checkout/status/')) {
    const id = path.split('/').pop()
    json(res, 200, { status: 'pending', session_id: id })
    return
  }

  json(res, 404, { error: 'not_found', path })
})

server.listen(PORT, () => {
  console.log(`access-api listening on :${PORT}`)
  console.log('POST /v1/checkout/session  (Stripe)')
  console.log('POST /v1/checkout/paybox   (Paybox)')
})
