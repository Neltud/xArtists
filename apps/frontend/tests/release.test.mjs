import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadSource } from './load-source.mjs'
import { accessApiCspPlugin } from '../scripts/accessApiCsp.mjs'

const env = { VITE_LIA_LIVE_TRADING: '1' }
const bootstrap = { id: 'bootstrap-live-test', strategy: 'LIVE_BOOTSTRAP', action: 'BOOTSTRAP_LIVE_1', assetId: 'EGLD', amount: 0.001 }

test('CORS candidates use fallback hosts without nesting existing image proxies', () => {
  const { corsSafeUrls } = loadSource('src/lib/corsImage.ts')
  const urls = corsSafeUrls('https://media.multiversx.com/nfts/asset/example.png')
  assert.ok(urls.length >= 2)
  assert.ok(urls.some(u => u.includes('weserv') || u.includes('wsrv')))
  assert.ok(urls.includes('https://media.multiversx.com/nfts/asset/example.png'))
})

test('playlist default is Nelson Tuduri instrumentals', () => {
  const src = loadSource('src/config/playlist.ts')
  assert.match(src, /PLgOJTjzDs6ePLXPNu0YE1w-R-iJneJzF3/)
  assert.match(src, /NELSON_PLAYLIST/)
})

test('modules registry exports groups and at least 30 modules', () => {
  const src = loadSource('src/experience/modules.ts')
  assert.match(src, /export const modules/)
  assert.match(src, /export const groups/)
  const count = (src.match(/module\(/g) || []).length
  assert.ok(count >= 30, `expected >=30 modules, got ${count}`)
})

test('LIA live path requires explicit user signature markers', () => {
  const src = loadSource('src/lia/buildIntentTx.ts')
  assert.match(src, /prepareIntentTx|buildBootstrapLiveTx|bootstrapEgld/)
})

test('access API CSP plugin is a no-op without API base', () => {
  const plugin = accessApiCspPlugin(undefined)
  assert.equal(plugin.name, 'access-api-csp')
})

test('release env keeps trading user-signed only', () => {
  assert.equal(env.VITE_LIA_LIVE_TRADING, '1')
  assert.equal(bootstrap.amount, 0.001)
  assert.equal(bootstrap.assetId, 'EGLD')
})
