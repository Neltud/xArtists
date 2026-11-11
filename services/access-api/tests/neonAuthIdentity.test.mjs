import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, sign } from 'node:crypto'
import {
  createNeonAuthIdentityVerifier, findOrCreateAccountFromNeonToken,
} from '../src/neonAuthIdentity.mjs'

const baseUrl = 'https://ep-fixture.neonauth.c-8.eu-central-1.aws.neon.tech/xartists_access/auth'
const origin = new URL(baseUrl).origin
const nowMs = Date.parse('2026-11-10T12:00:00.000Z')
const sec = Math.floor(nowMs / 1000)
const { privateKey, publicKey } = generateKeyPairSync('ed25519')
const jwk = { ...publicKey.export({ format: 'jwk' }), alg: 'EdDSA', use: 'sig', kid: 'fixture-1' }
const baseClaims = {
  iss: origin, aud: origin, sub: 'fb2c64c1-92f0-4f37-8f42-8c9ce23a78cd',
  id: 'fb2c64c1-92f0-4f37-8f42-8c9ce23a78cd',
  email: 'artist@example.test', emailVerified: true, banned: false,
  iat: sec, exp: sec + 900,
}
const enc = value => Buffer.from(JSON.stringify(value)).toString('base64url')
function signed(claims = {}, header = {}, signer = privateKey) {
  const h = enc({ alg: 'EdDSA', typ: 'JWT', kid: 'fixture-1', ...header })
  const p = enc({ ...baseClaims, ...claims })
  return h + '.' + p + '.' + sign(null, Buffer.from(h + '.' + p), signer).toString('base64url')
}
function makeVerifier({ jwks = { keys: [jwk] }, clock = () => nowMs, failures = false } = {}) {
  let reads = 0
  const fetchImpl = async (url, options) => {
    reads++
    assert.equal(url, baseUrl + '/.well-known/jwks.json')
    assert.equal(options.method, 'GET')
    assert.equal(options.redirect, 'error')
    if (failures) throw new Error('network unavailable')
    return { ok: true, text: async () => JSON.stringify(jwks) }
  }
  return {
    verify: createNeonAuthIdentityVerifier({ baseUrl, fetchImpl, clock }),
    reads: () => reads,
  }
}
async function denied(verify, token) {
  await assert.rejects(verify(token), /neon_auth_identity_unverified/)
}
test('signed verified Neon JWT maps to opaque walletless identity only', async () => {
  const { verify, reads } = makeVerifier()
  const out = await verify(signed())
  assert.deepEqual({ ...out }, {
    provider: 'email_oidc', subject: baseUrl + '/.well-known/jwks.json#' + baseClaims.sub,
    verifiedAt: '2026-11-10T12:00:00.000Z',
  })
  assert.equal(JSON.stringify(out).includes(baseClaims.email), false)
  await verify(signed())
  assert.equal(reads(), 1, 'bounded JWKS cache, no user-controlled URL')
})
test('unsigned, tampered, wrong algorithm, wrong kid and wrong key are denied', async () => {
  const { verify } = makeVerifier()
  const good = signed()
  await denied(verify, good.replace(/.$/, good.at(-1) === 'A' ? 'B' : 'A'))
  const [h,p] = good.split('.')
  await denied(verify, h + '.' + enc({ ...baseClaims, emailVerified: false }) + '.' + good.split('.')[2])
  await denied(verify, signed({}, { alg: 'none' }))
  await denied(verify, signed({}, { alg: 'HS256' }))
  await denied(verify, signed({}, { kid: 'unknown' }))
  await denied(verify, signed({}, { crit: ['exp'] }))
  const impostor = generateKeyPairSync('ed25519').privateKey
  await denied(verify, signed({}, {}, impostor))
  await denied(verify, good + '.extra')
  await denied(verify, 'eyJhbGciOiJub25lIn0.e30.')
  await denied(verify, p)
})
test('wrong issuer, audience, expiry, clock skew and future nbf are denied', async () => {
  const { verify } = makeVerifier()
  for (const claims of [
    { iss: 'https://attacker.example' },
    { aud: 'https://other.neon.tech' },
    { aud: [origin] },
    { exp: sec }, { exp: sec - 1 },
    { exp: sec + 3_600 }, { exp: sec + 961 },
    { iat: sec + 31 }, { iat: 'recent' },
    { nbf: sec + 1 }, { nbf: 'future' },
  ]) await denied(verify, signed(claims))
  await denied(verify, signed({ exp: undefined }))
  await denied(verify, signed({ sub: undefined }))
})
test('unverified email, banned user, missing email or conflicting subject are denied', async () => {
  const { verify } = makeVerifier()
  for (const claims of [
    { emailVerified: false }, { emailVerified: 'true' },
    { banned: true }, { banned: null },
    { email: '' }, { email: 'not-an-email' },
    { sub: '../evil' }, { id: 'different-user' },
    { sub: 42 },
  ]) await denied(verify, signed(claims))
})
test('Neon Auth base URL is pinned to an operator-configured HTTPS instance', () => {
  for (const base of [
    undefined, '', 'http://ep-fixture.neon.tech/x/auth',
    'https://neon.tech.evil.example/x/auth',
    'https://user:pass@ep-fixture.neon.tech/x/auth',
    'https://ep-fixture.neon.tech/x/auth?jwks=evil',
    'https://ep-fixture.neon.tech/x/auth#fragment',
    'https://ep-fixture.neon.tech/evil',
  ]) assert.throws(() => createNeonAuthIdentityVerifier({ baseUrl: base }))
})
test('JWKS must contain one matching public Ed25519 signing key', async () => {
  for (const badJwk of [
    { ...jwk, kty: 'RSA' }, { ...jwk, crv: 'X25519' },
    { ...jwk, alg: 'HS256' }, { ...jwk, use: 'enc' },
    { ...jwk, d: 'private-not-allowed' }, { ...jwk, x: 'c2hvcnQ' },
  ]) {
    const { verify } = makeVerifier({ jwks: { keys: [badJwk] } })
    await denied(verify, signed())
  }
  for (const jwks of [{ keys: [] }, { keys: [jwk, jwk] }, { keys: 'unexpected' }]) {
    const { verify } = makeVerifier({ jwks })
    await denied(verify, signed())
  }
})
test('JWKS outage fails closed; never infers trust from JWT contents', async () => {
  const { verify } = makeVerifier({ failures: true })
  await denied(verify, signed())
})
test('unknown key refreshes from pinned JWKS but still denies unknown kid', async () => {
  const { verify, reads } = makeVerifier()
  await verify(signed())
  await denied(verify, signed({}, { kid: 'rotated-unknown' }))
  assert.equal(reads(), 2)
})
test('verified token maps to account via existing repository; no wallet, NFT or payment side effects', async () => {
  const { verify } = makeVerifier()
  const queries = []
  const client = {
    query: async (sql, params) => {
      queries.push({ sql, params })
      if (sql.includes('SELECT a.id')) return { rows: [{ id: 'de305d54-75b4-431b-adb2-eb6b9e546014' }] }
      return { rows: [] }
    },
    release() {},
  }
  const pool = { connect: async () => client }
  const result = await findOrCreateAccountFromNeonToken(pool, signed(), verify)
  assert.deepEqual(result, { user_id: 'de305d54-75b4-431b-adb2-eb6b9e546014', created: false })
  assert.equal(queries.some(q => q.sql.includes('INSERT') || q.sql.includes('xa_account_wallets')), false)
  assert.equal(queries.some(q => q.sql === 'COMMIT'), true)
  assert.equal(queries.some(q => JSON.stringify(q).includes('artist@example.test')), false)
})
test('bad JWT never touches database or creates account', async () => {
  const { verify } = makeVerifier()
  const pool = { connect: () => { throw new Error('must not access database') } }
  await denied(token => findOrCreateAccountFromNeonToken(pool, token, verify),
    signed({ emailVerified: false }))
})
