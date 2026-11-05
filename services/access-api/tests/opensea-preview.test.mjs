import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createOpenSeaPreviewService, normalizeOpenSeaNft, safeOpenSeaUrl, validateOpenSeaRequest,
} from '../src/openseaPreview.mjs'

const KEY = 'opensea-test-key-only-123456'
const META = { name: 'Curated artists', contracts: [{ chain: 'solana', address: '11111111111111111111111111111111' }] }
const ASSET = {
  identifier: 'abc123', contract: '11111111111111111111111111111111',
  name: 'Original artwork', image_url: 'https://images.example.org/art.png',
  opensea_url: 'https://opensea.io/item/solana/abc123', collection: 'curated-artists',
}
function fakeFetch(calls, { meta = META, nfts = [ASSET], status = 200 } = {}) {
  return async (url, opts) => {
    calls.push({ url, opts })
    assert.match(url, /^https:\/\/api\.opensea\.io\/api\/v2\//)
    assert.equal(opts.method, 'GET')
    assert.equal(opts.headers['x-api-key'], KEY)
    assert.equal(opts.redirect, 'error')
    if (status !== 200) return new Response('{}', { status })
    const data = url.includes('/collections/') ? meta : { nfts }
    return new Response(JSON.stringify(data), { status: 200 })
  }
}
test('Solana discovered only after chain verification; no simulated price or execution', async () => {
  const calls = []
  const preview = createOpenSeaPreviewService({ apiKey: KEY, fetchImpl: fakeFetch(calls), clock: () => 123000 })
  const result = await preview('solana', 'curated-artists')
  assert.equal(result.status, 200)
  assert.equal(result.body.mode, 'read_only')
  assert.equal(result.body.on_site_order_enabled, false)
  assert.equal(result.body.items[0].listing_verified, false)
  assert.equal(result.body.items[0].price, null)
  assert.equal(result.body.items[0].opensea_url, ASSET.opensea_url)
  assert.equal(calls.length, 2)
  assert.ok(calls[1].url.endsWith('/collection/curated-artists/nfts?limit=20'))
  const cache = await preview('solana', 'curated-artists')
  assert.deepEqual(cache, result)
  assert.equal(calls.length, 2)
})
test('Polygon uses the same API but rejects a Solana-only collection', async () => {
  const calls = []
  const preview = createOpenSeaPreviewService({ apiKey: KEY, fetchImpl: fakeFetch(calls) })
  const result = await preview('polygon', 'curated-artists')
  assert.equal(result.status, 409)
  assert.equal(result.body.error, 'collection_chain_not_verified')
  assert.equal(calls.length, 1)
})
test('Polygon collection succeeds after polygon contract verification', async () => {
  const calls = []
  const preview = createOpenSeaPreviewService({
    apiKey: KEY, fetchImpl: fakeFetch(calls, { meta: { contracts: [{ chain: 'polygon' }] } }),
  })
  const result = await preview('polygon', 'curated-artists')
  assert.equal(result.status, 200)
  assert.equal(result.body.chain, 'polygon')
})
test('Reject unsupported chain, slugs, injection, and query smuggling before fetch', async () => {
  let called = 0
  const preview = createOpenSeaPreviewService({ apiKey: KEY, fetchImpl: async () => { called++; throw Error('bad') } })
  for (const chain of ['ethereum', 'mainnet', 'solana/../', '', null]) {
    assert.equal((await preview(chain, 'valid-slug')).status, 400)
  }
  for (const slug of ['../admin', 'solana?x=1', 'ABC', '', 'a'.repeat(65), '%2F', 'bad_slug']) {
    assert.equal((await preview('solana', slug)).status, 400)
  }
  assert.equal(called, 0)
  assert.equal(validateOpenSeaRequest('polygon', 'a').ok, true)
})
test('Fail closed without API key; no network request nor secret exposure', async () => {
  const preview = createOpenSeaPreviewService({ apiKey: '', fetchImpl: async () => { throw Error('should not fetch') } })
  assert.deepEqual(await preview('solana', 'valid'), {
    status: 503, body: { ok: false, error: 'opensea_api_not_configured' },
  })
})
test('No arbitrary link and no JS/HTTP image from untrusted OpenSea metadata', () => {
  assert.equal(safeOpenSeaUrl('https://evil.example/collection/foo'), null)
  assert.equal(safeOpenSeaUrl('https://opensea.io.evil.example/steal'), null)
  assert.equal(safeOpenSeaUrl('javascript:alert(1)'), null)
  assert.equal(safeOpenSeaUrl('http://opensea.io/collection/abc'), null)
  const output = normalizeOpenSeaNft({
    ...ASSET, opensea_url: 'https://opensea.io.evil.example/bad',
  }, 'curated-artists')
  assert.equal(output, null)
  const safe = normalizeOpenSeaNft({ ...ASSET, image_url: 'javascript:alert(1)' }, 'curated-artists')
  assert.equal(safe.image_url, null)
})
test('Provider errors are redacted and order endpoints are never contacted', async () => {
  const calls = []
  const preview = createOpenSeaPreviewService({ apiKey: KEY, fetchImpl: fakeFetch(calls, { status: 429 }) })
  const result = await preview('solana', 'valid')
  assert.equal(result.status, 502)
  assert.deepEqual(result.body, { ok: false, error: 'opensea_upstream_unavailable' })
  assert.equal(calls.length, 1)
  assert.equal(JSON.stringify(result).includes(KEY), false)
})
test('Malformed NFT response and disabled NFT fail closed', async () => {
  const calls = []
  const preview = createOpenSeaPreviewService({ apiKey: KEY, fetchImpl: fakeFetch(calls, {
    nfts: [{ ...ASSET, is_disabled: true }, { ...ASSET, opensea_url: 'javascript:alert(1)' }],
  }) })
  const result = await preview('solana', 'collection')
  assert.equal(result.status, 200)
  assert.deepEqual(result.body.items, [])
})

test('Per-instance API usage is rate-limited; cached views remain usable', async () => {
  const calls = []
  const preview = createOpenSeaPreviewService({
    apiKey: KEY, fetchImpl: fakeFetch(calls), clock: () => 1_000,
  })
  for (let i = 0; i < 30; i++) {
    const result = await preview('solana', 'collection-' + i)
    assert.equal(result.status, 200)
  }
  const blocked = await preview('solana', 'collection-30')
  assert.equal(blocked.status, 429)
  assert.equal(blocked.body.error, 'opensea_busy')
  assert.equal(calls.length, 60)
  assert.equal((await preview('solana', 'collection-0')).status, 200)
  assert.equal(calls.length, 60)
})
