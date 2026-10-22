import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadSource } from './load-source.mjs'
import { accessApiCspPlugin } from '../scripts/accessApiCsp.mjs'

const env = { VITE_LIA_LIVE_TRADING: '1' }
const bootstrap = { id: 'bootstrap-live-test', strategy: 'LIVE_BOOTSTRAP', action: 'BOOTSTRAP_LIVE_1', assetId: 'EGLD', amount: 0.001 }

test('CORS candidates use fallback hosts without nesting existing image proxies', () => {
  const { corsSafeUrls } = loadSource('src/lib/corsImage.ts')
  const raw = 'https://media.multiversx.com/nfts/thumbnail/NFTUDURI-2990b6-1f7cda62'
  const urls = corsSafeUrls(raw)
  assert.equal(new URL(urls[0]).hostname, 'images.weserv.nl')
  assert.equal(new URL(urls[1]).hostname, 'wsrv.nl')
  assert.equal(urls[2], raw)
  const proxied = corsSafeUrls(urls[0])
  assert.deepEqual(proxied, urls)
  assert.deepEqual(corsSafeUrls('data:image/png;base64,abc'), ['data:image/png;base64,abc'])
  assert.deepEqual(corsSafeUrls('/local.jpg'), ['/local.jpg'])
  assert.deepEqual(corsSafeUrls(undefined), [])
})

test('museum retries failed images; only exhausted failures show a card; disposal cancels loading', () => {
  const { loadTextureWithFallback: loadMuseumTexture } = loadSource('src/lib/loadTextureWithFallback.ts')
  const calls = []
  const texture = { dispose() { this.disposed = true } }
  let selected, failures = 0
  const loader = { load(url, done, _, fail) { calls.push(url); calls.length === 1 ? fail() : done(texture) } }
  loadMuseumTexture(loader, 'https://media.multiversx.com/art.jpg', t => { selected = t }, () => failures++, () => false)
  assert.equal(calls.length, 2)
  assert.equal(selected, texture)
  assert.equal(failures, 0)
  let count = 0
  loadMuseumTexture({ load(_, __, ___, fail) { count++; fail() } }, 'https://media.multiversx.com/missing.jpg', () => assert.fail(), () => failures++, () => false)
  assert.equal(count, 3)
  assert.equal(failures, 1)
  let late, disposed = false
  loadMuseumTexture({ load(_, done) { late = done } }, 'https://media.multiversx.com/art.jpg', () => assert.fail(), () => assert.fail(), () => disposed)
  disposed = true
  late(texture)
  assert.equal(texture.disposed, true)
  loadMuseumTexture({ load() { assert.fail() } }, 'https://example.com/a.jpg', () => assert.fail(), () => assert.fail(), () => true)
})

test('live flag only prepares the explicit 0.001 EGLD bootstrap; other intents never become transfers', () => {
  const config = loadSource('src/config/liaConfig.ts', env)
  const { buildTxFromIntent, prepareIntentTx } = loadSource('src/lia/buildIntentTx.ts', env)
  assert.equal(config.LIA_MODE, 'live_user_sign')
  const draft = buildTxFromIntent(bootstrap)
  assert.equal(draft.value, '1000000000000000')
  assert.equal(draft.data, 'receiveAndSplit')
  assert.equal(draft.chainID, '1')
  for (const amount of [-1, 0, NaN, Infinity, 0.0011, 1e-30]) assert.equal(prepareIntentTx({ ...bootstrap, amount }).ok, false)
  for (const item of [{ action: 'BUY' }, { strategy: 'ANY' }, { assetId: 'USDC-c76f1f' }]) assert.equal(prepareIntentTx({ ...bootstrap, ...item }).ok, false)
  assert.equal(loadSource('src/config/liaConfig.ts').LIA_LIVE_TRADING, false)
})

test('USD ceilings reject unknown prices, invalid amounts and daily overflow', () => {
  const { assertLiveRisk } = loadSource('src/lia/buildIntentTx.ts')
  assert.doesNotThrow(() => assertLiveRisk({ usdNotional: 15, dailySpentUsd: 25 }))
  for (const usdNotional of [0, -1, 15.01, NaN, Infinity]) assert.throws(() => assertLiveRisk({ usdNotional, dailySpentUsd: 0 }))
  for (const dailySpentUsd of [-1, NaN, Infinity, 26]) assert.throws(() => assertLiveRisk({ usdNotional: 15, dailySpentUsd }))
})

test('ESDT eligibility requires fungible metadata and decimals, not an unchecked wildcard', () => {
  const { isSupportedTradingAsset } = loadSource('src/config/liaConfig.ts')
  assert(isSupportedTradingAsset({ identifier: 'EGLD' }))
  for (const identifier of ['USDC-c76f1f', 'TRO-94c925', 'OTHER-123abc']) assert(isSupportedTradingAsset({ identifier, type: 'FungibleESDT', decimals: 6 }))
  for (const metadata of [{}, { type: 'NonFungibleESDT', decimals: 0 }, { type: 'FungibleESDT', decimals: 19 }]) assert.equal(isSupportedTradingAsset({ identifier: 'OTHER-123abc', ...metadata }), false)
})

test('a successful hash must match sender, receiver, amount and encoded endpoint', () => {
  const { interpretAccountTx } = loadSource('src/lia/verifyUserTx.ts')
  const hash = 'a'.repeat(64)
  const expected = { receiver: 'erd1receiver', value: '1000000000000000', data: 'receiveAndSplit' }
  const tx = { ...expected, sender: 'erd1sender', txHash: hash, status: 'success', data: btoa(expected.data) }
  assert(interpretAccountTx(tx, tx.sender, hash, expected).ok)
  for (const patch of [{ sender: 'other' }, { receiver: 'other' }, { value: '1' }, { data: btoa('other') }, { status: 'pending' }, { txHash: 'b'.repeat(64) }]) assert.equal(interpretAccountTx({ ...tx, ...patch }, tx.sender, hash, expected).ok, false)
})

test('one confirmed hash cannot be assigned to two journal entries or re-opened for signing', () => {
  const store = new Map()
  globalThis.localStorage = { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value) }
  const rows = ['one', 'two'].map(id => ({ ...bootstrap, id, status: 'awaiting_signature', at: 1, updatedAt: 1 }))
  store.set('xartists_lia_intent_journal_v1', JSON.stringify(rows))
  const journal = loadSource('src/lia/intentJournal.ts', env)
  assert(journal.attachUserTxHash('one', '0x' + 'a'.repeat(64), true))
  assert.equal(journal.attachUserTxHash('two', 'a'.repeat(64), true), null)
  assert.equal(journal.markAwaitingSignature('one'), null)
})

test('preflight fails closed on a changed contract, unavailable price or unreconciled budget', async () => {
  const { MAINNET_CODEHASH } = loadSource('src/config/contracts.ts')
  const { preflightLiveDraft } = loadSource('src/lia/livePreflight.ts')
  const { buildTxFromIntent } = loadSource('src/lia/buildIntentTx.ts')
  const draft = buildTxFromIntent(bootstrap)
  const prior = globalThis.fetch
  const mock = (price = 30, codeHash = MAINNET_CODEHASH.treasury_splitter) => {
    globalThis.fetch = async url => ({ ok: true, json: async () => String(url).endsWith('/economics') ? { price } : { codeHash } })
  }
  try {
    mock()
    assert.equal((await preflightLiveDraft(draft, [])).usdNotional, 0.03)
    mock(30, 'changed')
    await assert.rejects(preflightLiveDraft(draft, []))
    mock(NaN)
    await assert.rejects(preflightLiveDraft(draft, []))
    mock()
    await assert.rejects(preflightLiveDraft(draft, [{ status: 'pending', updatedAt: Date.now() }]))
    globalThis.fetch = async () => { throw new Error('offline') }
    await assert.rejects(preflightLiveDraft(draft, []))
  } finally { globalThis.fetch = prior }
})

test('MoonPay never falls back to unsigned URLs or changes the requested wallet', async () => {
  const config = { VITE_MOONPAY_API_KEY: 'pk_test_ReleaseFixture123', VITE_ACCESS_API_BASE: 'https://payments.example/api' }
  const moonpay = loadSource('src/lib/moonpay.ts', config)
  const prior = globalThis.fetch
  const walletAddress = 'erd1' + 'q'.repeat(58)
  try {
    globalThis.fetch = async () => ({ ok: false, status: 503 })
    await assert.rejects(moonpay.getMoonPayCheckoutUrl({ walletAddress }))
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ url: 'https://attacker.example/' }) })
    await assert.rejects(moonpay.getMoonPayCheckoutUrl({ walletAddress }))
    globalThis.fetch = async (_, options) => ({ ok: true, json: async () => ({ url: JSON.parse(options.body).url + '&signature=' + encodeURIComponent('a'.repeat(43) + '=') }) })
    const url = await moonpay.getMoonPayCheckoutUrl({ walletAddress, paymentMethod: 'google_pay', baseCurrencyAmount: '50' })
    assert.equal(new URL(url).searchParams.get('walletAddress'), walletAddress)
    assert.equal(new URL(url).searchParams.get('paymentMethod'), 'google_pay')
    assert.equal(moonpay.isMoonpayLive(), false)
    assert.equal(moonpay.isMoonPaySandbox(), true)
    await assert.rejects(moonpay.getMoonPayCheckoutUrl({ currencyCode: 'TRO' }))
    await assert.rejects(moonpay.getMoonPayCheckoutUrl({ baseCurrencyAmount: Infinity }))
    assert.equal(loadSource('src/lib/moonpay.ts', { ...config, VITE_ACCESS_API_BASE: '' }).isMoonPayConfigured(), false)
  } finally { globalThis.fetch = prior }
})

test('CSP includes only the configured API origin in HTML and headers', () => {
  const plugin = accessApiCspPlugin('https://payments.example/api')
  const csp = "default-src 'self'; connect-src 'self' https://api.multiversx.com; frame-src 'self';"
  const html = plugin.transformIndexHtml.handler(csp)
  assert(html.includes("connect-src 'self' https://api.multiversx.com https://payments.example;"))
  assert.equal(plugin.transformIndexHtml.handler(html), html)
  const bundle = { _headers: { type: 'asset', source: csp } }
  plugin.generateBundle({}, bundle)
  assert.equal(bundle._headers.source, html)
  for (const url of ['http://payments.example', 'https://user:secret@payments.example', 'https://payments.example?x=1']) assert.throws(() => accessApiCspPlugin(url))
})
