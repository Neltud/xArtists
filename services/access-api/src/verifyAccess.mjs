/** Sprint 1.1 zero-trust Pulse access — MultiversX read-only + HS256 JWT + memory cache. */
import crypto from 'node:crypto'

const MS_DAY = 24 * 60 * 60 * 1000
const DURATION_DAYS = Number(process.env.PULSE_DURATION_DAYS || 365)
const JWT_TTL_SEC = Number(process.env.ACCESS_JWT_TTL_SEC || 900)
const MVX_API = (process.env.MVX_API_URL || 'https://api.multiversx.com').replace(/\/$/, '')

function b64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export function signJwt(payload, secret) {
  const h = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const p = b64url(JSON.stringify(payload))
  const sig = crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest()
  return `${h}.${p}.${b64url(sig)}`
}

export function verifyJwt(token, secret) {
  if (!token || !secret) return null
  const parts = String(token).split('.')
  if (parts.length !== 3) return null
  const [h, p, s] = parts
  const expect = b64url(crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest())
  const actualBytes = Buffer.from(s)
  const expectedBytes = Buffer.from(expect)
  if (actualBytes.length !== expectedBytes.length || !crypto.timingSafeEqual(actualBytes, expectedBytes)) return null
  try {
    const header = JSON.parse(Buffer.from(h, 'base64url').toString())
    if (header.alg !== 'HS256' || header.typ !== 'JWT') return null
    const payload = JSON.parse(Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString())
    if (!Number.isFinite(payload.exp) || Date.now() / 1000 >= payload.exp) return null
    return payload
  } catch {
    return null
  }
}

function isErd(addr) {
  return typeof addr === 'string' && /^erd1[a-z0-9]{58}$/i.test(addr.trim())
}

function parseAllowlist() {
  return new Set(
    (process.env.PULSE_ALLOWLIST || '')
      .split(/[,\s]+/)
      .map(s => s.trim().toLowerCase())
      .filter(Boolean),
  )
}

function collectionTickers() {
  return (process.env.PULSE_COLLECTION || process.env.PULSE_COLLECTIONS || '')
    .split(/[,\s]+/)
    .map(s => s.trim())
    .filter(Boolean)
}

export async function fetchPulseFromChain(address) {
  const tickers = collectionTickers()
  if (!tickers.length) return { held: false, reason: 'no_collection_configured', source: 'none' }
  const url = `${MVX_API}/accounts/${encodeURIComponent(address)}/nfts?size=200&excludeMetaESDT=true`
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12000) })
    if (!res.ok) return { held: false, reason: `indexer_http_${res.status}`, source: 'chain' }
    const nfts = await res.json()
    if (!Array.isArray(nfts)) return { held: false, reason: 'indexer_bad_shape', source: 'chain' }
    const match = nfts.find(n => {
      const col = String(n.collection || n.ticker || '').toUpperCase()
      return tickers.some(t => col === t.toUpperCase() || String(n.identifier || '').toUpperCase().startsWith(t.toUpperCase() + '-'))
    })
    if (!match) return { held: false, reason: 'no_pulse_nft', source: 'chain' }
    let activatedAtMs = null
    const ts = match.timestamp ?? match.creationTime ?? match.createTime
    if (typeof ts === 'number') activatedAtMs = ts < 1e12 ? ts * 1000 : ts
    return {
      held: true,
      activatedAtMs,
      identifier: match.identifier || match.tokenIdentifier || null,
      source: 'chain',
    }
  } catch (e) {
    return { held: false, reason: `indexer_error:${e?.message || e}`, source: 'chain' }
  }
}

/** In-memory cache address → access (TTL 45s) for <200ms repeat hits. */
const accessCache = new Map()
const CACHE_TTL_MS = Number(process.env.ACCESS_CACHE_TTL_MS || 45000)

export async function resolveAccessLevel(address) {
  const now = Date.now()
  if (!address || !isErd(address)) {
    return { status: 'NONE', hasAccess: false, reason: 'no_wallet', expiryDate: null, source: 'none' }
  }
  const addr = address.trim()
  const cached = accessCache.get(addr.toLowerCase())
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value

  const put = value => {
    accessCache.set(addr.toLowerCase(), { at: Date.now(), value })
    return value
  }

  if (parseAllowlist().has(addr.toLowerCase())) {
    return put({
      status: 'FULL',
      hasAccess: true,
      reason: 'allowlist',
      expiryDate: new Date(now + DURATION_DAYS * MS_DAY).toISOString(),
      source: 'allowlist',
    })
  }
  const chain = await fetchPulseFromChain(addr)
  if (!chain.held) {
    return put({
      status: 'SAMPLE',
      hasAccess: false,
      reason: chain.reason || 'no_pulse_pack',
      expiryDate: null,
      source: chain.source || 'chain',
    })
  }
  if (chain.activatedAtMs != null) {
    const expiresMs = chain.activatedAtMs + DURATION_DAYS * MS_DAY
    if (now > expiresMs) {
      return put({
        status: 'SAMPLE',
        hasAccess: false,
        reason: 'pulse_expired',
        expiryDate: new Date(expiresMs).toISOString(),
        source: 'chain',
        identifier: chain.identifier,
      })
    }
    return put({
      status: 'FULL',
      hasAccess: true,
      reason: 'pulse_active',
      expiryDate: new Date(expiresMs).toISOString(),
      source: 'chain',
      identifier: chain.identifier,
    })
  }
  return put({
    status: 'FULL',
    hasAccess: true,
    reason: 'pulse_held',
    expiryDate: new Date(now + DURATION_DAYS * MS_DAY).toISOString(),
    source: 'chain',
    identifier: chain.identifier,
  })
}

export function issueAccessToken(access, address, secret) {
  if (!secret || secret.length < 16) {
    return { token: null, error: 'JWT_SECRET missing or too short (min 16)' }
  }
  const nowSec = Math.floor(Date.now() / 1000)
  const payload = {
    sub: address || null,
    level: access.status,
    access_level: access.status,
    reason: access.reason,
    iat: nowSec,
    exp: nowSec + JWT_TTL_SEC,
    iss: 'xartists-access-api',
  }
  return { token: signJwt(payload, secret), expiresIn: JWT_TTL_SEC }
}
