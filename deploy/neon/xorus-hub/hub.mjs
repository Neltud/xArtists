import { randomUUID, timingSafeEqual } from 'node:crypto'
import { ORGANIZATION, platformRegistry, walletRoutePlan } from './registry.mjs'
import { boundedText, probePlatforms } from './probes.mjs'

const ORIGINS = new Set(['https://xartists.art', 'https://www.xartists.art'])
const SAFETY = Object.freeze({ mode: 'read_only', execution_authorized: false,
  trading_enabled: false, executable: false, signing_authorized: false,
  custody_enabled: false, payment_authorized: false, independently_verified_market_signals: 0,
  stance: 'ABSTAIN', confidence: null, model_inference_configured: false })

function reply(request, status, payload) {
  const headers = new Headers({ 'content-type': 'application/json; charset=utf-8',
    'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer', 'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
    vary: 'Origin' })
  const origin = request.headers.get('origin')
  if (ORIGINS.has(origin)) {
    headers.set('access-control-allow-origin', origin)
    headers.set('access-control-allow-methods', 'GET, HEAD, POST, OPTIONS')
    headers.set('access-control-allow-headers', 'authorization, content-type')
  }
  if (status === 405) headers.set('allow', 'GET, HEAD, OPTIONS')
  if (status === 204) headers.delete('content-type')
  return new Response(request.method === 'HEAD' || status === 204 ? null : JSON.stringify(payload), { status, headers })
}

function isOperator(request, env) {
  const expected = env.XORUS_HUB_OPERATOR_TOKEN
  if (typeof expected !== 'string' || expected.length < 43 || expected.length > 128) return false
  const provided = request.headers.get('authorization') || ''
  const value = 'Bearer ' + expected
  if (provided.length !== value.length) return false
  const actualBytes = Buffer.from(provided)
  const expectedBytes = Buffer.from(value)
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes)
}

export function createHub({ env = process.env, store = null, parseTrigger = null,
  fetchImpl = fetch, clock = Date.now } = {}) {
  const sha = /^[0-9a-f]{40}$/.test(env.XARTISTS_SOURCE_SHA || '') ? env.XARTISTS_SOURCE_SHA : null
  const source = { service: 'xorus-platform-hub', organization_id: ORGANIZATION,
    environment: 'sandbox', production_access_api: false, source_sha: sha }
  const correctTarget = env.NEON_BRANCH_ID === 'br-steep-sun-bab7l93p' && env.XORUS_HUB_TARGET_CONFIRMED === 'orange-dust-23862418'

  async function cycle(slot, claimId) {
    if (!correctTarget || !store) throw new Error('hub_store_not_configured')
    if (!await store.claim(slot, claimId)) return { ok: true, skipped: true, reason: 'already_claimed_or_recent_cycle', ...SAFETY }
    const probes = await probePlatforms({ fetchImpl, clock })
    const snapshot = { ...source, ...SAFETY, checked_at: new Date(clock()).toISOString(),
      scheduled_at: slot, probes, rights_status: 'no_market_data_used_or_commercially_licensed',
      linked_wallets: 0, region_is_not_user_eligibility: true }
    await store.finish(slot, claimId, snapshot)
    return { ok: true, snapshot }
  }

  return Object.freeze({
    async fetch(request) {
      if (!(request instanceof Request)) return new Response(null, { status: 400 })
      const origin = request.headers.get('origin')
      if (origin && !ORIGINS.has(origin)) return reply(request, 403, { ok: false, error: 'origin_not_allowed' })
      const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/'
      if (request.method === 'OPTIONS') return reply(request, 204, null)
      if (path === '/v1/xorus/cron') {
        if (request.method !== 'POST') return reply(request, 405, { ok: false, error: 'method_not_allowed' })
        if (!request.headers.has('x-neon-trigger-invocation-id') || typeof parseTrigger !== 'function')
          return reply(request, 401, { ok: false, error: 'neon_trigger_required' })
        // Neon strips client x-neon-* headers. This route is only deployable behind that native proxy.
        if (Number(request.headers.get('content-length')) > 4096) return reply(request, 413, { ok: false, error: 'body_too_large' })
        let parsed
        try {
          const raw = await boundedText(new Response(request.body), 4096)
          parsed = parseTrigger({ headers: request.headers, body: JSON.parse(raw) })
        } catch { return reply(request, 400, { ok: false, error: 'invalid_trigger' }) }
        const invocation = parsed?.invocation
        if (!parsed?.ok || invocation?.type !== 'schedule' || invocation.trigger?.name !== 'xorus-hub-hourly')
          return reply(request, 401, { ok: false, error: 'unrecognized_trigger' })
        const time = Date.parse(invocation.data?.scheduledAt)
        if (!Number.isFinite(time) || Math.abs(time - clock()) > 600_000)
          return reply(request, 400, { ok: false, error: 'stale_trigger' })
        try { return reply(request, 200, await cycle(new Date(Math.floor(time / 3_600_000) * 3_600_000).toISOString(), invocation.invocationId)) }
        catch { return reply(request, 503, { ok: false, error: 'probe_cycle_unavailable', ...SAFETY }) }
      }
      if (path === '/v1/xorus/wallet-route' && request.method === 'POST') {
        if (!(request.headers.get('content-type') || '').startsWith('application/json'))
          return reply(request, 415, { ok: false, error: 'application_json_required' })
        try {
          const input = JSON.parse(await boundedText(new Response(request.body), 1024))
          const plan = walletRoutePlan(input)
          return reply(request, plan.ok ? 200 : 400, plan)
        } catch { return reply(request, 400, { ok: false, error: 'invalid_or_oversize_plan' }) }
      }
      if (path === '/v1/xorus/probe' && request.method === 'POST') {
        if (!isOperator(request, env)) return reply(request, 401, { ok: false, error: 'operator_required' })
        try { return reply(request, 200, await cycle(new Date(Math.floor(clock() / 3_600_000) * 3_600_000).toISOString(), randomUUID())) }
        catch { return reply(request, 503, { ok: false, error: 'probe_cycle_unavailable', ...SAFETY }) }
      }
      if (['/v1/xorus/orders', '/v1/xorus/swap', '/v1/xorus/bet', '/v1/xorus/execute', '/v1/xorus/sign'].includes(path))
        return reply(request, 503, { ok: false, error: 'execution_not_implemented', ...SAFETY })
      if (!['GET', 'HEAD'].includes(request.method)) return reply(request, 405, { ok: false, error: 'method_not_allowed' })
      if (path === '/' || path === '/health') return reply(request, 200, { ok: true, ...source, ...SAFETY,
        store_target_confirmed: correctTarget, probe_schedule: '17 * * * *',
        schedule_state: 'query_provider_trigger_for_actual_state', linked_wallets: 0,
        endpoints: ['/v1/xorus/platforms', '/v1/xorus/snapshot', '/v1/xorus/wallet-route'] })
      if (path === '/v1/xorus/platforms') return reply(request, 200, { ok: true, ...platformRegistry() })
      if (path === '/v1/xorus/snapshot') {
        if (!isOperator(request, env)) return reply(request, 401, { ok: false, error: 'operator_required' })
        if (!correctTarget || !store) return reply(request, 503, { ok: false, error: 'hub_store_not_configured' })
        try {
          const snapshot = await store.read()
          if (!snapshot) return reply(request, 503, { ok: false, error: 'no_probe_receipt' })
          const age = clock() - Date.parse(snapshot.checked_at)
          const fresh = Number.isFinite(age) && age >= 0 && age <= 5_400_000
          return reply(request, fresh ? 200 : 503, { ok: fresh, stale: !fresh, snapshot })
        } catch { return reply(request, 503, { ok: false, error: 'hub_store_unavailable' }) }
      }
      return reply(request, 404, { ok: false, error: 'route_not_available' })
    },
  })
}
