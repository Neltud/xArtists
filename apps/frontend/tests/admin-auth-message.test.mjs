import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ADMIN_AUTH_DOMAIN,
  ADMIN_AUTH_MAX_TTL_MS,
  buildAdminAuthMessage,
  parseAndValidateAdminAuthMessage,
  createNonceStore,
} from '../src/lib/adminAuthMessage.mjs'

const ADMIN = 'erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g'
const OTHER = 'erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l'

function base(over = {}) {
  const issuedAtMs = 1_700_000_000_000
  return {
    action: 'resolveDispute',
    adminBech32: ADMIN,
    contractBech32: OTHER,
    escrowId: 7,
    favorSeller: true,
    nonce: 'nonce-abc-001',
    issuedAtMs,
    expiresAtMs: issuedAtMs + 5 * 60 * 1000,
    ...over,
  }
}

test('builds canonical multiline message with domain', () => {
  const text = buildAdminAuthMessage(base())
  assert.equal(text.split('\n')[0], ADMIN_AUTH_DOMAIN)
  assert.match(text, /action=resolveDispute/)
  assert.match(text, /favorSeller=1/)
  assert.match(text, /escrowId=7/)
  assert.match(text, new RegExp(`admin=${ADMIN}`))
})

test('rejects expired and wrong domain messages', () => {
  const text = buildAdminAuthMessage(base())
  const issued = 1_700_000_000_000
  assert.equal(parseAndValidateAdminAuthMessage(text, { nowMs: issued + 1 }).ok, true)
  assert.equal(
    parseAndValidateAdminAuthMessage(text, { nowMs: issued + 6 * 60 * 1000 }).error,
    'expired',
  )
  const bad = text.replace(ADMIN_AUTH_DOMAIN, 'evil.domain')
  assert.equal(parseAndValidateAdminAuthMessage(bad, { nowMs: issued + 1 }).error, 'bad_domain')
})

test('rejects admin mismatch and replayed nonce', () => {
  const text = buildAdminAuthMessage(base())
  const issued = 1_700_000_000_000
  assert.equal(
    parseAndValidateAdminAuthMessage(text, { nowMs: issued + 1, expectedAdminBech32: OTHER }).error,
    'admin_mismatch',
  )
  const parsed = parseAndValidateAdminAuthMessage(text, { nowMs: issued + 1 })
  assert.equal(parsed.ok, true)
  const store = createNonceStore()
  assert.equal(store.consume(parsed.nonce).ok, true)
  assert.equal(store.consume(parsed.nonce).error, 'replay')
})

test('ttl cannot exceed max and favorSeller required for resolveDispute', () => {
  const issuedAtMs = 1_700_000_000_000
  assert.throws(
    () =>
      buildAdminAuthMessage(
        base({ expiresAtMs: issuedAtMs + ADMIN_AUTH_MAX_TTL_MS + 1 }),
      ),
    /ttl_too_long/,
  )
  assert.throws(() => buildAdminAuthMessage(base({ favorSeller: undefined })), /favor_seller_required/)
})

test('NO-GO: module never imports network clients or secret material', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync(new URL('../src/lib/adminAuthMessage.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(src, /\bfetch\s*\(|\baxios\b|PRIVATE_KEY|mnemonic|\.pem\b/)
})
