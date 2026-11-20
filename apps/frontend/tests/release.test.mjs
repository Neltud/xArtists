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

test('legacy live env cannot re-enable a retired bootstrap transfer', () => {
  const config = loadSource('src/config/liaConfig.ts', env)
  const xorus = loadSource('src/config/xorusConfig.ts', env)
  const { buildTxFromIntent, prepareIntentTx } = loadSource('src/lia/buildIntentTx.ts', env)
  assert.equal(config.LIA_MODE, 'paper')
  assert.equal(config.LIA_LIVE_TRADING, false)
  assert.equal(xorus.XORUS_LIVE_TRADING, false)
  assert.throws(() => buildTxFromIntent(bootstrap), /Montant bootstrap invalide/)
  assert.equal(prepareIntentTx(bootstrap).ok, false)
  for (const item of [
    { amount: 0 }, { amount: 0.0011 }, { action: 'BUY' },
    { strategy: 'ANY' }, { assetId: 'USDC-c76f1f' },
  ]) assert.equal(prepareIntentTx({ ...bootstrap, ...item }).ok, false)
})

test('legacy USD risk ceilings stay at zero while trading is retired', () => {
  const { assertLiveRisk } = loadSource('src/lia/buildIntentTx.ts', env)
  for (const values of [
    { usdNotional: 0.03, dailySpentUsd: 0 },
    { usdNotional: 15, dailySpentUsd: 25 },
    { usdNotional: 0, dailySpentUsd: 0 },
    { usdNotional: NaN, dailySpentUsd: 0 },
    { usdNotional: Infinity, dailySpentUsd: 0 },
    { usdNotional: 1, dailySpentUsd: Infinity },
  ]) assert.throws(() => assertLiveRisk(values))
})

test('no EGLD or ESDT is eligible for autonomous LIA trading after retirement', () => {
  const { isSupportedTradingAsset, LIA_GUARDS } = loadSource('src/config/liaConfig.ts', env)
  assert.deepEqual(LIA_GUARDS.allowlist, [])
  for (const metadata of [
    { identifier: 'EGLD' },
    { identifier: 'USDC-c76f1f', type: 'FungibleESDT', decimals: 6 },
    { identifier: 'TRO-94c925', type: 'FungibleESDT', decimals: 18 },
    { identifier: 'OTHER-123abc', type: 'FungibleESDT', decimals: 6 },
  ]) assert.equal(isSupportedTradingAsset(metadata), false)
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

test('legacy preflight denies even apparently valid sources after trading retirement', async () => {
  const { MAINNET_CODEHASH } = loadSource('src/config/contracts.ts')
  const { preflightLiveDraft } = loadSource('src/lia/livePreflight.ts', env)
  const { buildBootstrapLiveTx } = loadSource('src/lia/buildIntentTx.ts', env)
  const draft = buildBootstrapLiveTx()
  const prior = globalThis.fetch
  try {
    globalThis.fetch = async url => ({
      ok: true,
      json: async () => String(url).endsWith('/economics')
        ? { price: 30 }
        : { codeHash: MAINNET_CODEHASH.treasury_splitter },
    })
    await assert.rejects(preflightLiveDraft(draft, []), /Montant USD non vérifié/)
    globalThis.fetch = async () => { throw new Error('offline') }
    await assert.rejects(preflightLiveDraft(draft, []))
  } finally {
    globalThis.fetch = prior
  }
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
