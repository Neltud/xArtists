/**
 * Zero-trust access gate — FULL only from server-signed JWT.
 * localStorage may cache the token string; it NEVER decides access_level alone.
 */

export type AccessLevel = 'FULL' | 'SAMPLE' | 'NONE'

export interface AccessClaims {
  sub: string | null
  level: AccessLevel
  reason?: string
  iat: number
  exp: number
  iss?: string
}

export interface VerifyAccessResult {
  ok: boolean
  status: AccessLevel
  hasAccess: boolean
  reason?: string
  token: string | null
  expiresIn?: number | null
  expiryDate?: string | null
  source?: string
  sampleLessonId?: string
  error?: string
}

const TOKEN_KEY = 'xartists_access_jwt'
const META_KEY = 'xartists_access_meta'

function apiBase(): string {
  const v = (import.meta as { env?: { VITE_ACCESS_API_BASE?: string } }).env?.VITE_ACCESS_API_BASE
  return (v || '').replace(/\/$/, '')
}

/** Decode JWT payload without verifying signature (verification is server-side). */
export function decodeAccessJwt(token: string): AccessClaims | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(json) as AccessClaims
    if (!payload.exp || Date.now() / 1000 > payload.exp) return null
    const level = String(payload.level || '').toUpperCase()
    if (level !== 'FULL' && level !== 'SAMPLE' && level !== 'NONE') return null
    return { ...payload, level: level as AccessLevel }
  } catch {
    return null
  }
}

export function readStoredAccessToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function clearStoredAccessToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(META_KEY)
    localStorage.removeItem(META_KEY)
  } catch {
    /* */
  }
}

function storeToken(token: string, meta: Record<string, unknown>): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(META_KEY, JSON.stringify(meta))
    // optional mirror — still not authoritative without valid exp claims
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* */
  }
}

/**
 * Effective access for UI unlocks.
 * FULL only if a non-expired JWT claims level FULL and sub matches wallet (when provided).
 */
export function resolveClientAccess(wallet?: string | null): {
  level: AccessLevel
  claims: AccessClaims | null
  token: string | null
} {
  const token = readStoredAccessToken()
  if (!token) return { level: 'SAMPLE', claims: null, token: null }
  const claims = decodeAccessJwt(token)
  if (!claims) {
    clearStoredAccessToken()
    return { level: 'SAMPLE', claims: null, token: null }
  }
  if (wallet && claims.sub && claims.sub.toLowerCase() !== wallet.trim().toLowerCase()) {
    return { level: 'SAMPLE', claims, token }
  }
  if (claims.level === 'FULL') return { level: 'FULL', claims, token }
  if (claims.level === 'NONE') return { level: 'NONE', claims, token }
  return { level: 'SAMPLE', claims, token }
}

/**
 * Call access-api. Never elevates FULL based on local flags.
 */
export async function verifyAccessWithServer(address: string): Promise<VerifyAccessResult> {
  const base = apiBase()
  if (!base) {
    return {
      ok: false,
      status: 'SAMPLE',
      hasAccess: false,
      token: null,
      reason: 'access_api_not_configured',
      error: 'VITE_ACCESS_API_BASE missing — SAMPLE only',
    }
  }
  if (!/^erd1[a-z0-9]{58}$/i.test(address.trim())) {
    return {
      ok: false,
      status: 'NONE',
      hasAccess: false,
      token: null,
      reason: 'invalid_address',
    }
  }

  const endpoints = [`${base}/v1/verify-access`, `${base}/api/verify-access`]
  let lastErr = 'network'
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ address: address.trim() }),
      })
      const data = (await res.json()) as VerifyAccessResult & { status?: string }
      const status = (String(data.status || 'SAMPLE').toUpperCase() as AccessLevel) || 'SAMPLE'
      if (data.token && status === 'FULL') {
        storeToken(data.token, { status, reason: data.reason, at: Date.now() })
      } else if (data.token) {
        storeToken(data.token, { status, reason: data.reason, at: Date.now() })
      }
      return {
        ok: Boolean(data.ok ?? res.ok),
        status: status === 'FULL' || status === 'NONE' ? status : 'SAMPLE',
        hasAccess: Boolean(data.hasAccess) && status === 'FULL',
        reason: data.reason,
        token: data.token || null,
        expiresIn: data.expiresIn,
        expiryDate: data.expiryDate,
        source: data.source,
        sampleLessonId: data.sampleLessonId,
        error: data.error,
      }
    } catch (e) {
      lastErr = e instanceof Error ? e.message : 'fetch_failed'
    }
  }
  return {
    ok: false,
    status: 'SAMPLE',
    hasAccess: false,
    token: null,
    reason: 'verify_failed',
    error: lastErr,
  }
}

/** Guard for premium modules — JWT FULL required. */
export function requireFullAccess(wallet?: string | null): boolean {
  return resolveClientAccess(wallet).level === 'FULL'
}
