import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createAdminSessionBinder,
  assertChallengeIssuanceAllowed,
} from '../src/adminAuthSessionBinding.mjs'

const ADMIN = 'erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g'
const OTHER = 'erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l'

test('rejects paste_readonly and unknown methods', () => {
  const binder = createAdminSessionBinder({ adminAllowlist: [ADMIN] })
  assert.equal(
    binder.bindSession({ adminBech32: ADMIN, method: 'paste_readonly' }).error,
    'paste_identity_forbidden',
  )
  assert.equal(
    binder.bindSession({ adminBech32: ADMIN, method: 'magic_link' }).error,
    'unsupported_auth_method',
  )
})

test('allowlist and session admin match required for challenge issue', () => {
  let t = 1_700_000_000_000
  const binder = createAdminSessionBinder({
    nowMs: () => t,
    adminAllowlist: [ADMIN],
    randomId: () => 'sess_fixed_1',
  })
  assert.equal(
    binder.bindSession({ adminBech32: OTHER, method: 'extension' }).error,
    'admin_not_allowlisted',
  )
  const bound = binder.bindSession({ adminBech32: ADMIN, method: 'extension' })
  assert.equal(bound.ok, true)

  const ok = assertChallengeIssuanceAllowed({
    binder,
    sessionId: bound.sessionId,
    adminBech32: ADMIN,
    atMs: t + 1_000,
  })
  assert.equal(ok.ok, true)

  assert.equal(
    assertChallengeIssuanceAllowed({
      binder,
      sessionId: bound.sessionId,
      adminBech32: OTHER,
      atMs: t + 1_000,
    }).error,
    'session_admin_mismatch',
  )
})

test('expired session cannot issue challenges', () => {
  let t = 1_700_000_000_000
  const binder = createAdminSessionBinder({
    nowMs: () => t,
    adminAllowlist: [ADMIN],
    randomId: () => 'sess_fixed_2',
  })
  const bound = binder.bindSession({
    adminBech32: ADMIN,
    method: 'web_wallet',
    ttlMs: 120_000,
  })
  t = t + 120_001
  assert.equal(
    assertChallengeIssuanceAllowed({
      binder,
      sessionId: bound.sessionId,
      adminBech32: ADMIN,
      atMs: t,
    }).error,
    'session_expired',
  )
})

test('missing operator allowlist fails closed even for apparently authenticated methods', () => {
  const binder = createAdminSessionBinder()
  const denied = binder.bindSession({adminBech32: ADMIN, method:'extension'})
  assert.equal(denied.ok,false)
  assert.equal(denied.error,'admin_not_allowlisted')
})

test('default session IDs are cryptographically random 256-bit URL-safe tokens', () => {
  const binder = createAdminSessionBinder({adminAllowlist:[ADMIN]})
  const first = binder.bindSession({adminBech32:ADMIN,method:'siwx'})
  const second = binder.bindSession({adminBech32:ADMIN,method:'siwx'})
  assert.equal(first.ok,true)
  assert.equal(second.ok,true)
  assert.match(first.sessionId,/^[A-Za-z0-9_-]{43}$/)
  assert.match(second.sessionId,/^[A-Za-z0-9_-]{43}$/)
  assert.notEqual(first.sessionId,second.sessionId)
})
