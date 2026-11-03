import { test } from 'node:test'
import assert from 'node:assert/strict'
import { startServer, post } from './server-fixture.mjs'
import { auctionConfig } from '../src/auction.mjs'

test('auction configuration advertises volatile storage and requires explicit sandbox write gates', () => {
  assert.equal(auctionConfig({}).enabled, false)
  assert.equal(auctionConfig({ AUCTION_ENABLED: '1', DATABASE_URL: 'unused' }).storage, 'volatile_memory')
  assert.equal(auctionConfig({ AUCTION_ENABLED: '1', DATABASE_URL: 'unused' }).persistent, false)
  assert.equal(auctionConfig({ AUCTION_ENABLED: '1' }).demo_writes_enabled, false)
  const sandbox = { AUCTION_ENABLED: '1', AUCTION_ENV: 'sandbox',
    AUCTION_DEMO_WRITES_ENABLED: '1', PAYBOX_MODE: 'preprod' }
  assert.equal(auctionConfig(sandbox).demo_writes_enabled, true)
  assert.equal(auctionConfig({ ...sandbox, PAYBOX_MODE: 'prod' }).demo_writes_enabled, false)
  assert.equal(auctionConfig({ ...sandbox, PAYBOX_CHECKOUT_ENABLED: '1' }).demo_writes_enabled, false)
  assert.equal(auctionConfig({ ...sandbox, MINT_LIVE_ENABLED: '1' }).demo_writes_enabled, false)
  assert.equal(auctionConfig({ ...sandbox, LIA_LIVE_TRADING: '1' }).demo_writes_enabled, false)
})

test('HTTP auction routes are mounted, disabled by default and health is truthful', async () => {
  const server = await startServer({ AUCTION_ENABLED: '0', AUCTION_DEMO_WRITES_ENABLED: '0' })
  try {
    const health = await (await fetch(server.base + '/health')).json()
    assert.equal(health.auction_enabled, false)
    assert.equal(health.auction_demo_writes_enabled, false)
    assert.equal(health.auction_settle, false)
    const cfgResponse = await fetch(server.base + '/v1/auction/config')
    assert.equal(cfgResponse.status, 200)
    const cfg = await cfgResponse.json()
    assert.equal(cfg.enabled, false)
    assert.equal(cfg.persistent, false)
    assert.equal(cfg.storage, 'volatile_memory')
    assert.equal((await fetch(server.base + '/v1/auction/listings')).status, 503)
    assert.equal((await post(server.base + '/v1/auction/listings', {})).status, 503)
  } finally { await server.close() }
})

test('enabling auction reads cannot expose write routes without a second demo gate', async () => {
  const server = await startServer({ AUCTION_ENABLED: '1',
    AUCTION_ENV: 'sandbox', AUCTION_DEMO_WRITES_ENABLED: '0', PAYBOX_MODE: 'preprod' })
  try {
    const r = await fetch(server.base + '/v1/auction/listings')
    assert.equal(r.status, 200)
    assert.deepEqual((await r.json()).listings, [])
    const denied = await post(server.base + '/v1/auction/listings', { title: 'test' })
    assert.equal(denied.status, 503)
    assert.equal((await denied.json()).error, 'auction_demo_writes_disabled')
    assert.equal((await fetch(server.base + '/v1/auctioneer')).status, 404)
  } finally { await server.close() }
})

test('sandbox demo writes still require authenticated wallet seller', async () => {
  const server = await startServer({ AUCTION_ENABLED: '1', AUCTION_ENV: 'sandbox',
    AUCTION_DEMO_WRITES_ENABLED: '1', PAYBOX_MODE: 'preprod',
    PAYBOX_CHECKOUT_ENABLED: '0', MINT_LIVE_ENABLED: '0', LIA_LIVE_TRADING: '0' })
  try {
    const cfg = await (await fetch(server.base + '/v1/auction/config')).json()
    assert.equal(cfg.demo_writes_enabled, true)
    const denied = await post(server.base + '/v1/auction/listings', {
      listing_type: 'physical', title: 'test item', start_bid_cents: 5000
    })
    assert.equal(denied.status, 401)
    assert.equal((await denied.json()).error, 'buyer_auth_required')
  } finally { await server.close() }
})
