import test from 'node:test'
import assert from 'node:assert/strict'
import { assessReferenceQuote, referenceQuoteManifest } from './reference-quotes.mjs'
import { createHub } from './hub.mjs'

const NOW = Date.parse('2026-11-24T05:33:28.000Z')

function sample(overrides = {}) {
  return {
    symbol: 'EGLD',
    network: 'multiversx',
    observed_at: new Date(NOW - 1000).toISOString(),
    source_url: 'https://example.invalid/reference',
    price_micro_usd: 2_260_000,
    ...overrides,
  }
}

test('the public manifest collects no prices and cannot become a feed by flags', () => {
  const manifest = referenceQuoteManifest(NOW)
  assert.equal(manifest.status, 'schema_only_no_licensed_feed')
  assert.deepEqual(manifest.quotes, [])
  assert.equal(manifest.feed, null)
  assert.equal(manifest.executable, false)
  assert.equal(manifest.independently_verified_market_signals, 0)
  assert.equal(manifest.rights_status, 'no_market_data_used_or_commercially_licensed')
  assert.equal(manifest.universe.length, 4)
  assert.equal(manifest.universe.every((row) => row.swap_support_proven === false), true)
  manifest.quotes.push({ price: 1 })
  manifest.executable = true
  assert.deepEqual(referenceQuoteManifest(NOW).quotes, [])
  assert.equal(referenceQuoteManifest(NOW).executable, false)
})

test('a fresh https reference can be assessed and still cannot fill', () => {
  const result = assessReferenceQuote(sample(), NOW)
  assert.equal(result.ok, true)
  assert.equal(result.executable, false)
  assert.equal(result.signing_authorized, false)
  assert.equal(result.quote.usable_as_fill, false)
  assert.equal(result.quote.swap_support_proven, false)
  assert.equal(result.quote.price_micro_usd, 2_260_000)
})

test('stale, future, secret-bearing, executable and unknown quotes are rejected', () => {
  assert.equal(assessReferenceQuote(sample({ observed_at: new Date(NOW - 16_000).toISOString() }), NOW).error, 'quote_stale_or_future')
  assert.equal(assessReferenceQuote(sample({ observed_at: new Date(NOW + 1000).toISOString() }), NOW).error, 'quote_stale_or_future')
  assert.equal(assessReferenceQuote(sample({ source_url: 'http://example.invalid/x' }), NOW).error, 'https_source_url_required')
  assert.equal(assessReferenceQuote(sample({ source_url: 'https://user:pw@example.invalid/x' }), NOW).error, 'https_source_url_required')
  assert.equal(assessReferenceQuote(sample({ executable: true }), NOW).error, 'executable_quote_rejected')
  assert.equal(assessReferenceQuote(sample({ symbol: 'BTC', network: 'bitcoin' }), NOW).error, 'asset_not_in_reference_universe')
  assert.equal(assessReferenceQuote(sample({ price_micro_usd: 1.5 }), NOW).error, 'positive_integer_micro_usd_required')
  assert.equal(assessReferenceQuote(null, NOW).error, 'quote_object_required')
})

test('GET reference-quotes does no I/O and POST cannot sneak in an order', async () => {
  const fail = () => assert.fail('reference route attempted external access')
  const hub = createHub({
    fetchImpl: fail,
    store: { read: fail, claim: fail },
    paperStore: { read: fail, command: fail },
    env: { XORUS_LIVE_TRADING: '1', XORUS_ASSISTED_SWAP_ENABLED: '1' },
    clock: () => NOW,
  })
  const response = await hub.fetch(new Request('https://hub.invalid/v1/xorus/reference-quotes'))
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.ok, true)
  assert.equal(body.execution_authorized, false)
  assert.equal(body.trading_enabled, false)
  assert.equal(body.quotes.length, 0)
  assert.equal(body.status, 'schema_only_no_licensed_feed')
  const posted = await hub.fetch(new Request('https://hub.invalid/v1/xorus/reference-quotes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(sample({ executable: true })),
  }))
  assert.equal(posted.status, 405)
  const health = await (await hub.fetch(new Request('https://hub.invalid/v1/xorus/reference-quotes'))).json()
  assert.equal(health.independently_verified_market_signals, 0)
  const root = await (await hub.fetch(new Request('https://hub.invalid/health'))).json()
  assert.equal(root.endpoints.includes('/v1/xorus/reference-quotes'), true)
  assert.equal(root.execution_authorized, false)
})
