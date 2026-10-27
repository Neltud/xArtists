/**
 * PR-A: build CODEHASH flag AND fresh runtime — pure gate matrix.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

/** Mirrors apps/frontend/src/config/scStatus.ts isLiveGate */
function isLiveGate(buildFlag, runtimeFreshOk) {
  return buildFlag === true && runtimeFreshOk === true
}

/**
 * Simulate cache generations: a later failed refresh must not leave prior true usable.
 */
function applyRefresh(prev, observation) {
  const generation = (prev.generation || 0) + 1
  return {
    generation,
    refreshedAt: Date.now(),
    marketplace: observation.marketplace === true,
  }
}

function runtimeOk(cache, key) {
  if (!cache.refreshedAt) return false
  return cache[key] === true
}

test('flag 0 + runtime conforme → fermé', () => {
  assert.equal(isLiveGate(false, true), false)
  assert.equal(isLiveGate(false, false), false)
})

test('flag 1 + hash faux → fermé', () => {
  assert.equal(isLiveGate(true, false), false)
})

test('flag 1 + réseau KO (pas de runtime true) → fermé', () => {
  const cache = applyRefresh({}, { marketplace: false })
  assert.equal(runtimeOk(cache, 'marketplace'), false)
  assert.equal(isLiveGate(true, runtimeOk(cache, 'marketplace')), false)
})

test('cache périmé sans refresh → fermé', () => {
  const stale = { marketplace: true } // no refreshedAt
  assert.equal(runtimeOk(stale, 'marketplace'), false)
  assert.equal(isLiveGate(true, runtimeOk(stale, 'marketplace')), false)
})

test('ancienne réponse positive ne rouvre pas après échec plus récent', () => {
  let cache = applyRefresh({}, { marketplace: true })
  assert.equal(runtimeOk(cache, 'marketplace'), true)
  assert.equal(isLiveGate(true, runtimeOk(cache, 'marketplace')), true)
  const gen1 = cache.generation
  cache = applyRefresh(cache, { marketplace: false })
  assert.ok(cache.generation > gen1)
  assert.equal(runtimeOk(cache, 'marketplace'), false)
  assert.equal(isLiveGate(true, runtimeOk(cache, 'marketplace')), false)
})

test('flag 1 + observation fraîche et conforme → ouvert', () => {
  const cache = applyRefresh({}, { marketplace: true })
  assert.equal(runtimeOk(cache, 'marketplace'), true)
  assert.equal(isLiveGate(true, runtimeOk(cache, 'marketplace')), true)
})

test('OR legacy would have been unsafe — document AND requirement', () => {
  // Historical bug: buildFlag || runtimeOk → true with flag1 even if runtime false
  const legacyOr = (build, runtime) => build || runtime
  assert.equal(legacyOr(true, false), true) // unsafe
  assert.equal(isLiveGate(true, false), false) // fixed
})
