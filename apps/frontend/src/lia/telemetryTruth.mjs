/**
 * Public telemetry provenance; pure and fail-closed, with no trading controls.
 * A browser fetch or a new aggregator publication cannot refresh stale Vellum
 * reasoning or a stale paper fill. All timestamps are producer evidence, not
 * proof of trading execution. Works in Node >=20 and in the browser.
 */
export const TELEMETRY_TTL_SECONDS = 15 * 60
const MAX_CLOCK_SKEW_MS = 60 * 1000
const UTC_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/

function parseUtcTimestamp(value) {
  if (typeof value !== 'string' || !UTC_ISO.test(value)) return null
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) return null
  // Reject rolled-over dates (e.g. 2026-02-31), not merely invalid strings.
  if (new Date(ms).toISOString().slice(0, 19) !== value.slice(0, 19)) return null
  return ms
}

/**
 * Source contract (client-normalized for older JSON):
 * source_ts, published_at, received_at, provider, data_mode,
 * is_stale, ttl_seconds, source_health.
 * `received_at` records only browser inspection, never producer freshness.
 */
export function assessTelemetrySource({
  source_ts = null,
  published_at = null,
  provider = 'unknown',
  data_mode = 'unknown',
  ttl_seconds = TELEMETRY_TTL_SECONDS,
  provider_ok = true,
} = {}, nowMs = Date.now()) {
  const checkedAt = Number.isFinite(nowMs) ? nowMs : Date.now()
  const ttl = Number.isInteger(ttl_seconds) && ttl_seconds > 0 && ttl_seconds <= 86400
    ? ttl_seconds : TELEMETRY_TTL_SECONDS
  const mode = ['paper', 'onchain', 'market'].includes(data_mode) ? data_mode : 'unknown'
  const publishedMs = parseUtcTimestamp(published_at)
  const sourceMs = parseUtcTimestamp(source_ts)
  let source_health = 'fresh'
  if (provider_ok !== true) source_health = 'provider_error'
  else if (!source_ts || !published_at) source_health = 'offline'
  else if (sourceMs === null || publishedMs === null) source_health = 'invalid_timestamp'
  else if (sourceMs > checkedAt + MAX_CLOCK_SKEW_MS ||
           publishedMs > checkedAt + MAX_CLOCK_SKEW_MS ||
           sourceMs > publishedMs + MAX_CLOCK_SKEW_MS) source_health = 'clock_skew'
  else if (checkedAt - sourceMs >= ttl * 1000 ||
           checkedAt - publishedMs >= ttl * 1000) source_health = 'delayed'
  return Object.freeze({
    source_ts: source_ts || null,
    published_at: published_at || null,
    received_at: new Date(checkedAt).toISOString(),
    provider: typeof provider === 'string' ? provider : 'unknown',
    data_mode: mode,
    ttl_seconds: ttl,
    is_stale: source_health !== 'fresh',
    source_health,
    age_minutes: sourceMs === null ? null : Math.max(0, Math.floor((checkedAt - sourceMs) / 60000)),
  })
}
