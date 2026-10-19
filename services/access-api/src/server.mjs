/**
 * Access API — verify-access JWT, SIWX challenge, daily signals, checkout stubs.
 * Sprint 1: POST /v1/verify-access and alias /api/verify-access
 *
 * Stripe / PayBox: server-side only. Never put secrets in frontend.
 * Price source of truth: services/access_pack/catalog.py (mirrored here for Node).
 * See docs/AUDIT_GROK_2026-10-17.md + issue [P1] Stripe.
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveAccessLevel, issueAccessToken, verifyJwt } from './verifyAccess.mjs'
import { createChallenge, consumeNonce, verifyErdSignature, requireSiwx } from './siwx.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 8787)
const JWT_SECRET = process.env.ACCESS_JWT_SECRET || process.env.JWT_SECRET || ''
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || ''
const CORS = process.env.CORS_ORIGIN || '*'

/** Server-side pack catalog — NEVER trust client amount_cents / amountEur */
const PACK_CATALOG = {
  pulse: { id: 'pulse', name: 'Pulse Pack (Gold)', price_eur: 110, price_cents: 11000 },
  yield: { id: 'yield', name: 'Yield Pack (Silver)', price_eur: 75, price_cents: 7500 },
  sentinel: { id: 'sentinel', name: 'Sentinel Pack (Platinum)', price_eur: 50, price_cents: 5000 },
}

function getPack(packId) {
  const p = PACK_CATALOG[(packId || '').toLowerCase()]
  if (!p) throw new Error(`unknown pack_id: ${packId}`)
  return p
}

function json(res, code, body) {
  const data = body === undefined ? '' : JSON.stringify(body)
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': CORS,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
  })
  res.end(data)
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

function loadDailySignal() {
  const candidates = [
    path.resolve(__dirname, '../../../data/signals/daily_signal.json'),
    path.resolve(__dirname, '../../data/signals/daily_signal.json'),
    process.env.DAILY_SIGNAL_PATH,
  ].filter(Boolean)
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'))
    } catch {
      /* */
    }
  }
  return {
    schema: 'xartists_daily_signal/v1',
    headline: 'Signal non généré',
    summary: 'Lancer signals-worker/generate_daily_signal.py',
    disclaimer: 'Pas un conseil financier.',
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    json(res, 204, {})
    return
  }

  const u = new URL(req.url || '/', `http://127.0.0.1:${PORT}`)
  const pth = u.pathname.replace(/\/$/, '') || '/'

  if (req.method === 'GET' && pth === '/health') {
    json(res, 200, {
      ok: true,
      jwt: Boolean(JWT_SECRET && JWT_SECRET.length >= 16),
      require_siwx: requireSiwx(),
      pulse_collection: Boolean(process.env.PULSE_COLLECTION),
      stripe_configured: Boolean(STRIPE_KEY),
      service: 'access-api',
      packs: Object.keys(PACK_CATALOG),
    })
    return
  }

  if (req.method === 'POST' && pth === '/v1/access/challenge') {
    const body = await readBody(req)
    const address = (body.address || '').trim()
    const ch = createChallenge(address || null)
    json(res, 200, { ok: true, ...ch, require_siwx: requireSiwx() })
    return
  }

  if (req.method === 'POST' && (pth === '/v1/verify-access' || pth === '/api/verify-access')) {
    const body = await readBody(req)
    const address = (body.address || body.wallet || '').trim()
    const signature = body.signature || body.sig || ''
    const message = body.message || ''
    const nonce = body.nonce || ''

    if (requireSiwx()) {
      if (!address || !signature || !message) {
        json(res, 401, {
          ok: false,
          status: 'SAMPLE',
          hasAccess: false,
          reason: 'siwx_required',
          error: 'signature + message required',
        })
        return
      }
      if (nonce && !consumeNonce(nonce, address)) {
        json(res, 401, {
          ok: false,
          status: 'SAMPLE',
          hasAccess: false,
          reason: 'siwx_nonce_invalid',
        })
        return
      }
      if (!verifyErdSignature(address, message, signature)) {
        json(res, 401, {
          ok: false,
          status: 'SAMPLE',
          hasAccess: false,
          reason: 'siwx_bad_signature',
        })
        return
      }
    } else if (signature && message && address) {
      if (nonce && !consumeNonce(nonce, address)) {
        json(res, 401, { ok: false, status: 'SAMPLE', hasAccess: false, reason: 'siwx_nonce_invalid' })
        return
      }
      if (!verifyErdSignature(address, message, signature)) {
        json(res, 401, { ok: false, status: 'SAMPLE', hasAccess: false, reason: 'siwx_bad_signature' })
        return
      }
    }

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
      access_level: access.status,
      hasAccess: access.hasAccess,
      reason: access.reason,
      expiryDate: access.expiryDate,
      source: access.source,
      identifier: access.identifier || null,
      token: issued.token,
      expiresIn: issued.expiresIn || null,
      sampleLessonId: 'sample_01',
      packId: 'pulse_pack_v1',
      siwx: requireSiwx() ? 'required' : 'optional',
    })
    return
  }

  if (req.method === 'GET' && pth === '/v1/access/introspect') {
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

  if (req.method === 'GET' && pth === '/v1/signals/daily') {
    json(res, 200, { ok: true, signal: loadDailySignal() })
    return
  }

  if (req.method === 'POST' && pth === '/v1/checkout/session') {
    const body = await readBody(req)
    const packId = (body.pack_id || body.packId || '').trim()

    if (!STRIPE_KEY) {
      json(res, 501, {
        ok: false,
        error: 'STRIPE_SECRET_KEY not set',
        hint: 'Configure secret in vault / env only. Never ship to frontend.',
        pack_id: packId || null,
      })
      return
    }

    // TODO [P1]: integrate stripe SDK (create Checkout Session for Pulse/Yield/Sentinel)
    // Do not return a fake session URL. Fail closed until implemented.
    // Price is always taken from server catalog, never from client body.
    try {
      const pack = getPack(packId)
      json(res, 501, {
        ok: false,
        error: 'stripe_sdk_not_implemented',
        message: 'Stripe Checkout Session creation is not wired yet. See issue [P1] and AUDIT_GROK_2026-10-17.',
        pack_id: pack.id,
        amount_cents: pack.price_cents, // server price only
      })
    } catch (e) {
      json(res, 400, { ok: false, error: String(e.message || e) })
    }
    return
  }

  // PayBox / e-Transactions — price ALWAYS from server catalog. Client amount_cents is ignored.
  if (req.method === 'POST' && pth === '/v1/checkout/paybox') {
    const body = await readBody(req)
    const packId = (body.pack_id || body.packId || '').trim()

    try {
      const pack = getPack(packId)
      // No merchant HMAC / IPN verification yet: refuse checkout instead of
      // returning a misleading HTTP 200 and a fake order reference.
      json(res, 501, {
        ok: false,
        error: 'paybox_not_implemented',
        pack_id: pack.id,
        amount_cents: pack.price_cents,
        message: 'Paybox checkout is unavailable until signed sessions and verified IPN are implemented.',
      })
    } catch (e) {
      json(res, 400, { ok: false, error: String(e.message || e) })
    }
    return
  }

  // Block direct GET with amount params (legacy openPayboxCheckout bypass)
  if (req.method === 'GET' && (pth === '/v1/checkout/paybox' || pth.includes('paybox'))) {
    json(res, 405, {
      ok: false,
      error: 'method_not_allowed',
      message: 'PayBox checkout must be initiated via POST /v1/checkout/paybox. Amount is server-side only.',
    })
    return
  }

  json(res, 404, { error: 'not_found', path: pth })
})

server.listen(PORT, () => {
  console.log(`access-api :${PORT} siwx=${requireSiwx()} stripe=${Boolean(STRIPE_KEY)} packs=${Object.keys(PACK_CATALOG).join(',')}`)
})
