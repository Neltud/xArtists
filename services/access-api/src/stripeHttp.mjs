import { createStripeSandboxService, stripeSandboxConfig } from './stripeCheckout.mjs'
import { createStripePgStore } from './stripeStore.mjs'

let service
async function runtimeService() {
  if (!service) {
    const { default: pg } = await import('pg')
    const pool = new pg.Pool({ connectionString: process.env.STRIPE_SANDBOX_DATABASE_URL,
      ssl: process.env.PGSSL === '0' ? false : { rejectUnauthorized: true },
      max: 3, connectionTimeoutMillis: 4000, statement_timeout: 5000 })
    service = createStripeSandboxService({ store: createStripePgStore(pool) })
  }
  return service
}

export async function handleStripe(req, res, ctx) {
  const { path, json, readRawAndBody, verifyJwt, erdToPubkey, jwtSecret, originAllowed } = ctx
  if (path === '/v1/stripe/config' && req.method === 'GET') {
    json(res, 200, { ok: true, ...stripeSandboxConfig() }); return true
  }
  // Legacy public frontend endpoint is explicitly unavailable until activation review.
  if (path === '/v1/checkout/session') {
    json(res, 503, { ok: false, error: 'stripe_live_checkout_not_approved' }); return true
  }
  if (!['/v1/stripe/sandbox/session', '/v1/webhooks/stripe/sandbox'].includes(path)) return false
  if (req.method !== 'POST') { json(res, 405, { ok: false, error: 'method_not_allowed' }); return true }
  const config = stripeSandboxConfig()
  if (path.endsWith('/sandbox/session')) {
    if (!originAllowed(String(req.headers.origin || ''))) {
      json(res, 403, { ok: false, error: 'origin_not_allowed' }); return true
    }
    const auth = String(req.headers.authorization || '')
    const payload = jwtSecret.length >= 16 && verifyJwt(auth.startsWith('Bearer ') ? auth.slice(7) : '', jwtSecret)
    let buyer
    try {
      if (!payload || payload.iss !== 'xartists-access-api' || payload.wallet_proof_verified !== true) throw new Error()
      erdToPubkey(payload.sub)
      buyer = payload.sub
    } catch { json(res, 401, { ok: false, error: 'wallet_auth_required' }); return true }
    if (!config.checkout_enabled) { json(res, 503, { ok: false, error: 'stripe_sandbox_checkout_disabled' }); return true }
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) {
      json(res, 415, { ok: false, error: 'json_required' }); return true
    }
    const { body } = await readRawAndBody(req)
    if (Object.keys(body).sort().join(',') !== 'pack_id,request_id') {
      json(res, 400, { ok: false, error: 'invalid_checkout_request' }); return true
    }
    try { json(res, 200, await (await runtimeService()).checkout({ ...body, buyer })) }
    catch (e) { json(res, e.statusCode || 503, { ok: false, error: e.statusCode ? e.message : 'stripe_sandbox_unavailable' }) }
    return true
  }
  if (!config.webhook_ready) { json(res, 503, { ok: false, error: 'stripe_sandbox_webhook_disabled' }); return true }
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 262144) { json(res, 413, { ok: false, error: 'body_too_large' }); return true }
    chunks.push(chunk)
  }
  try { json(res, 200, await (await runtimeService()).webhook(Buffer.concat(chunks), req.headers['stripe-signature'])) }
  catch (e) { json(res, e.statusCode || 503, { ok: false, error: e.statusCode ? e.message : 'stripe_sandbox_reconciliation_required' }) }
  return true
}
