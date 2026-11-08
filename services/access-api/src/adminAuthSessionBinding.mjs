/**
 * Admin session binding — paper only.
 * Ensures challenge issuance is tied to an authenticated server session,
 * not a browser-pasted erd1 address.
 * Does NOT issue JWT cookies, open routes, or grant SC powers.
 */

const SESSION_TTL_MS = 30 * 60 * 1000

/**
 * @param {object} [opts]
 * @param {() => number} [opts.nowMs]
 * @param {() => string} [opts.randomId]
 * @param {Set<string> | string[]} [opts.adminAllowlist] bech32 admins permitted
 */
export function createAdminSessionBinder(opts = {}) {
  const nowMs = opts.nowMs || (() => Date.now())
  const randomId =
    opts.randomId ||
    (() => `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`)
  const allowlist = new Set(
    [...(opts.adminAllowlist || [])].map((a) => String(a).trim().toLowerCase()),
  )

  /** @type {Map<string, { admin: string, method: string, issuedAtMs: number, expiresAtMs: number }> } */
  const sessions = new Map()

  return {
    mode: 'paper_session_binding',

    /**
     * Establish a session after a verified wallet challenge (caller responsibility).
     * method must not be paste_readonly.
     */
    bindSession({ adminBech32, method, ttlMs } = {}) {
      const admin = String(adminBech32 || '').trim().toLowerCase()
      if (!/^erd1[a-z0-9]{58}$/.test(admin)) return { ok: false, error: 'bad_admin' }
      if (allowlist.size && !allowlist.has(admin)) return { ok: false, error: 'admin_not_allowlisted' }
      if (!method || method === 'paste_readonly' || method === 'paste') {
        return { ok: false, error: 'paste_identity_forbidden' }
      }
      if (!['extension', 'web_wallet', 'walletconnect', 'hardware', 'siwx'].includes(method)) {
        return { ok: false, error: 'unsupported_auth_method' }
      }
      const ttl = ttlMs == null ? SESSION_TTL_MS : Number(ttlMs)
      if (!Number.isSafeInteger(ttl) || ttl < 60_000 || ttl > SESSION_TTL_MS) {
        return { ok: false, error: 'bad_ttl' }
      }
      const at = nowMs()
      const sessionId = randomId()
      sessions.set(sessionId, {
        admin,
        method,
        issuedAtMs: at,
        expiresAtMs: at + ttl,
      })
      return {
        ok: true,
        sessionId,
        admin,
        method,
        expiresAtMs: at + ttl,
        mode: 'paper_session_bound',
      }
    },

    /**
     * Resolve session and enforce admin match before challenge issue.
     */
    requireSession({ sessionId, expectedAdminBech32, atMs } = {}) {
      const at = atMs == null ? nowMs() : atMs
      const id = String(sessionId || '').trim()
      if (!id) return { ok: false, error: 'missing_session' }
      const row = sessions.get(id)
      if (!row) return { ok: false, error: 'unknown_session' }
      if (row.expiresAtMs <= at) {
        sessions.delete(id)
        return { ok: false, error: 'session_expired' }
      }
      if (expectedAdminBech32) {
        const expected = String(expectedAdminBech32).trim().toLowerCase()
        if (expected !== row.admin) return { ok: false, error: 'session_admin_mismatch' }
      }
      return {
        ok: true,
        sessionId: id,
        admin: row.admin,
        method: row.method,
        expiresAtMs: row.expiresAtMs,
      }
    },

    revoke(sessionId) {
      return sessions.delete(String(sessionId || ''))
    },

    size: () => sessions.size,
  }
}

/**
 * Gate for challenge issuance: session required, paste forbidden.
 */
export function assertChallengeIssuanceAllowed({ binder, sessionId, adminBech32, atMs } = {}) {
  if (!binder || typeof binder.requireSession !== 'function') {
    return { ok: false, error: 'binder_required' }
  }
  const session = binder.requireSession({
    sessionId,
    expectedAdminBech32: adminBech32,
    atMs,
  })
  if (!session.ok) return session
  if (session.method === 'paste_readonly' || session.method === 'paste') {
    return { ok: false, error: 'paste_identity_forbidden' }
  }
  return { ok: true, session }
}
