/**
 * Access JWT session — wallet-bound only.
 * Issued by POST /v1/verify-access after SIWX challenge (or supplied proof).
 * Never treat wallet address in query/body as identity proof.
 * Guests (no erd1) cannot obtain a production access token for Paybox.
 * Fail-closed: API/network failure clears any prior session.
 */
import { getAccessApiBase } from './stripe'
import { signAccessMessage } from './signAccessMessage'

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
 * Request a short-lived access JWT bound to the wallet via SIWX proof.
 * If signature/message/nonce are omitted, fetches a challenge and signs via xPortal.
 * Fail-closed on network or non-OK responses (no stale token retention).
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
    let { signature, message, nonce } = opts
    const suppliedProof = Boolean(signature || message || nonce)
    if (suppliedProof && !(signature && message && nonce)) {
      clearAccessSession()
      return null
    }
    if (!suppliedProof) {
      const challengeResponse = await fetch(`${api}/v1/access/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: opts.address }),
      })
      if (!challengeResponse.ok) {
        clearAccessSession()
        return null
      }
      const challenge = (await challengeResponse.json()) as { message?: string; nonce?: string }
      if (
        typeof challenge.message !== 'string' ||
        !challenge.message ||
        typeof challenge.nonce !== 'string' ||
        !challenge.nonce
      ) {
        clearAccessSession()
        return null
      }
      const signed = await signAccessMessage(challenge.message)
      if (!signed.ok || !signed.signature) {
        clearAccessSession()
        return null
      }
      signature = signed.signature
      message = challenge.message
      nonce = challenge.nonce
    }
    const r = await fetch(`${api}/v1/verify-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: opts.address,
        signature,
        message,
        nonce,
      }),
    })
    const data = (await r.json().catch(() => ({}))) as { token?: string; ok?: boolean }
    if (r.ok && data.ok && typeof data.token === 'string' && data.token) {
      storeAccessSession(data.token, opts.address)
      return getAccessToken(opts.address)
    }
    clearAccessSession()
    return null
  } catch {
    clearAccessSession()
    return null
  }
}
