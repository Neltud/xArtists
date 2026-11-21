/** Fixed, public technical endpoints only. No market prices, wallet data or orders. */
const PROBES = [
  { id: 'bitcoin', url: 'https://mempool.space/api/blocks/tip/height', method: 'GET',
    valid: raw => /^\d{1,10}$/.test(raw.trim()) && Number(raw) > 0 },
  { id: 'solana', url: 'https://api.mainnet.solana.com', method: 'POST',
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSlot', params: [{ commitment: 'finalized' }] }),
    valid: raw => { const v = JSON.parse(raw); return v.jsonrpc === '2.0' && v.id === 1 && !v.error && Number.isSafeInteger(v.result) && v.result > 0 } },
  { id: 'polymarket', url: 'https://clob.polymarket.com/time', method: 'GET',
    valid: (raw, now) => { const v = JSON.parse(raw); return Number.isSafeInteger(v) && Math.abs(v * 1000 - now) < 300_000 } },
  { id: 'kraken', url: 'https://api.kraken.com/0/public/Time', method: 'GET',
    valid: (raw, now) => { const v = JSON.parse(raw); return Array.isArray(v.error) && v.error.length === 0 && Number.isSafeInteger(v.result?.unixtime) && Math.abs(v.result.unixtime * 1000 - now) < 300_000 } },
]

export async function boundedText(response, maxBytes = 8192) {
  if (Number(response.headers.get('content-length')) > maxBytes) throw new Error('body_too_large')
  const reader = response.body?.getReader()
  if (!reader) return ''
  const parts = []
  let length = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > maxBytes) throw new Error('body_too_large')
      parts.push(value)
    }
  } catch (error) {
    await reader.cancel().catch(() => {})
    throw error
  } finally { reader.releaseLock() }
  const result = new Uint8Array(length)
  let offset = 0
  for (const part of parts) { result.set(part, offset); offset += part.byteLength }
  return new TextDecoder('utf-8', { fatal: true }).decode(result)
}

export async function probePlatforms({ fetchImpl = fetch, clock = Date.now } = {}) {
  return Promise.all(PROBES.map(async spec => {
    const start = clock()
    const base = { platform: spec.id, endpoint: spec.url, kind: 'technical_health',
      checked_at: new Date(start).toISOString(), trade_connection_verified: false,
      independently_verified_market_signals: 0, executable: false }
    try {
      const response = await fetchImpl(spec.url, { method: spec.method,
        headers: { accept: 'application/json, text/plain', ...(spec.body ? { 'content-type': 'application/json' } : {}) },
        body: spec.body, redirect: 'error', signal: AbortSignal.timeout(5000) })
      if (!response.ok) {
        await response.body?.cancel().catch(() => {})
        return { ...base, status: 'unavailable', reason: response.status === 429 ? 'upstream_rate_limited' : 'upstream_http_error', http_status: response.status }
      }
      const valid = spec.valid(await boundedText(response), clock())
      return { ...base, status: valid ? 'reachable' : 'unavailable',
        reason: valid ? 'technical_response_valid' : 'invalid_or_stale_response',
        latency_ms: Math.max(0, clock() - start), http_status: response.status }
    } catch {
      return { ...base, status: 'unavailable', reason: 'timeout_network_or_invalid_response' }
    }
  }))
}
