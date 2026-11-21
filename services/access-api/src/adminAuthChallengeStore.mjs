/**
 * Durable admin auth challenge store (Postgres).
 * Paper boundary: does not verify wallet signatures, open HTTP, or grant SC powers.
 */
import { randomBytes } from 'node:crypto'

const ADMIN_ACTIONS = new Set([
  'resolveDispute',
  'setAttestor',
  'setPaused',
  'refund',
  'cancelByOwner',
  'transferOwnership',
])
const DOMAIN = 'xArtists.admin.v1'
const CHAIN_ID = '1'
const MAX_TTL_MS = 600_000
const MIN_TTL_MS = 30_000
const DEFAULT_TTL_MS = 300_000

function isBech32(value) {
  return /^erd1[a-z0-9]{58}$/.test(String(value || '').trim().toLowerCase())
}

function normalizeAdmin(value) {
  return String(value || '').trim().toLowerCase()
}

export function buildMessage(row) {
  const lines = [
    DOMAIN,
    `chainId=${CHAIN_ID}`,
    `action=${row.action}`,
    `admin=${row.admin_bech32}`,
    `contract=${row.contract_bech32 || '-'}`,
    `escrowId=${row.escrow_id == null ? '-' : String(row.escrow_id)}`,
    `favorSeller=${row.favor_seller === true ? '1' : row.favor_seller === false ? '0' : '-'}`,
    `target=${row.target_bech32 || '-'}`,
    `nonce=${row.nonce}`,
    `issuedAt=${row.issued_at_ms}`,
    `expiresAt=${row.expires_at_ms}`,
  ]
  return lines.join('\n')
}

function validateIssueInput(input) {
  if (!input || typeof input !== 'object') return 'missing_input'
  if (!ADMIN_ACTIONS.has(input.action)) return 'bad_action'
  if (!isBech32(input.adminBech32)) return 'bad_admin'
  if (input.contractBech32 && !isBech32(input.contractBech32)) return 'bad_contract'
  if (input.targetBech32 && !isBech32(input.targetBech32)) return 'bad_target'
  const ttl = input.ttlMs == null ? DEFAULT_TTL_MS : Number(input.ttlMs)
  if (!Number.isSafeInteger(ttl) || ttl < MIN_TTL_MS || ttl > MAX_TTL_MS) return 'bad_ttl'
  if (input.action === 'resolveDispute') {
    if (input.escrowId == null || input.escrowId === '') return 'escrow_id_required'
    if (typeof input.favorSeller !== 'boolean') return 'favor_seller_required'
  }
  if (
    (input.action === 'refund' || input.action === 'cancelByOwner') &&
    (input.escrowId == null || input.escrowId === '')
  ) {
    return 'escrow_id_required'
  }
  return null
}

/**
 * @param {import('pg').Pool} pool
 * @param {object} [opts]
 * @param {() => number} [opts.nowMs]
 * @param {() => string} [opts.randomNonce]
 */
export function createAdminAuthChallengePgStore(pool, opts = {}) {
  if (!pool || typeof pool.query !== 'function') {
    throw new Error('admin_auth_pg_pool_required')
  }
  const nowMs = opts.nowMs || (() => Date.now())
  const randomNonce =
    opts.randomNonce ||
    (() => randomBytes(16).toString('base64url').replace(/=+$/, ''))

  return {
    mode: 'postgres_candidate',

    async issue(input) {
      const err = validateIssueInput(input)
      if (err) return { ok: false, error: err }

      const admin = normalizeAdmin(input.adminBech32)
      const ttl = input.ttlMs == null ? DEFAULT_TTL_MS : Number(input.ttlMs)
      const issuedAtMs = nowMs()
      const expiresAtMs = issuedAtMs + ttl
      const nonce = randomNonce()
      if (!/^[A-Za-z0-9_-]{8,128}$/.test(nonce)) return { ok: false, error: 'bad_nonce_generator' }

      const escrowId =
        input.escrowId == null || input.escrowId === ''
          ? null
          : String(input.escrowId)
      const favorSeller =
        typeof input.favorSeller === 'boolean' ? input.favorSeller : null
      const contract =
        input.contractBech32 ? normalizeAdmin(input.contractBech32) : null
      const target =
        input.targetBech32 ? normalizeAdmin(input.targetBech32) : null

      try {
        const result = await pool.query(
          `INSERT INTO admin_auth_challenges_v1 (
             nonce, admin_bech32, action, domain, chain_id,
             contract_bech32, escrow_id, favor_seller, target_bech32,
             issued_at_ms, expires_at_ms
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           RETURNING *`,
          [
            nonce,
            admin,
            input.action,
            DOMAIN,
            CHAIN_ID,
            contract,
            escrowId,
            favorSeller,
            target,
            issuedAtMs,
            expiresAtMs,
          ],
        )
        const row = result.rows[0]
        return {
          ok: true,
          nonce: row.nonce,
          issuedAtMs: Number(row.issued_at_ms),
          expiresAtMs: Number(row.expires_at_ms),
          admin: row.admin_bech32,
          action: row.action,
          message: buildMessage({
            ...row,
            issued_at_ms: Number(row.issued_at_ms),
            expires_at_ms: Number(row.expires_at_ms),
          }),
          mode: 'postgres_candidate',
        }
      } catch (e) {
        if (e && e.code === '23505') return { ok: false, error: 'nonce_collision' }
        if (e && e.code === '23514') return { ok: false, error: 'constraint_violation' }
        return { ok: false, error: 'db_error', detail: String(e?.message || e).slice(0, 160) }
      }
    },

    /**
     * Atomic single-use consume. Concurrent callers: only one gets a row.
     */
    async consume({ nonce, adminBech32, action, atMs } = {}) {
      const at = atMs == null ? nowMs() : atMs
      const n = String(nonce || '').trim()
      if (!n) return { ok: false, error: 'empty_nonce' }
      if (!ADMIN_ACTIONS.has(action)) return { ok: false, error: 'bad_action' }
      const admin = normalizeAdmin(adminBech32)
      if (!isBech32(admin)) return { ok: false, error: 'bad_admin' }

      try {
        const result = await pool.query(
          `UPDATE admin_auth_challenges_v1
             SET consumed_at_ms = $4
           WHERE nonce = $1
             AND admin_bech32 = $2
             AND action = $3
             AND consumed_at_ms IS NULL
             AND expires_at_ms > $4
           RETURNING *`,
          [n, admin, action, at],
        )
        if (result.rowCount === 1) {
          const row = result.rows[0]
          return {
            ok: true,
            admin: row.admin_bech32,
            action: row.action,
            issuedAtMs: Number(row.issued_at_ms),
            expiresAtMs: Number(row.expires_at_ms),
            consumedAtMs: Number(row.consumed_at_ms),
            mode: 'postgres_consumed',
          }
        }

        const existing = await pool.query(
          `SELECT admin_bech32, action, expires_at_ms, consumed_at_ms
             FROM admin_auth_challenges_v1 WHERE nonce = $1`,
          [n],
        )
        if (!existing.rowCount) return { ok: false, error: 'unknown_nonce' }
        const row = existing.rows[0]
        if (row.consumed_at_ms != null) return { ok: false, error: 'replay' }
        if (Number(row.expires_at_ms) <= at) return { ok: false, error: 'expired' }
        if (row.admin_bech32 !== admin) return { ok: false, error: 'admin_mismatch' }
        if (row.action !== action) return { ok: false, error: 'action_mismatch' }
        return { ok: false, error: 'consume_failed' }
      } catch (e) {
        return { ok: false, error: 'db_error', detail: String(e?.message || e).slice(0, 160) }
      }
    },
  }
}
