/**
 * Admin action message schema — paper / offline only.
 * Canonical payload for MultiversX wallet signing of sensitive RWA/admin acts.
 * Does NOT verify signatures (no keys). Does NOT broadcast transactions.
 */

export const ADMIN_AUTH_DOMAIN = 'xArtists.admin.v1'
export const ADMIN_AUTH_CHAIN_ID = '1'
export const ADMIN_AUTH_MAX_TTL_MS = 10 * 60 * 1000

/** @typedef {'resolveDispute' | 'setAttestor' | 'setPaused' | 'refund' | 'cancelByOwner' | 'transferOwnership'} AdminAction */

export const ADMIN_ACTIONS = Object.freeze([
  'resolveDispute',
  'setAttestor',
  'setPaused',
  'refund',
  'cancelByOwner',
  'transferOwnership',
])

/**
 * @param {object} input
 * @param {AdminAction} input.action
 * @param {string} input.adminBech32
 * @param {string} [input.contractBech32]
 * @param {string|number} [input.escrowId]
 * @param {boolean} [input.favorSeller]
 * @param {string} [input.targetBech32]
 * @param {string} input.nonce
 * @param {number} input.issuedAtMs
 * @param {number} input.expiresAtMs
 * @param {string} [input.chainId]
 * @param {string} [input.domain]
 */
export function buildAdminAuthMessage(input) {
  const errors = validateAdminAuthFields(input)
  if (errors.length) {
    const err = new Error(errors.join('; '))
    err.code = 'admin_auth_invalid'
    throw err
  }
  const domain = input.domain || ADMIN_AUTH_DOMAIN
  const chainId = input.chainId || ADMIN_AUTH_CHAIN_ID
  const lines = [
    domain,
    `chainId=${chainId}`,
    `action=${input.action}`,
    `admin=${normalizeBech32(input.adminBech32)}`,
    `contract=${normalizeBech32(input.contractBech32 || '') || '-'}`,
    `escrowId=${input.escrowId == null || input.escrowId === '' ? '-' : String(input.escrowId)}`,
    `favorSeller=${input.favorSeller === true ? '1' : input.favorSeller === false ? '0' : '-'}`,
    `target=${normalizeBech32(input.targetBech32 || '') || '-'}`,
    `nonce=${String(input.nonce).trim()}`,
    `issuedAt=${input.issuedAtMs}`,
    `expiresAt=${input.expiresAtMs}`,
  ]
  return lines.join('\n')
}

/**
 * Parse and validate a message string against expected admin + now.
 * Does not check cryptographic signature.
 */
export function parseAndValidateAdminAuthMessage(text, opts = {}) {
  const now = opts.nowMs ?? Date.now()
  const expectedAdmin = opts.expectedAdminBech32
    ? normalizeBech32(opts.expectedAdminBech32)
    : null
  const lines = String(text || '').split('\n')
  if (lines.length !== 11) return { ok: false, error: 'bad_line_count' }
  if (lines[0] !== ADMIN_AUTH_DOMAIN) return { ok: false, error: 'bad_domain' }

  const map = {}
  for (let i = 1; i < lines.length; i++) {
    const idx = lines[i].indexOf('=')
    if (idx < 1) return { ok: false, error: 'bad_kv' }
    map[lines[i].slice(0, idx)] = lines[i].slice(idx + 1)
  }

  const required = [
    'chainId',
    'action',
    'admin',
    'contract',
    'escrowId',
    'favorSeller',
    'target',
    'nonce',
    'issuedAt',
    'expiresAt',
  ]
  for (const k of required) {
    if (!(k in map)) return { ok: false, error: `missing_${k}` }
  }

  if (map.chainId !== ADMIN_AUTH_CHAIN_ID) return { ok: false, error: 'bad_chain' }
  if (!ADMIN_ACTIONS.includes(map.action)) return { ok: false, error: 'bad_action' }
  if (!isBech32(map.admin)) return { ok: false, error: 'bad_admin' }
  if (expectedAdmin && map.admin !== expectedAdmin) return { ok: false, error: 'admin_mismatch' }

  const issuedAt = Number(map.issuedAt)
  const expiresAt = Number(map.expiresAt)
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) return { ok: false, error: 'bad_time' }
  if (expiresAt <= issuedAt) return { ok: false, error: 'expiry_before_issue' }
  if (expiresAt - issuedAt > ADMIN_AUTH_MAX_TTL_MS) return { ok: false, error: 'ttl_too_long' }
  if (now > expiresAt) return { ok: false, error: 'expired' }
  if (now + 30_000 < issuedAt) return { ok: false, error: 'issued_in_future' }
  if (!map.nonce || map.nonce.length < 8 || map.nonce.length > 128) return { ok: false, error: 'bad_nonce' }

  return {
    ok: true,
    action: map.action,
    admin: map.admin,
    contract: map.contract === '-' ? null : map.contract,
    escrowId: map.escrowId === '-' ? null : map.escrowId,
    favorSeller: map.favorSeller === '1' ? true : map.favorSeller === '0' ? false : null,
    target: map.target === '-' ? null : map.target,
    nonce: map.nonce,
    issuedAtMs: issuedAt,
    expiresAtMs: expiresAt,
    chainId: map.chainId,
  }
}

/** In-memory anti-replay helper for tests / future server. */
export function createNonceStore() {
  const used = new Set()
  return {
    /** @param {string} nonce */
    consume(nonce) {
      const n = String(nonce || '').trim()
      if (!n) return { ok: false, error: 'empty_nonce' }
      if (used.has(n)) return { ok: false, error: 'replay' }
      used.add(n)
      return { ok: true }
    },
    size: () => used.size,
  }
}

function validateAdminAuthFields(input) {
  const errors = []
  if (!input || typeof input !== 'object') return ['missing_input']
  if (!ADMIN_ACTIONS.includes(input.action)) errors.push('bad_action')
  if (!isBech32(input.adminBech32)) errors.push('bad_admin')
  if (input.contractBech32 && !isBech32(input.contractBech32)) errors.push('bad_contract')
  if (input.targetBech32 && !isBech32(input.targetBech32)) errors.push('bad_target')
  if (!input.nonce || String(input.nonce).trim().length < 8) errors.push('bad_nonce')
  if (!Number.isFinite(input.issuedAtMs) || !Number.isFinite(input.expiresAtMs)) errors.push('bad_time')
  else if (input.expiresAtMs <= input.issuedAtMs) errors.push('expiry_before_issue')
  else if (input.expiresAtMs - input.issuedAtMs > ADMIN_AUTH_MAX_TTL_MS) errors.push('ttl_too_long')
  if (input.action === 'resolveDispute' && typeof input.favorSeller !== 'boolean') {
    errors.push('favor_seller_required')
  }
  if (
    (input.action === 'resolveDispute' || input.action === 'refund' || input.action === 'cancelByOwner') &&
    (input.escrowId == null || input.escrowId === '')
  ) {
    errors.push('escrow_id_required')
  }
  return errors
}

function normalizeBech32(value) {
  return String(value || '').trim().toLowerCase()
}

function isBech32(value) {
  return /^erd1[a-z0-9]{58}$/.test(normalizeBech32(value))
}
