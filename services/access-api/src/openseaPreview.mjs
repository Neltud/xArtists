/**
 * xArtists OpenSea discovery adapter — Polygon + supported Solana collections.
 * GET/read-only only; never constructs orders, routes payments, or requests signatures.
 * API key belongs exclusively to Render (OPEN_SEA_API_KEY), not VITE_*.
 */
export const OPENSEA_NETWORKS = Object.freeze(['polygon', 'solana'])
const HOST = 'https://api.opensea.io'
const MAX_ITEMS = 20
const MAX_CACHE_ENTRIES = 32
const MAX_CACHE_MISSES_PER_MINUTE = 30
const TTL_MS = 60_000

export function validateOpenSeaRequest(chain, slug) {
  if (!OPENSEA_NETWORKS.includes(chain)) return { ok: false, error: 'unsupported_chain' }
  if (typeof slug !== 'string' || !/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(slug)) {
    return { ok: false, error: 'invalid_collection_slug' }
  }
  return { ok: true, chain, slug }
}

function cleanText(value, limit = 150) {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, limit) : ''
}

export function safeOpenSeaUrl(value) {
  try {
    const u = new URL(value)
    // OpenSea outbound links are the only allowed buy/list destinations.
    if (u.protocol !== 'https:' || u.hostname !== 'opensea.io' ||
        u.username || u.password || u.port) return null
    return u.toString()
  } catch { return null }
}
function safeMediaUrl(value) {
  try {
    const u = new URL(value)
    return u.protocol === 'https:' && !u.username && !u.password && !u.port && u.hostname
      ? u.toString() : null
  } catch { return null }
}
export function normalizeOpenSeaNft(nft, slug) {
  if (!nft || typeof nft !== 'object') return null
  const identifier = cleanText(nft.identifier, 180)
  const contract = cleanText(nft.contract, 180)
  const url = safeOpenSeaUrl(nft.opensea_url)
  if (!identifier || !url || !contract || nft.is_disabled === true) return null
  return {
    identifier, contract,
    name: cleanText(nft.name, 150) || `NFT ${identifier.slice(0, 24)}`,
    image_url: safeMediaUrl(nft.display_image_url || nft.image_url),
    opensea_url: url,
    collection: cleanText(nft.collection, 100) || slug,
    // No price/availability claim: this endpoint provides metadata, not a live order quote.
    price: null, listing_verified: false, source: 'opensea',
  }
}

function collectionChains(collection) {
  const contracts = Array.isArray(collection?.contracts) ? collection.contracts : []
  return new Set(contracts.map(c => String(c?.chain || '').toLowerCase()))
}

export function createOpenSeaPreviewService({
  apiKey = process.env.OPEN_SEA_API_KEY || '',
  fetchImpl = globalThis.fetch,
  clock = () => Date.now(),
} = {}) {
  const cache = new Map()
  const pending = new Map()
  let requestWindowStarted = clock()
  let cacheMisses = 0
  async function request(path) {
    const response = await fetchImpl(HOST + path, {
      method: 'GET',
      headers: { accept: 'application/json', 'x-api-key': apiKey },
      redirect: 'error',
      signal: AbortSignal.timeout(8000),
    })
    if (response.status === 404) throw Object.assign(new Error('collection_not_found'), { status: 404 })
    if (!response.ok) throw Object.assign(new Error('upstream_unavailable'), { status: 502 })
    // A known upstream is still untrusted input; bound body size before JSON parse.
    const raw = await response.text()
    if (raw.length > 800_000) throw new Error('upstream_payload_too_large')
    return JSON.parse(raw)
  }
  async function load(chain, slug) {
    try {
      const collection = await request(`/api/v2/collections/${encodeURIComponent(slug)}`)
      if (!collectionChains(collection).has(chain)) {
        return { status: 409, body: { ok: false, error: 'collection_chain_not_verified' } }
      }
      const details = await request(`/api/v2/collection/${encodeURIComponent(slug)}/nfts?limit=${MAX_ITEMS}`)
      if (!Array.isArray(details?.nfts)) throw new Error('invalid_upstream_nfts')
      const items = details.nfts.map(n => normalizeOpenSeaNft(n, slug))
        .filter(Boolean).slice(0, MAX_ITEMS)
      return { status: 200, body: {
        ok: true, chain, collection: slug,
        collection_name: cleanText(collection?.name, 130) || slug,
        collection_url: `https://opensea.io/collection/${encodeURIComponent(slug)}`,
        items, source: 'opensea_api_v2', mode: 'read_only',
        on_site_order_enabled: false, fetched_at: new Date(clock()).toISOString(),
      } }
    } catch (error) {
      const status = error?.status === 404 ? 404 : 502
      return { status, body: { ok: false,
        error: status === 404 ? 'collection_not_found' : 'opensea_upstream_unavailable' } }
    }
  }
  return async function preview(chain, slug) {
    const valid = validateOpenSeaRequest(chain, slug)
    if (!valid.ok) return { status: 400, body: { ok: false, error: valid.error } }
    if (typeof apiKey !== 'string' || apiKey.length < 12) {
      return { status: 503, body: { ok: false, error: 'opensea_api_not_configured' } }
    }
    const key = chain + ':' + slug
    const cached = cache.get(key)
    if (cached && cached.expires > clock()) return cached.result
    if (pending.has(key)) return pending.get(key)
    // Bound requests against the API key, not just concurrent sockets. Cache hits
    // do not consume provider quota. This is per instance, not a distributed WAF.
    if (clock() - requestWindowStarted >= 60_000) { requestWindowStarted = clock(); cacheMisses = 0 }
    if (cacheMisses >= MAX_CACHE_MISSES_PER_MINUTE || pending.size >= 5)
      return { status: 429, body: { ok: false, error: 'opensea_busy' } }
    cacheMisses++
    const promise = load(chain, slug).then(result => {
      if (result.status === 200) {
        cache.set(key, { expires: clock() + TTL_MS, result })
        if (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value)
      }
      return result
    }).finally(() => pending.delete(key))
    pending.set(key, promise)
    return promise
  }
}
