/**
 * Access API — SIWX (default ON), JWT, prices cache, RAG, signals.
 */
import http from 'node:http'
import { URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveAccessLevel, issueAccessToken, verifyJwt } from './verifyAccess.mjs'
import {
  createChallenge,
  consumeNonce,
  verifyErdSignature,
  requireSiwx,
} from './siwx.mjs'
import { queryMasterclassRag } from './ragQuery.mjs'
import { getPrices } from './pricesCache.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 8787)
const CORS = process.env.CORS_ORIGIN || '*'
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

function loadDailySignal() {
  for (const p of [
    path.resolve(__dirname, '../../../data/signals/daily_signal.json'),
    path.resolve(__dirname, '../../data/signals/daily_signal.json'),
  ]) {
    try {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'))
    } catch {
      /* */
    }
  }
  return { schema: 'xartists_daily_signal/v1', headline: 'Signal non généré', disclaimer: 'Pas un conseil financier.' }
}

function sampleDeny(reason, extra = {}) {
  return {
    ok: false,
    status: 'SAMPLE',
    hasAccess: false,
    reason,
    ...extra,
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
      rag: true,
      prices: true,
      service: 'access-api',
    })
    return
  }

  if (req.method === 'POST' && pth === '/v1/access/challenge') {
    const body = await readBody(req)
    const ch = createChallenge((body.address || '').trim() || null)
    json(res, 200, { ok: true, ...ch, require_siwx: requireSiwx() })
    return
  }

  if (req.method === 'POST' && pth === '/v1/verify-access') {
    const body = await readBody(req)
    const address = (body.address || body.wallet || '').trim()
    const signature = body.signature || body.sig || ''
    const message = body.message || ''
    const nonce = body.nonce || ''

    // STRICT SIWX (default): unsigned → SAMPLE, never crash
    if (requireSiwx()) {
      if (!address || !signature || !message) {
        json(res, 401, sampleDeny('siwx_required', { error: 'signature + message required' }))
        return
      }
      if (nonce && !consumeNonce(nonce, address)) {
        json(res, 401, sampleDeny('siwx_nonce_invalid'))
        return
      }
      if (!verifyErdSignature(address, message, signature)) {
        json(res, 401, sampleDeny('siwx_bad_signature'))
        return
      }
    } else if (signature && message && address) {
      if (nonce && !consumeNonce(nonce, address)) {
        json(res, 401, sampleDeny('siwx_nonce_invalid'))
        return
      }
      if (!verifyErdSignature(address, message, signature)) {
        json(res, 401, sampleDeny('siwx_bad_signature'))
        return
      }
    }

    const access = await resolveAccessLevel(address || null)
    const issued = issueAccessToken(access, address || null, JWT_SECRET)
    if (issued.error && access.status === 'FULL') {
      json(res, 503, sampleDeny('jwt_secret_not_configured', { error: issued.error }))
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

  if (req.method === 'GET' && pth === '/v1/prices') {
    try {
      const prices = await getPrices()
      json(res, 200, prices)
    } catch (e) {
      json(res, 502, { ok: false, error: e?.message || 'prices_failed' })
    }
    return
  }

  if (req.method === 'POST' && pth === '/v1/rag/query') {
    const body = await readBody(req)
    const out = queryMasterclassRag(body)
    json(res, out.ok ? 200 : 400, out)
    return
  }

  if (req.method === 'GET' && pth === '/v1/masterclass/da_vinci_sfumato') {
    try {
      const p = path.resolve(__dirname, '../../../data/masterclasses/da_vinci_sfumato.json')
      json(res, 200, { ok: true, masterclass: JSON.parse(fs.readFileSync(p, 'utf8')) })
    } catch {
      json(res, 404, { ok: false, error: 'masterclass_not_found' })
    }
    return
  }

  json(res, 404, { error: 'not_found', path: pth })
})

server.listen(PORT, () => {
  console.log(`access-api :${PORT} siwx=${requireSiwx()} (default ON) prices+rag`)
})
