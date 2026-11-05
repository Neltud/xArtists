import test from 'node:test'
import assert from 'node:assert/strict'
import { assessTelemetrySource } from '../src/lia/telemetryTruth.mjs'

const NOW = Date.parse('2026-11-04T07:00:00Z')
const stamp = (agoMs = 0) => new Date(NOW - agoMs).toISOString()
const inspect = (sourceAge, publishedAge = 0, rest = {}) => assessTelemetrySource({
  source_ts: stamp(sourceAge),
  published_at: stamp(publishedAge),
  provider: 'Vellum',
  data_mode: 'paper',
  ...rest,
}, NOW)

test('14-min producer is fresh; browser check time is never the source timestamp', () => {
  const result = inspect(14 * 60_000)
  assert.equal(result.is_stale, false)
  assert.equal(result.data_mode, 'paper')
  assert.equal(result.provider, 'Vellum')
  assert.equal(result.source_health, 'fresh')
  assert.equal(result.age_minutes, 14)
  assert.equal(result.received_at, stamp())
  assert.notEqual(result.received_at, result.source_ts)
  assert.ok(Object.isFrozen(result))
})

test('15-minute boundary is delayed, as are 24-hour and older model decisions', () => {
  assert.equal(inspect(15 * 60_000).source_health, 'delayed')
  assert.equal(inspect(24 * 60 * 60_000).source_health, 'delayed')
  assert.equal(inspect(60_000, 24 * 60 * 60_000).source_health, 'clock_skew') // published before producer
})

test('missing source, malformed timestamp and invalid leap date fail closed', () => {
  const missing = assessTelemetrySource({ published_at: stamp(), provider: 'fixture' }, NOW)
  assert.equal(missing.source_health, 'offline')
  assert.equal(missing.is_stale, true)
  assert.equal(inspect(0, 0, { source_ts: 'yesterday' }).source_health, 'invalid_timestamp')
  assert.equal(inspect(0, 0, { source_ts: '2026-02-31T00:00:00Z' }).source_health, 'invalid_timestamp')
  assert.equal(inspect(0, 0, { published_at: '2026-11-04T07:00:00+00:00' }).source_health, 'invalid_timestamp')
})

test('future source, source published ahead of producer, and provider failure fail closed', () => {
  assert.equal(inspect(-61_000).source_health, 'clock_skew')
  assert.equal(inspect(0, -61_000).source_health, 'clock_skew')
  assert.equal(inspect(-120_000, 0).source_health, 'clock_skew')
  assert.equal(inspect(0, 0, { provider_ok: false }).source_health, 'provider_error')
})

test('concurrent arrivals cannot freshen an older producer event', () => {
  const latest = inspect(30_000, 0)
  const stale = inspect(60 * 60_000, 0)
  assert.equal(latest.is_stale, false)
  assert.equal(stale.is_stale, true)
  assert.equal(stale.received_at, latest.received_at)
})

test('offline, invalid mode and TTL misuse never yield an execution-live claim', () => {
  const unknown = inspect(0, 0, { data_mode: 'live', ttl_seconds: Infinity })
  assert.equal(unknown.data_mode, 'unknown')
  assert.equal(unknown.ttl_seconds, 900)
  assert.equal(unknown.source_health, 'fresh')
  assert.ok(!Object.values(unknown).includes('live'))
  assert.equal(assessTelemetrySource({}, NOW).is_stale, true)
})
