import { test } from 'node:test'
import assert from 'node:assert/strict'
import { authorizeXorusReportRead, XORUS_OFFER_SCOPES } from '../src/xorusEntitlements.mjs'

const now = 1_800_000_000_000
const reportId = 'a'.repeat(64)
const email = { kind: 'email', subject: '550e8400-e29b-41d4-a716-446655440000', verified: true,
  proof: 'verified_email_session' }
const wallet = { kind: 'wallet', subject: 'erd1' + 'q'.repeat(58), verified: true,
  proof: 'siwx_verified' }
const grant = (actor = email, offer = 'pulse') => ({
  grantId: 'xag_abcdefghijklmnop',
  subject: actor.subject, subjectKind: actor.kind, offer, scope: XORUS_OFFER_SCOPES[offer],
  issuedAt: now - 5000, expiresAt: now + 86_400_000,
  ledgerCheckedAt: now - 200, status: 'active', revokedAt: null, refundedAt: null,
  quotaRemaining: 3, quotaResetAt: now + 60_000,
  evidence: actor.kind === 'email'
    ? { kind: 'verified_psp_subscription', verified: true, checkedAt: now - 200,
        eventId: 'evt_abcdefghijklmnop', settlement: 'verified', billingStatus: 'active' }
    : { kind: 'verified_mvx_nft_ownership', verified: true, checkedAt: now - 200,
        owner: actor.subject, chainId: '1', tokenIdentifier: 'ASFT-a6273a-01',
        contract: 'erd1' + 'p'.repeat(58) },
})
const report = (offer = 'pulse') => ({
  reportId, offer, scope: XORUS_OFFER_SCOPES[offer], kind: 'derived_xartists_analysis',
  visibility: 'private', status: 'ready', rawDataIncluded: false,
  commercialUsageApproved: true, sourceTs: now - 10_000, generatedAt: now - 5000,
  expiresAt: now + 60_000,
})
const allow = (overrides = {}) => authorizeXorusReportRead({
  enabled: true, commercialUsageRightsVerified: true, actor: email, offer: 'pulse',
  reportId, now, lookupGrant: async () => grant(email),
  lookupReport: async () => report(),
  reserveQuota: async ({ grantId }) => ({ reserved: true, grantId, remaining: 2 }),
  ...overrides,
})

test('never authorizes when feature or source commercial rights are absent', async () => {
  assert.equal((await authorizeXorusReportRead()).status, 503)
  assert.equal((await allow({ enabled: false })).allowed, false)
  assert.equal((await allow({ commercialUsageRightsVerified: false })).allowed, false)
})

test('email identity must be server-verified and opaque; wallet text is not proof', async () => {
  for (const actor of [null, { ...email, verified: false }, { ...email, proof: 'jwt_claim' },
    { ...email, subject: 'artist@example.com' },
    { ...email, subject: 'usr_abcdefghijklmnop' }, { ...wallet, proof: 'wallet_address_text' }]) {
    assert.equal((await allow({ actor })).status, 401)
  }
})

test('explicit offer/report scope, no client-selected provider or wildcard', async () => {
  for (const [offer, id] of [['premium', reportId], ['pulse', 'short'], ['constructor', reportId]]) {
    assert.equal((await allow({ offer, reportId: id })).status, 400)
  }
})

test('verified email subscription reserves quota once and reveals no provider fields', async () => {
  let readScope, reserved
  const r = await allow({
    lookupGrant: async x => { readScope = x; return grant(email) },
    reserveQuota: async x => { reserved = x; return { reserved: true, grantId: x.grantId, remaining: 2 } },
  })
  assert.equal(r.allowed, true)
  assert.equal(r.scope, 'analysis:markets')
  assert.equal(readScope.subject, email.subject)
  assert.equal(reserved.reportId, reportId)
  assert.ok(!JSON.stringify(r).includes('evt_'))
  assert.equal(r.rawData, undefined)
})

test('wrong account, wrong offer, cancellation/refund/expiry and stale ledger are denied', async () => {
  for (const patch of [{ subject: '550e8400-e29b-41d4-a716-446655440001' }, { offer: 'yield' },
    { status: 'cancelled' }, { revokedAt: now - 5 }, { refundedAt: now - 5 },
    { expiresAt: now - 1 }, { issuedAt: now + 10000 }, { ledgerCheckedAt: now - 61_000 }]) {
    let reservations = 0
    const out = await allow({ lookupGrant: async () => ({ ...grant(email), ...patch }),
      reserveQuota: async () => { reservations++; return null } })
    assert.equal(out.allowed, false, JSON.stringify(patch))
    assert.equal(reservations, 0)
  }
})

test('unverified, stale and wrong-rail provider evidence never grants access', async () => {
  const base = grant(email)
  for (const proof of [{ ...base.evidence, verified: false },
    { ...base.evidence, checkedAt: now - 61_000 },
    { ...base.evidence, billingStatus: 'cancelled' },
    { ...base.evidence, settlement: 'pending' },
    { kind: 'verified_mvx_nft_ownership', verified: true, checkedAt: now - 100,
      owner: wallet.subject, chainId: '1', tokenIdentifier: 'ASFT-a6273a-01',
      contract: 'erd1' + 'p'.repeat(58) }]) {
    const out = await allow({ lookupGrant: async () => ({ ...base, evidence: proof }) })
    assert.equal(out.allowed, false)
  }
})

test('wallet owner requires SIWX and fresh chain-verified NFT with correct binding', async () => {
  const authorized = await allow({ actor: wallet, offer: 'sentinel',
    lookupGrant: async () => grant(wallet, 'sentinel'),
    lookupReport: async () => report('sentinel') })
  assert.equal(authorized.allowed, true)
  assert.equal(authorized.scope, 'analysis:risk')
  const wrong = await allow({ actor: wallet, offer: 'sentinel',
    lookupGrant: async () => ({ ...grant(wallet, 'sentinel'),
      evidence: { ...grant(wallet, 'sentinel').evidence, owner: email.subject } }) })
  assert.equal(wrong.allowed, false)
})

test('quota exhaustion, invalid reservations and persistence errors fail closed', async () => {
  const exhausted = await allow({ lookupGrant: async () => ({ ...grant(email), quotaRemaining: 0 }) })
  assert.equal(exhausted.status, 429)
  const replay = await allow({ reserveQuota: async () => ({ reserved: false, remaining: 2 }) })
  assert.equal(replay.status, 429)
  const reusedCounter = await allow({ reserveQuota: async ({ grantId }) => ({ reserved: true, grantId, remaining: 3 }) })
  assert.equal(reusedCounter.status, 429)
  assert.equal((await allow({ lookupGrant: async () => { throw Error('hidden db error') } })).status, 503)
  assert.equal((await allow({ reserveQuota: async () => { throw Error('hidden transaction error') } })).status, 503)
})

test('every report is verified from a private derived authoritative record, not its ID alone', async () => {
  for (const patch of [
    { reportId: 'b'.repeat(64) }, { offer: 'yield' }, { scope: 'analysis:risk' },
    { kind: 'raw_market_feed' }, { visibility: 'public' }, { status: 'draft' },
    { rawDataIncluded: true }, { commercialUsageApproved: false },
    { sourceTs: null }, { sourceTs: now + 1 }, { generatedAt: now + 1 },
    { expiresAt: now - 1 },
  ]) {
    let quotaCalls = 0
    const out = await allow({ lookupReport: async () => ({ ...report(), ...patch }),
      reserveQuota: async () => { quotaCalls++; return { reserved: true } } })
    assert.equal(out.status, 404, JSON.stringify(patch))
    assert.equal(quotaCalls, 0)
  }
  assert.equal((await allow({ lookupReport: async () => { throw Error('private storage path') } })).status, 503)
  assert.equal((await allow({ lookupReport: undefined })).status, 503)
})

test('real repository UUID account IDs work, but provider aliases never authorize', async () => {
  const approved = await allow()
  assert.equal(approved.allowed, true)
  assert.equal(approved.offer, 'pulse')
  assert.equal((await allow({ actor: { ...email, subject: 'usr_abcdefghijklmnop' } })).status, 401)
  assert.equal((await allow({ actor: { ...email, subject: 'verified@example.test' } })).status, 401)
  assert.equal((await allow({ actor: { ...email, subject: '550e8400-e29b-41d4-a716-446655440000' } })).allowed, true)
})
