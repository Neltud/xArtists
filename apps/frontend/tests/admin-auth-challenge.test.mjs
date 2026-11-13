import test from 'node:test'
import assert from 'node:assert/strict'
import { createAdminChallengeStore } from '../src/lib/adminAuthChallenge.mjs'
import { parseAndValidateAdminAuthMessage } from '../src/lib/adminAuthMessage.mjs'

const ADMIN = 'erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g'
const OTHER = 'erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg'.padEnd(62, 'q').slice(0, 62)
// OTHER must be valid bech32 length — use a second valid-looking address from prior fixtures:
const ADMIN2 = 'erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l'

test('issue returns canonical message embeddable in wallet sign flow', () => {
  let t = 1_700_000_000_000
  const store = createAdminChallengeStore({
    nowMs: () => t,
    randomNonce: () => 'challengeNonce01',
  })
  const issued = store.issue({ adminBech32: ADMIN, action: 'setPaused', ttlMs: 60_000 })
  assert.equal(issued.ok, true)
  assert.equal(issued.nonce, 'challengeNonce01')
  const parsed = parseAndValidateAdminAuthMessage(issued.message, {
    expectedAdminBech32: ADMIN,
    nowMs: t + 1_000,
  })
  assert.equal(parsed.ok, true)
  assert.equal(parsed.nonce, 'challengeNonce01')
  assert.equal(parsed.action, 'setPaused')
})

test('consume is single-use and bound to admin + action', () => {
  let t = 1_700_000_000_000
  const store = createAdminChallengeStore({
    nowMs: () => t,
    randomNonce: () => 'challengeNonce02',
  })
  const issued = store.issue({ adminBech32: ADMIN, action: 'setAttestor', ttlMs: 120_000 })
  assert.equal(issued.ok, true)

  assert.equal(
    store.consume({ nonce: issued.nonce, adminBech32: ADMIN2, action: 'setAttestor', atMs: t + 1 }).error,
    'admin_mismatch',
  )
  assert.equal(
    store.consume({ nonce: issued.nonce, adminBech32: ADMIN, action: 'setPaused', atMs: t + 1 }).error,
    'action_mismatch',
  )

  const first = store.consume({ nonce: issued.nonce, adminBech32: ADMIN, action: 'setAttestor', atMs: t + 1 })
  assert.equal(first.ok, true)
  const second = store.consume({ nonce: issued.nonce, adminBech32: ADMIN, action: 'setAttestor', atMs: t + 2 })
  assert.equal(second.error, 'unknown_nonce') // deleted after consume
})

test('expired challenges cannot be consumed', () => {
  let t = 1_700_000_000_000
  const store = createAdminChallengeStore({
    nowMs: () => t,
    randomNonce: () => 'challengeNonce03',
  })
  const issued = store.issue({ adminBech32: ADMIN, action: 'setPaused', ttlMs: 60_000 })
  t = t + 60_001
  assert.equal(
    store.consume({ nonce: issued.nonce, adminBech32: ADMIN, action: 'setPaused', atMs: t }).error,
    'expired',
  )
})

test('resolveDispute challenge requires favorSeller and escrowId', () => {
  const store = createAdminChallengeStore({
    nowMs: () => 1_700_000_000_000,
    randomNonce: () => 'challengeNonce04',
  })
  const bad = store.issue({ adminBech32: ADMIN, action: 'resolveDispute', ttlMs: 60_000 })
  assert.equal(bad.ok, false)
  const ok = store.issue({
    adminBech32: ADMIN,
    action: 'resolveDispute',
    escrowId: 42,
    favorSeller: false,
    ttlMs: 60_000,
  })
  assert.equal(ok.ok, true)
  assert.match(ok.message, /favorSeller=0/)
  assert.match(ok.message, /escrowId=42/)
})

test('NO-GO markers: module does not open network or claim production auth', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync(new URL('../src/lib/adminAuthChallenge.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(src, /\bfetch\s*\(|\baxios\b|express|fastify|PRIVATE_KEY/)
  assert.match(src, /paper_challenge_only/)
})
