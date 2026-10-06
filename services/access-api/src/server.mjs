/**
 * Access API — Stripe/Paybox stubs + Sprint 1.1 verify-access (JWT).
 * node services/access-api/src/server.mjs
 */
import http from 'node:http'
import { URL } from 'node:url'
import { resolveAccessLevel, issueAccessToken, verifyJwt } from './verifyAccess.mjs'

const PORT = Number(process.env.PORT || 8787)
const CORS = process.env.CORS_ORIGIN || '*'
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || ''
const JWT_SECRET = process.env.JWT_SECRET || ''

function json(res, code, body) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': CORS,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

async function stripeSession(body) {
  if (!STRIPE_KEY) {
    return { ok: false, status: 501, body: { error: 'STRIPE_SECRET_KEY not set' } }
  }
  return {
    ok: false,
    status: 501,
    body: {
      error: 'Install stripe SDK and implement sessions.create',
      received: { pack_id: body.pack_id, buyer_address: body.buyer_address },
    },
  }
}

function payboxSession(body) {
  const orderId = `xa-${body.pack_id || 'pack'}-${Date.now().toString(36)}`
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
    json(res, 200, {
      ok: true,
      stripe: Boolean(STRIPE_KEY),
      jwt: Boolean(JWT_SECRET && JWT_SECRET.length >= 16),
      pulse_collection: Boolean(process.env.PULSE_COLLECTION || process.env.PULSE_COLLECTIONS),
      service: 'access-api',
    })
    return
  }

  if (req.method === 'POST' && path === '/v1/verify-access') {
    const body = await readBody(req)
    const address = (body.address || body.wallet || '').trim()
    const access = await resolveAccessLevel(address || null)
    const issued = issueAccessToken(access, address || null, JWT_SECRET)
    if (issued.error && access.status === 'FULL') {
      json(res, 503, {
        ok: false,
        error: issued.error,
        status: 'SAMPLE',
        hasAccess: false,
        reason: 'jwt_secret_not_configured',
      })
      return
    }
    json(res, 200, {
      ok: true,
      status: access.status,
      hasAccess: access.hasAccess,
      reason: access.reason,
      expiryDate: access.expiryDate,
      source: access.source,
      identifier: access.identifier || null,
      token: issued.token,
      expiresIn: issued.expiresIn || null,
      sampleLessonId: 'sample_01',
      packId: 'pulse_pack_v1',
    })
    return
  }

  if (req.method === 'GET' && path === '/v1/access/introspect') {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : u.searchParams.get('token') || ''
    const payload = verifyJwt(token, JWT_SECRET)
    if (!payload) {
      json(res, 401, { ok: false, error: 'invalid_or_expired_token' })
      return
    }
    json(res, 200, { ok: true, payload })
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
  console.log(`access-api on :${PORT}`)
  console.log('POST /v1/verify-access')
  console.log('GET  /v1/access/introspect')
})
