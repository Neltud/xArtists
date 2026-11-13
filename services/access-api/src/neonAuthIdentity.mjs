/**
 * Read-only Neon Managed Better Auth JWT verification for walletless identity.
 *
 * This is an INTERNAL adapter, not a public login endpoint. It authenticates
 * the cryptographic issuer and verified-email claim; it does not authorize
 * payment, NFT rights, wallet ownership, admin access or subscriptions.
 *
 * Managed Better Auth signs 15-minute JWTs with EdDSA/Ed25519. JWKS is taken
 * only from the operator-supplied, exact Neon Auth base URL, NEVER from token
 * headers (jku, x5u, etc.) or request bodies.
 */
import { createPublicKey, verify as verifySignature } from 'node:crypto'
import { findOrCreateAccountForVerifiedIdentity,findExistingAccountForVerifiedIdentity } from './accountRepository.mjs'

const INVALID = 'neon_auth_identity_unverified'
const SEGMENT = /^[A-Za-z0-9_-]+$/
const DEFAULT_CACHE_MS = 30_000

function deny() { throw new Error(INVALID) }

function canonicalBaseUrl(baseUrl) {
  if (typeof baseUrl !== 'string' || baseUrl.length > 1024) throw new Error('neon_auth_not_configured')
  let parsed
  try { parsed = new URL(baseUrl) } catch { throw new Error('neon_auth_not_configured') }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password ||
      parsed.search || parsed.hash || parsed.port ||
      !parsed.hostname.endsWith('.neon.tech') ||
      !/^\/[A-Za-z0-9_-]+\/auth\/?$/.test(parsed.pathname)) {
    throw new Error('neon_auth_not_configured')
  }
  return { origin: parsed.origin, jwksUrl: parsed.href.replace(/\/$/, '') + '/.well-known/jwks.json' }
}

function decodePart(input, maxSize) {
  if (typeof input !== 'string' || !SEGMENT.test(input) || input.length > maxSize) deny()
  let buf
  try { buf = Buffer.from(input, 'base64url') } catch { deny() }
  if (buf.toString('base64url') !== input) deny()
  return buf
}

function decodeObject(input, maxSize) {
  const bytes = decodePart(input, maxSize)
  try {
    const value = JSON.parse(bytes.toString('utf8'))
    if (!value || typeof value !== 'object' || Array.isArray(value)) deny()
    return value
  } catch { deny() }
}

function publicEd25519Key(jwk) {
  if (!jwk || jwk.kty !== 'OKP' || jwk.crv !== 'Ed25519' ||
      (jwk.use !== undefined && jwk.use !== 'sig') ||
      (jwk.alg !== undefined && jwk.alg !== 'EdDSA') ||
      jwk.d !== undefined || typeof jwk.x !== 'string') deny()
  if (decodePart(jwk.x, 128).length !== 32) deny()
  try { return createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: jwk.x }, format: 'jwk' }) }
  catch { deny() }
}

/**
 * Configure with the explicitly selected Neon Auth environment base URL,
 * e.g. NEON_AUTH_BASE_URL (server-only, not supplied by a browser).
 *
 * An inaccessible JWKS denies login; no offline fallback or unsigned JWT.
 * The cache is bounded and never survives the verifier instance.
 */
export function createNeonAuthIdentityVerifier({
  baseUrl, fetchImpl = fetch, clock = Date.now, cacheMs = DEFAULT_CACHE_MS,
} = {}) {
  const config = canonicalBaseUrl(baseUrl)
  if (typeof fetchImpl !== 'function' || typeof clock !== 'function' ||
      !Number.isSafeInteger(cacheMs) || cacheMs < 0 || cacheMs > 60_000) {
    throw new TypeError('invalid_neon_auth_verifier_configuration')
  }

  let cached = null
  let cachedUntil = 0
  async function refresh() {
    let response
    try {
      response = await fetchImpl(config.jwksUrl, {
        method: 'GET', redirect: 'error',
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(4_000),
      })
      if (!response?.ok) deny()
      const raw = await response.text()
      if (typeof raw !== 'string' || raw.length > 16_384) deny()
      const value = JSON.parse(raw)
      if (!Array.isArray(value?.keys) || value.keys.length < 1 || value.keys.length > 16) deny()
      if (value.keys.some(k => !k || typeof k.kid !== 'string' ||
          !/^[A-Za-z0-9._-]{1,128}$/.test(k.kid))) deny()
      cached = value.keys
      cachedUntil = clock() + cacheMs
      return cached
    } catch { deny() }
  }

  return async function verifyNeonAuthIdentity(token) {
    if (typeof token !== 'string' || token.length < 64 || token.length > 8_192) deny()
    const parts = token.split('.')
    if (parts.length !== 3) deny()
    const [h, p, s] = parts
    const header = decodeObject(h, 1_024)
    const payload = decodeObject(p, 6_144)
    if (header.alg !== 'EdDSA' || (header.typ !== undefined && header.typ !== 'JWT') ||
        header.crit !== undefined || !/^[A-Za-z0-9._-]{1,128}$/.test(header.kid || '')) deny()
    const signature = decodePart(s, 256)
    if (signature.length !== 64) deny()

    const nowMs = clock()
    if (!Number.isFinite(nowMs) || nowMs < 0) deny()
    const nowSec = Math.floor(nowMs / 1_000)
    if (payload.iss !== config.origin || payload.aud !== config.origin ||
        !Number.isSafeInteger(payload.iat) || !Number.isSafeInteger(payload.exp) ||
        payload.iat > nowSec + 30 || payload.exp <= nowSec ||
        payload.exp <= payload.iat || payload.exp - payload.iat > 960 ||
        (payload.nbf !== undefined && (!Number.isSafeInteger(payload.nbf) || payload.nbf > nowSec)) ||
        typeof payload.sub !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(payload.sub) ||
        (payload.id !== undefined && payload.id !== payload.sub) ||
        payload.emailVerified !== true ||
        typeof payload.email !== 'string' || payload.email.length > 320 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) ||
        payload.banned !== false) deny()

    let keys = cached && nowMs < cachedUntil ? cached : await refresh()
    let matches = keys.filter(key => key.kid === header.kid)
    if (matches.length === 0 && cached && nowMs < cachedUntil) {
      keys = await refresh() // rotation; don't accept unknown keys from token header
      matches = keys.filter(key => key.kid === header.kid)
    }
    if (matches.length !== 1) deny()

    const key = publicEd25519Key(matches[0])
    if (!verifySignature(null, Buffer.from(h + '.' + p, 'ascii'), key, signature)) deny()

    return Object.freeze({
      provider: 'email_oidc',
      // Namespaced by the exact auth instance: other Neon environments cannot
      // resolve the same internal account via an equal opaque sub claim.
      subject: config.jwksUrl + '#' + payload.sub,
      verifiedAt: new Date(nowMs).toISOString(),
    })
  }
}

/**
 * Only a cryptographically verified, email-confirmed Neon JWT may be mapped
 * into an internal account. No wallet link, subscription, mint or privilege.
 * Production requires approved auth config, migrations and DB identity proof.
 */
export async function findOrCreateAccountFromNeonToken(pool, token, verifier) {
  if (typeof verifier !== 'function') throw new TypeError('server_neon_auth_verifier_required')
  const identity = await verifier(token)
  if (!identity || identity.provider !== 'email_oidc' ||
      typeof identity.subject !== 'string' || !identity.subject ||
      typeof identity.verifiedAt !== 'string') deny()
  return findOrCreateAccountForVerifiedIdentity(pool, identity)
}

/** Verified Neon JWT → existing active account UUID; no account creation. */
export async function findExistingAccountFromNeonToken(pool, token, verifier) {
  if(typeof verifier!=='function')throw new TypeError('server_neon_auth_verifier_required')
  const identity=await verifier(token)
  if(!identity||identity.provider!=='email_oidc'||typeof identity.subject!=='string'||
     !identity.subject||typeof identity.verifiedAt!=='string')deny()
  return findExistingAccountForVerifiedIdentity(pool,identity)
}
