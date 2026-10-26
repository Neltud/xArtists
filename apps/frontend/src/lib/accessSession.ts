/**
 * Access JWT session — wallet-bound only.
 * Issued by POST /v1/verify-access after SIWX (or allowlist path).
 * Never treat wallet address in query/body as identity proof.
 * Guests (no erd1) cannot obtain a production access token for Paybox.
 */
import { getAccessApiBase } from './stripe'

const STORAGE_KEY = 'xartists_access_jwt'
const STORAGE_ADDR = 'xartists_access_jwt_addr'

export type AccessSession = {
  token: string
  address: string
  expiresAt: number
}

function readSession(): AccessSession | null {
  try {
    const token = sessionStorage.getItem(STORAGE_KEY)
    const address = sessionStorage.getItem(STORAGE_ADDR)
    if (!token || !address) return null
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    const exp = Number(payload.exp) * 1000
    if (!Number.isFinite(exp) || Date.now() >= exp - 15_000) {
      clearAccessSession()
      return null
    }
    if (String(payload.sub || '').toLowerCase() !== address.toLowerCase()) {
      clearAccessSession()
      return null
    }
    return { token, address, expiresAt: exp }
  } catch {
    return null
  }
}

export function getAccessToken(forAddress?: string): string | null {
  const s = readSession()
  if (!s) return null
  if (forAddress && s.address.toLowerCase() !== forAddress.toLowerCase()) return null
  return s.token
}

export function clearAccessSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_ADDR)
  } catch {
    /* */
  }
}

export function storeAccessSession(token: string, address: string) {
  if (!token || !/^erd1[a-z0-9]{58}$/i.test(address)) return
  try {
    sessionStorage.setItem(STORAGE_KEY, token)
    sessionStorage.setItem(STORAGE_ADDR, address)
  } catch {
    /* */
  }
}

/**
 * Request a short-lived access JWT bound to the wallet.
 * Without SIWX proof the API returns SAMPLE / 401 for FULL paths;
 * for Paybox checkout we still need a valid Bearer when JWT secret is configured.
 */
export async function ensureAccessToken(opts: {
  address: string
  signature?: string
  message?: string
  nonce?: string
}): Promise<string | null> {
  const existing = getAccessToken(opts.address)
  if (existing) return existing

  const api = getAccessApiBase()
  if (!api || !/^erd1[a-z0-9]{58}$/i.test(opts.address)) return null

  try {
    const r = await fetch(`${api}/v1/verify-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: opts.address,
        signature: opts.signature,
        message: opts.message,
        nonce: opts.nonce,
      }),
    })
    const data = (await r.json().catch(() => ({}))) as { token?: string; ok?: boolean }
    if (r.ok && data.token) {
      storeAccessSession(data.token, opts.address)
      return data.token
    }
  } catch {
    /* */
  }
  return getAccessToken(opts.address)
}
