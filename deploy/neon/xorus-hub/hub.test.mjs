import test from 'node:test'
import assert from 'node:assert/strict'
import { parseTriggerDelivery } from '@neon/functions/triggers'
import { createHub } from './hub.mjs'
import { probePlatforms, boundedText } from './probes.mjs'
import { platformRegistry, walletRoutePlan } from './registry.mjs'
import { createPostgresStore } from './postgres.mjs'

const NOW = Date.parse('2026-11-21T18:17:00Z')
const TOKEN = 'test_only_' + 'a'.repeat(48)
const env = { NEON_BRANCH_ID: 'br-steep-sun-bab7l93p',
  XORUS_HUB_TARGET_CONFIRMED: 'orange-dust-23862418', XORUS_HUB_OPERATOR_TOKEN: TOKEN,
  XARTISTS_SOURCE_SHA: '1'.repeat(40), XORUS_ASSISTED_SWAP_ENABLED: '1', LIA_LIVE_TRADING: '1' }
const call = (hub, path, options) => hub.fetch(new Request('https://hub.invalid' + path, options))
const auth = { authorization: 'Bearer ' + TOKEN }
const happyFetch = async url => {
  if (url.includes('mempool')) return new Response('950000')
  if (url.includes('solana')) return Response.json({ jsonrpc: '2.0', id: 1, result: 400000000 })
  if (url.includes('kraken')) return Response.json({ error: [], result: { unixtime: NOW / 1000 } })
  return Response.json(NOW / 1000)
}
function memoryStore() {
  let claimed = false, snapshot = null
  return { async claim() { if (claimed) return false; claimed = true; return true },
    async finish(slot, id, value) { snapshot = value }, async read() { return snapshot } }
}
function make(options = {}) {
  return createHub({ env, clock: () => NOW, store: memoryStore(), fetchImpl: happyFetch,
    parseTrigger: parseTriggerDelivery, ...options })
}

test('all platforms share one logical org; provider accounts and wallet ownership stay explicit', () => {
  const registry = platformRegistry()
  assert.equal(registry.organization_id, 'xartists')
  assert.equal(registry.provider_account_merge_performed, false)
  assert.equal(registry.linked_wallets, 0)
  assert.equal(registry.platforms.find(p => p.id === 'metawin').integration, 'manual_only')
  assert.equal(registry.platforms.find(p => p.id === 'kraken').account_api_required, true)
  registry.platforms[0].networks.push('bad')
  assert.deepEqual(platformRegistry().platforms[0].networks, ['bitcoin'])
})

test('wallet routes distinguish chain compatibility, CEX accounts, and unproved connections', () => {
  const plan = walletRoutePlan({ platform: 'jupiter', network: 'solana' })
  assert.equal(plan.wallet_family, 'solana')
  assert.equal(plan.connected, false)
  assert.equal(plan.ownership_verified, false)
  assert.equal(plan.executable, false)
  assert.equal(plan.server_region_grants_eligibility, false)
  assert.equal(walletRoutePlan({ platform: 'kraken', network: 'bitcoin' }).error, 'exchange_account_api_required')
  assert.equal(walletRoutePlan({ platform: 'metawin', network: 'bitcoin' }).error, 'network_not_supported')
  assert.equal(walletRoutePlan({ platform: 'polymarket', network: 'solana' }).ok, false)
})

test('wallet planning rejects secrets, addresses, arbitrary URLs and prototype keys', async () => {
  const hub = make()
  for (const extra of ['private_key', 'seed', 'mnemonic', 'address', 'rpc_url', 'signature', 'organization_id']) {
    const res = await call(hub, '/v1/xorus/wallet-route', { method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ platform: 'solana', network: 'solana', [extra]: 'never-retain-this' }) })
    assert.equal(res.status, 400)
    assert.equal((await res.text()).includes('never-retain-this'), false)
  }
  assert.equal(walletRoutePlan({ platform: 'solana', network: '__proto__' }).ok, false)
})

test('health and registry do no external or database work and never enable execution', async () => {
  const fail = () => { throw new Error('unexpected access') }
  const hub = make({ store: { read: fail, claim: fail }, fetchImpl: fail })
  const health = await (await call(hub, '/health')).json()
  assert.equal(health.source_sha, '1'.repeat(40))
  assert.equal(health.execution_authorized, false)
  assert.equal(health.stance, 'ABSTAIN')
  assert.equal(health.model_inference_configured, false)
  assert.equal((await call(hub, '/v1/xorus/platforms')).status, 200)
  const head = await call(hub, '/health', { method: 'HEAD' })
  assert.equal(await head.text(), '')
})

test('every execution method refuses before parsing any order or reaching upstream', async () => {
  const hub = make({ fetchImpl: () => assert.fail('must not reach upstream') })
  for (const path of ['orders', 'swap', 'bet', 'execute', 'sign']) {
    for (const method of ['GET', 'POST', 'PUT']) {
      const res = await call(hub, '/v1/xorus/' + path, { method })
      assert.equal(res.status, 503)
      assert.equal((await res.json()).executable, false)
    }
  }
})

test('CORS rejects foreign origins; preflight and errors preserve approved-origin headers', async () => {
  const hub = make()
  assert.equal((await call(hub, '/health', { headers: { origin: 'https://evil.invalid' } })).status, 403)
  const preflight = await call(hub, '/v1/xorus/wallet-route', { method: 'OPTIONS', headers: { origin: 'https://xartists.art' } })
  assert.equal(preflight.status, 204)
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://xartists.art')
  const denied = await call(hub, '/v1/xorus/snapshot', { headers: { origin: 'https://xartists.art' } })
  assert.equal(denied.status, 401)
  assert.equal(denied.headers.get('access-control-allow-origin'), 'https://xartists.art')
})

test('operator authentication happens before DB access; malformed UTF8 tokens fail closed', async () => {
  const hub = make({ store: { read: () => assert.fail('DB used before auth') } })
  for (const authorization of ['', 'Bearer wrong', 'Bearer ' + 'é'.repeat(TOKEN.length)]) {
    assert.equal((await call(hub, '/v1/xorus/snapshot', { headers: { authorization } })).status, 401)
  }
})

test('single cycle stores only technical receipts; duplicate work is skipped', async () => {
  const hub = make()
  const res = await call(hub, '/v1/xorus/probe', { method: 'POST', headers: auth })
  const first = await res.json()
  assert.equal(res.status, 200)
  assert.equal(first.snapshot.probes.length, 4)
  assert.ok(first.snapshot.probes.every(p => p.status === 'reachable' && p.executable === false))
  assert.equal(first.snapshot.stance, 'ABSTAIN')
  assert.equal(first.snapshot.confidence, null)
  assert.equal(first.snapshot.independently_verified_market_signals, 0)
  const text = JSON.stringify(first)
  for (const upstream of ['950000', '400000000', 'unixtime']) assert.equal(text.includes(upstream), false)
  assert.equal((await (await call(hub, '/v1/xorus/probe', { method: 'POST', headers: auth })).json()).skipped, true)
  assert.equal((await call(hub, '/v1/xorus/snapshot', { headers: auth })).status, 200)
})

test('wrong sandbox and missing stores cannot probe or return a ready snapshot', async () => {
  for (const options of [{ env: { ...env, NEON_BRANCH_ID: 'br-other' } }, { store: null }]) {
    const hub = make({ ...options, fetchImpl: () => assert.fail('wrong target reached upstream') })
    assert.equal((await call(hub, '/v1/xorus/probe', { method: 'POST', headers: auth })).status, 503)
    assert.equal((await call(hub, '/v1/xorus/snapshot', { headers: auth })).status, 503)
  }
})

test('missing, expired and future receipts never report fresh data', async () => {
  for (const snapshot of [null, { checked_at: 'invalid' }, { checked_at: new Date(NOW - 5_400_001).toISOString() }, { checked_at: new Date(NOW + 1).toISOString() }]) {
    const hub = make({ store: { read: async () => snapshot } })
    assert.equal((await call(hub, '/v1/xorus/snapshot', { headers: auth })).status, 503)
  }
})

function triggerRequest(overrides = {}) {
  return { method: 'POST', headers: { 'content-type': 'application/json', 'x-neon-trigger-invocation-id': 'inv-1' },
    body: JSON.stringify({ version: 1, invocation_id: 'inv-1',
      trigger: { type: 'schedule', id: 'trigger-test', name: 'xorus-hub-hourly' },
      data: { scheduled_at: new Date(NOW).toISOString() }, ...overrides }) }
}

test('trigger parser accepts a matching native schedule and does not require an operator token', async () => {
  const res = await call(make(), '/v1/xorus/cron', triggerRequest())
  assert.equal(res.status, 200)
  assert.equal((await res.json()).snapshot.probes.length, 4)
})

test('missing, mismatched, stale and unrelated trigger deliveries do no work', async () => {
  const hub = make({ store: { claim: () => assert.fail('untrusted trigger reached DB') } })
  assert.equal((await call(hub, '/v1/xorus/cron', { method: 'POST' })).status, 401)
  assert.equal((await call(hub, '/v1/xorus/cron', triggerRequest({ invocation_id: 'wrong' }))).status, 401)
  assert.equal((await call(hub, '/v1/xorus/cron', triggerRequest({ data: { scheduled_at: new Date(NOW - 600_001).toISOString() } }))).status, 400)
  assert.equal((await call(hub, '/v1/xorus/cron', triggerRequest({ trigger: { type: 'schedule', id: 'other', name: 'other' } }))).status, 401)
})

test('network failure, stale time, RPC errors, oversized data and 429 never produce reachability', async () => {
  const badResponses = [() => { throw new Error('offline') },
    () => Response.json({ error: { message: 'bad' } }),
    () => new Response('0'), () => new Response('x'.repeat(8193)),
    () => new Response('rate limited', { status: 429 })]
  for (const f of badResponses) {
    const receipts = await probePlatforms({ fetchImpl: f, clock: () => NOW })
    assert.ok(receipts.every(p => p.status === 'unavailable' && p.executable === false))
  }
})

test('only fixed technical requests are sent, with bounded timeouts and no redirects', async () => {
  const requests = []
  await probePlatforms({ clock: () => NOW, fetchImpl: async (url, options) => {
    requests.push({ url, options }); return happyFetch(url)
  } })
  assert.equal(requests.length, 4)
  assert.ok(requests.every(r => r.options.redirect === 'error' && r.options.signal instanceof AbortSignal))
  const post = requests.filter(r => r.options.method === 'POST')
  assert.equal(post.length, 1)
  assert.equal(JSON.parse(post[0].options.body).method, 'getSlot')
  await assert.rejects(() => boundedText(new Response('big', { headers: { 'content-length': '99999' } })))
})

test('database admission and lease loss use atomic parameterized queries', async () => {
  const queries = []
  const store = createPostgresStore({ query: async (sql, values) => { queries.push({ sql, values }); return { rowCount: 0, rows: [] } } })
  assert.equal(await store.claim('2026-11-21T18:00:00Z', 'inv-1'), false)
  assert.match(queries[0].sql, /ON CONFLICT/)
  assert.match(queries[0].sql, /55 minutes/)
  assert.deepEqual(queries[0].values, ['xartists', 'inv-1', '2026-11-21T18:00:00Z'])
  await assert.rejects(() => store.finish('2026-11-21T18:00:00Z', 'inv-1', {}), /probe_lease_lost/)
  assert.equal(await store.read(), null)
})
