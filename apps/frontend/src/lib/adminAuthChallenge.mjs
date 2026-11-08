/**
 * Admin auth challenge issuer — paper / offline only.
 * Issues single-use challenges bound to admin + action, with TTL.
 * Does NOT open HTTP endpoints, verify wallet signatures, or grant privilege.
 */
import { randomBytes } from 'node:crypto'
import {
  ADMIN_ACTIONS,
  ADMIN_AUTH_MAX_TTL_MS,
  buildAdminAuthMessage,
} from './adminAuthMessage.mjs'

const DEFAULT_TTL_MS = 5 * 60 * 1000

/**
 * @param {object} [opts]
 * @param {() => number} [opts.nowMs]
 * @param {(n?: number) => string} [opts.randomNonce]
 */
export function createAdminChallengeStore(opts = {}) {
  const nowMs = opts.nowMs || (() => Date.now())
  const randomNonce =
    opts.randomNonce ||
    (() => randomBytes(16).toString('base64url').replace(/=+$/, ''))

  /** @type {Map<string, { admin: string, action: string, issuedAtMs: number, expiresAtMs: number, consumed: boolean, contract?: string, escrowId?: string, favorSeller?: boolean, target?: string }>} */
  const byNonce = new Map()

  function purgeExpired(at) {
    for (const [nonce, row] of byNonce) {
      if (row.expiresAtMs <= at || row.consumed) byNonce.delete(nonce)
    }
  }

  return {
    /**
     * Issue a challenge the client must embed in the canonical admin message.
     * @param {object} input
     * @param {string} input.adminBech32
     * @param {import('./adminAuthMessage.mjs').AdminAction | string} input.action
     * @param {number} [input.ttlMs]
     * @param {string} [input.contractBech32]
     * @param {string|number} [input.escrowId]
     * @param {boolean} [input.favorSeller]
     * @param {string} [input.targetBech32]
     */
    issue(input) {
      const at = nowMs()
      purgeExpired(at)
      if (!input || typeof input !== 'object') return { ok: false, error: 'missing_input' }
      if (!ADMIN_ACTIONS.includes(input.action)) return { ok: false, error: 'bad_action' }
      const admin = String(input.adminBech32 || '').trim().toLowerCase()
      if (!/^erd1[a-z0-9]{58}$/.test(admin)) return { ok: false, error: 'bad_admin' }

      const ttl = input.ttlMs == null ? DEFAULT_TTL_MS : Number(input.ttlMs)
      if (!Number.isSafeInteger(ttl) || ttl < 30_000 || ttl > ADMIN_AUTH_MAX_TTL_MS) {
        return { ok: false, error: 'bad_ttl' }
      }

      const nonce = randomNonce()
      if (!/^[A-Za-z0-9_-]{8,128}$/.test(nonce)) return { ok: false, error: 'bad_nonce_generator' }
      if (byNonce.has(nonce)) return { ok: false, error: 'nonce_collision' }

      const issuedAtMs = at
      const expiresAtMs = at + ttl
      const row = {
        admin,
        action: input.action,
        issuedAtMs,
        expiresAtMs,
        consumed: false,
        contract: input.contractBech32,
        escrowId: input.escrowId,
        favorSeller: input.favorSeller,
        target: input.targetBech32,
      }

      let message
      try {
        message = buildAdminAuthMessage({
          action: input.action,
          adminBech32: admin,
          contractBech32: input.contractBech32,
          escrowId: input.escrowId,
          favorSeller: input.favorSeller,
          targetBech32: input.targetBech32,
          nonce,
          issuedAtMs,
          expiresAtMs,
        })
      } catch (e) {
        return { ok: false, error: e?.code || e?.message || 'build_failed' }
      }

      byNonce.set(nonce, row)
      return {
        ok: true,
        nonce,
        issuedAtMs,
        expiresAtMs,
        admin,
        action: input.action,
        message,
        mode: 'paper_challenge_only',
      }
    },

    /**
     * Atomically consume a nonce if it matches admin + action and is still valid.
     * Single-use: second call returns replay.
     */
    consume({ nonce, adminBech32, action, atMs } = {}) {
      const at = atMs == null ? nowMs() : atMs
      purgeExpired(at)
      const n = String(nonce || '').trim()
      if (!n) return { ok: false, error: 'empty_nonce' }
      const row = byNonce.get(n)
      if (!row) return { ok: false, error: 'unknown_nonce' }
      if (row.consumed) return { ok: false, error: 'replay' }
      if (row.expiresAtMs <= at) {
        byNonce.delete(n)
        return { ok: false, error: 'expired' }
      }
      const admin = String(adminBech32 || '').trim().toLowerCase()
      if (admin !== row.admin) return { ok: false, error: 'admin_mismatch' }
      if (action !== row.action) return { ok: false, error: 'action_mismatch' }

      row.consumed = true
      byNonce.delete(n)
      return {
        ok: true,
        admin: row.admin,
        action: row.action,
        issuedAtMs: row.issuedAtMs,
        expiresAtMs: row.expiresAtMs,
        mode: 'paper_consumed',
      }
    },

    size: () => byNonce.size,
  }
}
