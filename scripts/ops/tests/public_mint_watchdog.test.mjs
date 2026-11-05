import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evaluatePublicMintReadiness, runPublicMintWatchdog, PROBE_URLS } from '../public_mint_watchdog.mjs'

function fixture() {
  return {
    health: {
      ok: true, service: 'access-api', orders_backend: 'postgres',
      paybox_checkout_enabled: false, mint_dispatch_enabled: false,
      mint_live_enabled: false, mint_dry_run: true,
      lia_live_trading: '0', tro_solana_bridge: 'off',
      auction_enabled: false, auction_settle: false,
    },
    orders: { ok: true, backend: 'postgres', table_ready: true },
    mint: { ok: true, backend: 'postgres', table_ready: true },
    frontend: {
      renderer: 'sites-v3', source_sha: 'a'.repeat(40),
      base_url: '/xArtists/', public_route_count: 116,
      lia_live_trading: false,
    },
  }
}

test('public health and both PostgreSQL stores pass only in browse-only mode', () => {
  const data = fixture()
  const before = JSON.stringify(data)
  const result = evaluatePublicMintReadiness(data)
  assert.equal(result.ok, true)
  assert.deepEqual(result.failures, [])
  assert.equal(result.scope, 'browse_only_readiness_not_nft_delivery')
  assert.equal(Object.hasOwn(result, 'delivery_verified'), false)
  assert.equal(JSON.stringify(data), before)
})

test('missing mint table, postgres disconnect, or missing orders always fails', () => {
  for (const change of [
    { mint: { ok: false, backend: 'postgres', table_ready: false } },
    { mint: { ok: true, backend: 'file', table_ready: true } },
    { orders: null },
    { health: { ...fixture().health, orders_backend: 'file' } },
  ]) {
    assert.equal(evaluatePublicMintReadiness({ ...fixture(), ...change }).ok, false)
  }
})

test('commercial or chain-activity flags must remain closed', () => {
  const variants = [
    { paybox_checkout_enabled: true },
    { mint_dispatch_enabled: true },
    { mint_live_enabled: true },
    { mint_dry_run: false },
    { lia_live_trading: '1' },
    { tro_solana_bridge: 'live' },
    { auction_enabled: true },
    { auction_settle: true },
  ]
  for (const change of variants) {
    const data = fixture()
    data.health = { ...data.health, ...change }
    assert.equal(evaluatePublicMintReadiness(data).ok, false, JSON.stringify(change))
  }
})

test('invalid SPA fallback, wrong source identity and undercounted routes fail', () => {
  const changes = [
    { renderer: 'not-found' },
    { source_sha: 'a'.repeat(39) },
    { base_url: '/' },
    { public_route_count: 115 },
    { public_route_count: '116' },
    { lia_live_trading: true },
  ]
  for (const change of changes) {
    const data = fixture()
    data.frontend = { ...data.frontend, ...change }
    assert.equal(evaluatePublicMintReadiness(data).ok, false)
  }
})

test('four public probes are GET-only and never send payment, mint or identity data', async () => {
  const data = fixture()
  const found = []
  const fetchImpl = async (url, options) => {
    found.push({ url, options })
    const key = Object.keys(PROBE_URLS).find(name => PROBE_URLS[name] === url)
    assert.ok(key)
    return new Response(JSON.stringify(data[key]), {
      status: 200, headers: { 'content-type': 'application/json' },
    })
  }
  const result = await runPublicMintWatchdog(fetchImpl)
  assert.equal(result.ok, true)
  assert.equal(found.length, 4)
  for (const { url, options } of found) {
    assert.ok(url.startsWith('https://'))
    assert.equal(options.method, 'GET')
    assert.equal(options.redirect, 'error')
    assert.equal(options.headers.Accept, 'application/json')
    assert.equal(Object.hasOwn(options, 'body'), false)
    assert.equal(Object.hasOwn(options.headers, 'Authorization'), false)
  }
})
