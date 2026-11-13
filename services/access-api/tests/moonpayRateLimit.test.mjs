import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createMoonpayRateLimiter } from '../src/moonpayRateLimit.mjs'

test('MoonPay counts one network across different allowed origins', () => {
  const limiter = createMoonpayRateLimiter({ maxPerNetwork: 2, maxPerOrigin: 10 })
  assert.equal(limiter.allow({ network: '127.0.0.1', origin: 'https://xartists.art' }), true)
  assert.equal(limiter.allow({ network: '127.0.0.1', origin: 'https://neltud.github.io' }), true)
  assert.equal(limiter.allow({ network: '127.0.0.1', origin: 'https://xartists-services-and-products.onrender.com' }), false)
})

test('MoonPay origin budget spans networks and recovers after the window', () => {
  let time = 100
  const limiter = createMoonpayRateLimiter({ now: () => time, windowMs: 1000,
    maxPerNetwork: 10, maxPerOrigin: 2 })
  assert.equal(limiter.allow({ network: '198.51.100.1', origin: 'https://xartists.art' }), true)
  assert.equal(limiter.allow({ network: '198.51.100.2', origin: 'https://xartists.art' }), true)
  assert.equal(limiter.allow({ network: '198.51.100.3', origin: 'https://xartists.art' }), false)
  time += 1000
  assert.equal(limiter.allow({ network: '198.51.100.3', origin: 'https://xartists.art' }), true)
})

test('MoonPay fails closed at capacity and for unknown peers', () => {
  const limiter = createMoonpayRateLimiter({ maxNetworkKeys: 1, maxPerNetwork: 1 })
  assert.equal(limiter.allow({ network: '', origin: '' }), true)
  assert.equal(limiter.allow({ network: undefined, origin: '' }), false)
  assert.equal(limiter.allow({ network: '198.51.100.4', origin: 'https://xartists.art' }), false)
})
