/**
 * Access API — JWT, SIWX, Paybox System sandbox (v8.3).
 * Paybox IPN: RSA-SHA256 / 2048 only. Buyer identity: JWT or SIWX.
 */
import http from 'node:http'
import { resolveAccessLevel, issueAccessToken, verifyJwt } from './verifyAccess.mjs'
import { createChallenge, verifySignedChallenge, requireSiwx } from './siwx.mjs'
import { moonpayConfig, signMoonpayUrl } from './moonpay.mjs'
import {
  payboxConfig, createPayboxSession, verifyPayboxIpn, extractRawSignedData, IPN_POLICY,
} from './paybox.mjs'
import {
  createOrder, getOrder, getOrderForBuyer, applyIpn, markRedirected, newOrderId, resolveArtistBeneficiary,
} from './orders.mjs'
import { resolveAuthenticatedBuyer } from './buyerAuth.mjs'

const PORT = Number(process.env.PORT || 8787)
const JWT_SECRET = process.env.ACCESS_JWT_SECRET || process.env.JWT_SECRET || ''
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || ''
const CORS = process.env.CORS_ORIGIN || '*'
const MOONPAY = moonpayConfig()
const PAYBOX = payboxConfig()
const moonpayHits = new Map()
const MOONPAY_WINDOW_MS = 60_000
const MOONPAY_MAX = 30

const PACK_CATALOG = {
  pulse: { id: 'pulse', name: 'Pulse Pack (Gold)', price_eur: 110, price_cents: 11000 },
  yield: { id: 'yield', name: 'Yield Pack (Silver)', price_eur: 75, price_cents: 7500 },
  sentinel: { id: 'sentinel', name: 'Sentinel Pack (Platinum)', price_eur: 50, price_cents: 5000 },
}

function getPack(packId) {
  const p = PACK_CATALOG[(packId || '').toLowerCase()]
  if (!p) throw new Error(`unknown_pack_id: ${packId}`)
  return p
}

function json(res, code, body) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': CORS,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
  })
  res.end(body === undefined ? '' : JSON.stringify(body))
}

async function readRawAndBody(req) {
  const chunks = []
  let size = 0
  for await (const c of req) {
    size += c.length
    if (size > 16_384) throw Object.assign(new Error('body_too_large'), { statusCode: 413 })
    chunks.push(c)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return { raw: '', body: {} }
  const ct = String(req.headers['content-type'] || '')
  if (ct.includes('application/x-www-form-urlencoded')) {
    return { raw, body: Object.fromEntries(new URLSearchParams(raw)) }
  }
  try {
    const body = JSON.parse(raw)
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid_json')
    return { raw, body }
  } catch {
    throw Object.assign(new Error('invalid_json'), { statusCode: 400 })
  }
}

function publicBase() {
  return String(process.env.ACCESS_PUBLIC_BASE || process.env.CORS_ORIGIN || 'https://neltud.github.io').replace(/\/$/, '')
}

async function handleRequest(req, res) {
  if (req.method === 'OPTIONS') { json(res, 204, {}); return }
  const u = new URL(req.url || '/', `http://127.0.0.1:${PORT}`)
  const pth = u.pathname.replace(/\/$/, '') || '/'

  if (req.method === 'GET' && pth === '/health') {
    json(res, 200, {
      ok: true,
      moonpay_configured: Boolean(MOONPAY.ready),
      moonpay_mode: MOONPAY.mode || 'off',
      stripe_configured: Boolean(STRIPE_KEY),
      paybox_configured: PAYBOX.ready,
      paybox_mode: PAYBOX.ready ? PAYBOX.mode : 'off',
      paybox_auth_outbound: 'hmac_sha512',
      paybox_auth_inbound: 'rsa_sha256_2048',
      paybox_ipn_policy: IPN_POLICY,
      lia_live_trading: process.env.LIA_LIVE_TRADING === '1' ? '1' : '0',
      service: 'access-api',
      packs: Object.keys(PACK_CATALOG),
    })
    return
  }

  if (req.method === 'POST' && pth === '/moonpay/sign') {
    const origin = String(req.headers.origin || '')
    if (origin && origin !== 'https://neltud.github.io' && !origin.startsWith('http://127.0.0.1') && !origin.startsWith('http://localhost')) {
      json(res, 403, { ok: false, error: 'origin_forbidden' })
      return
    }
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local').split(',')[0].trim()
    const now = Date.now()
    const hits = (moonpayHits.get(ip) || []).filter(t => now - t < MOONPAY_WINDOW_MS)
    if (hits.length >= MOONPAY_MAX) {
      json(res, 429, { ok: false, error: 'rate_limited' })
      return
    }
    hits.push(now)
    moonpayHits.set(ip, hits)
    const { body } = await readRawAndBody(req)
    try { json(res, 200, { ok: true, url: signMoonpayUrl(body.url, MOONPAY) }) }
    catch (error) {
      json(res, error.statusCode || 400, { ok: false, error: error.statusCode === 503 ? 'moonpay_not_configured' : 'invalid_moonpay_request' })
    }
    return
  }

  if (req.method === 'POST' && pth === '/v1/access/challenge') {
    const { body } = await readRawAndBody(req)
    try {
      const ch = createChallenge(typeof body.address === 'string' ? body.address.trim() : '')
      json(res, 200, { ok: true, ...ch, require_siwx: requireSiwx() })
    } catch { json(res, 400, { ok: false, error: 'invalid_or_unavailable_challenge' }) }
    return
  }

  if (req.method === 'POST' && (pth === '/v1/verify-access' || pth === '/api/verify-access')) {
    const { body } = await readRawAndBody(req)
    const address = typeof (body.address || body.wallet) === 'string' ? (body.address || body.wallet).trim() : ''
    const signature = body.signature || body.sig || ''
    const message = body.message || ''
    const nonce = body.nonce || ''
    const hasProof = Boolean(signature || message || nonce)
    const verified = hasProof && verifySignedChallenge({ address, signature, message, nonce })
    if ((requireSiwx() || hasProof) && !verified) {
      json(res, 401, { ok: false, status: 'SAMPLE', hasAccess: false, reason: 'siwx_invalid_or_missing_challenge' })
      return
    }
    const access = await resolveAccessLevel(address || null)
    if (access.status === 'FULL' && !verified) {
      json(res, 401, { ok: false, status: 'SAMPLE', hasAccess: false, reason: 'siwx_required_for_full_access' })
      return
    }
    const issued = issueAccessToken(access, address || null, JWT_SECRET)
    if (issued.error && access.status === 'FULL') {
      json(res, 503, { ok: false, error: issued.error, status: 'SAMPLE', hasAccess: false })
      return
    }
    json(res, 200, {
      ok: true, status: access.status, hasAccess: access.hasAccess, reason: access.reason,
      token: issued.token, expiresIn: issued.expiresIn || null,
    })
    return
  }

  if (req.method === 'POST' && pth === '/v1/checkout/paybox') {
    const { body } = await readRawAndBody(req)
    const packId = (body.pack_id || body.packId || '').trim()
    const artistRaw = typeof (body.artist_beneficiary || body.artistBeneficiary) === 'string'
      ? (body.artist_beneficiary || body.artistBeneficiary).trim() : ''
    try {
      const pack = getPack(packId)
      if (!PAYBOX.ready) {
        json(res, 501, {
          ok: false, error: 'paybox_not_configured', pack_id: pack.id, amount_cents: pack.price_cents,
          message: 'Paybox System merchant credentials missing. Fail-closed.',
        })
        return
      }
      const auth = resolveAuthenticatedBuyer({ headers: req.headers, body, jwtSecret: JWT_SECRET })
      if (!auth.ok) {
        json(res, auth.statusCode, { ok: false, error: auth.error })
        return
      }
      const buyer = auth.buyer
      let artist = null
      if (artistRaw) artist = resolveArtistBeneficiary(artistRaw)
      const orderId = newOrderId(pack.id, buyer)
      createOrder({
        order_id: orderId, pack_id: pack.id, amount_cents: pack.price_cents,
        buyer_address: buyer, artist_beneficiary: artist,
      })
      const origin = publicBase()
      const ipnUrl = process.env.PAYBOX_IPN_URL || `${origin}/v1/checkout/paybox/ipn`
      const session = createPayboxSession({
        pack, buyerAddress: buyer, orderId,
        successUrl: typeof body.success_url === 'string' ? body.success_url : `${origin}/xArtists/#/my-packs?order=${orderId}`,
        cancelUrl: typeof body.cancel_url === 'string' ? body.cancel_url : `${origin}/xArtists/#/my-packs?cancelled=1`,
        ipnUrl, email: typeof body.email === 'string' ? body.email : undefined,
      }, PAYBOX)
      markRedirected(orderId)
      json(res, 200, {
        ok: true, ...session, pack_id: pack.id, amount_eur: pack.price_cents / 100,
        artist_beneficiary: artist,
        artist_settlement: artist
          ? { merchant_capture: true, accounting_attribution: artist, payout: 'not_implemented' }
          : { merchant_capture: true, accounting_attribution: null, payout: 'n/a' },
        status: 'created',
      })
    } catch (e) {
      json(res, e.statusCode || 400, { ok: false, error: String(e.message || e) })
    }
    return
  }

  if ((req.method === 'POST' || req.method === 'GET') && pth === '/v1/checkout/paybox/ipn') {
    let raw = u.search ? u.search.slice(1) : ''
    let body = {}
    if (req.method === 'POST') {
      try {
        const r = await readRawAndBody(req)
        raw = r.raw || raw
        body = r.body
      } catch { body = {} }
    }
    const params = { ...Object.fromEntries(u.searchParams), ...body }
    const orderId = String(params.ref || params.R || params.PBX_CMD || '')
    const order = getOrder(orderId)
    if (!order) {
      json(res, 400, { ok: false, error: 'unknown_order', order_id: orderId || null })
      return
    }
    const rawSigned = extractRawSignedData(raw) || undefined
    const result = verifyPayboxIpn(
      params,
      order.amount_cents,
      { site: PAYBOX.site, devise: PAYBOX.devise },
      { rawSignedData: rawSigned }
    )
    if (!result.ok) {
      json(res, 400, { ok: false, error: result.reason, order_id: orderId })
      return
    }
    const applied = applyIpn({
      order_id: orderId,
      amount_cents: order.amount_cents,
      error_code: String(params.error || params.E || result.error || ''),
      authorization: result.authorization,
      provider_tx_id: result.provider_tx_id,
    })
    json(res, 200, {
      ok: applied.ok, order_id: orderId, status: applied.status,
      duplicate: Boolean(applied.duplicate), late: Boolean(applied.late),
      delivery: applied.delivery || 'none',
    })
    return
  }

  if (req.method === 'GET' && pth.startsWith('/v1/checkout/paybox/order/')) {
    const orderId = pth.slice('/v1/checkout/paybox/order/'.length).split('?')[0]
    const auth = resolveAuthenticatedBuyer({
      headers: req.headers,
      body: { buyer_address: u.searchParams.get('buyer') || undefined },
      jwtSecret: JWT_SECRET,
    })
    if (!auth.ok) {
      json(res, auth.statusCode, { ok: false, error: auth.error })
      return
    }
    try {
      const order = getOrderForBuyer(orderId, auth.buyer)
      if (!order) { json(res, 404, { ok: false, error: 'unknown_order' }); return }
      json(res, 200, {
        ok: true, order_id: order.order_id, pack_id: order.pack_id, amount_cents: order.amount_cents,
        status: order.status, delivery: order.delivery, server_confirmed: order.status === 'paid',
      })
    } catch (e) {
      json(res, e.statusCode || 403, { ok: false, error: String(e.message || e) })
    }
    return
  }

  if (req.method === 'GET' && pth === '/v1/checkout/paybox') {
    json(res, 405, { ok: false, error: 'method_not_allowed' })
    return
  }

  if (req.method === 'GET' && pth === '/v1/access/introspect') {
    const auth = String(req.headers.authorization || '')
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
    if (!token || !JWT_SECRET || JWT_SECRET.length < 16) {
      json(res, 401, { ok: false, error: 'missing_or_invalid_token' })
      return
    }
    const payload = verifyJwt(token, JWT_SECRET)
    if (!payload) {
      json(res, 401, { ok: false, error: 'invalid_or_expired_token' })
      return
    }
    json(res, 200, { ok: true, sub: payload.sub || null, status: payload.status || null, exp: payload.exp || null })
    return
  }

  json(res, 404, { error: 'not_found', path: pth })
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch(error => {
    if (!res.headersSent) json(res, error.statusCode || 500, { ok: false, error: error.statusCode ? error.message : 'internal_error' })
    else res.end()
  })
})

server.listen(PORT, () => {
  console.log(`access-api :${server.address().port} paybox=${PAYBOX.ready} ipn=${IPN_POLICY.algorithm}/${IPN_POLICY.keySize}`)
})
