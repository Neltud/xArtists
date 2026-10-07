/**
 * In-memory price cache (TTL 60s) — EGLD economics + optional TRO token.
 * Avoids spamming api.multiversx.com from the access-api.
 */

const TTL_MS = Number(process.env.PRICES_CACHE_TTL_MS || 60_000)
const MVX = (process.env.MVX_API_URL || 'https://api.multiversx.com').replace(/\/$/, '')
const TRO_ID = process.env.TRO_TOKEN_ID || 'TRO-652d6d'

let cache = { at: 0, payload: null }

async function fetchJson(url) {
  const r = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!r.ok) throw new Error(`http_${r.status}`)
  return r.json()
}

export async function getPrices() {
  const now = Date.now()
  if (cache.payload && now - cache.at < TTL_MS) {
    return { ...cache.payload, cached: true, age_ms: now - cache.at }
  }
  let egld = null
  let tro = null
  const errors = []
  try {
    const eco = await fetchJson(`${MVX}/economics`)
    egld = {
      usd: Number(eco.price) || null,
      marketCap: eco.marketCap ?? null,
      circulatingSupply: eco.circulatingSupply ?? null,
    }
  } catch (e) {
    errors.push(`egld:${e?.message || e}`)
  }
  try {
    const tok = await fetchJson(`${MVX}/tokens/${encodeURIComponent(TRO_ID)}`)
    tro = {
      identifier: tok.identifier || TRO_ID,
      name: tok.name || 'TRO',
      price: tok.price != null ? Number(tok.price) : null,
      accounts: tok.accounts ?? null,
      transactions: tok.transactions ?? null,
    }
  } catch (e) {
    errors.push(`tro:${e?.message || e}`)
  }

  const payload = {
    ok: true,
    fetched_at: new Date().toISOString(),
    ttl_sec: Math.floor(TTL_MS / 1000),
    egld,
    tro,
    series_hint: 'Use successive polls to build short bar series client-side',
    errors: errors.length ? errors : undefined,
  }
  cache = { at: now, payload }
  return { ...payload, cached: false, age_ms: 0 }
}
