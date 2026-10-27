/**
 * Residual A: cache TTL + jobs fingerprint — pure logic mirrors runtimeCodehash.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

const MAX_AGE = 5 * 60 * 1000

function runtimeOk(cache, key, now, jobsFp) {
  if (!cache.refreshedAt || typeof cache.refreshedAt !== 'number') return false
  if (now - cache.refreshedAt > MAX_AGE) return false
  if (cache.jobsFp && cache.jobsFp !== jobsFp) return false
  return cache[key] === true
}

test('observation older than max age is closed', () => {
  const now = 1_000_000
  const cache = { refreshedAt: now - MAX_AGE - 1, marketplace: true, jobsFp: 'fp1' }
  assert.equal(runtimeOk(cache, 'marketplace', now, 'fp1'), false)
})

test('fresh observation with matching fingerprint is open', () => {
  const now = 1_000_000
  const cache = { refreshedAt: now - 1000, marketplace: true, jobsFp: 'fp1' }
  assert.equal(runtimeOk(cache, 'marketplace', now, 'fp1'), true)
})

test('address/hash fingerprint change closes gate', () => {
  const now = 1_000_000
  const cache = { refreshedAt: now - 1000, marketplace: true, jobsFp: 'old-addr' }
  assert.equal(runtimeOk(cache, 'marketplace', now, 'new-addr'), false)
})

test('prior true does not survive failed refresh generation', () => {
  let cache = { generation: 1, refreshedAt: 100, marketplace: true, jobsFp: 'fp' }
  assert.equal(runtimeOk(cache, 'marketplace', 200, 'fp'), true)
  cache = { generation: 2, refreshedAt: 300, marketplace: false, jobsFp: 'fp' }
  assert.equal(runtimeOk(cache, 'marketplace', 400, 'fp'), false)
})
