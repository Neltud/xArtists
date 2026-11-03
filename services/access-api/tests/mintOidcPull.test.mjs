import { test } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {
  OIDC_AUDIENCE, oidcMintPullEnabled, verifyGitHubOidc,
  eligibleOidcOrders, claimOidcMintOrder, ackOidcMintOrder,
} from '../src/mintOidcPull.mjs'

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-rs256', alg: 'RS256', use: 'sig' }
const now = Date.now()
const claims = {
  iss: 'https://token.actions.githubusercontent.com',
  aud: OIDC_AUDIENCE,
  sub: 'repo:Neltud@95723989/xArtists@999144165:ref:refs/heads/main',
  exp: Math.floor(now / 1000) + 300,
  iat: Math.floor(now / 1000) - 10,
  nbf: Math.floor(now / 1000) - 10,
  repository: 'Neltud/xArtists',
  repository_id: '999144165',
  repository_owner_id: '95723989',
  ref: 'refs/heads/main',
  ref_type: 'branch',
  workflow_ref: 'Neltud/xArtists/.github/workflows/mint-oidc-pull.yml@refs/heads/main',
  event_name: 'workflow_dispatch',
  run_id: '123456789',
  run_attempt: '1',
}
const fetchKeys = async url => {
  assert.equal(url, 'https://token.actions.githubusercontent.com/.well-known/jwks')
  return { ok: true, json: async () => ({ keys: [jwk] }) }
}
function token(data = claims, key = privateKey) {
  const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: jwk.kid })).toString('base64url')
  const b = Buffer.from(JSON.stringify(data)).toString('base64url')
  const signed = h + '.' + b
  const sig = crypto.sign('RSA-SHA256', Buffer.from(signed), key).toString('base64url')
  return 'Bearer ' + signed + '.' + sig
}
const good = {
  order_id: 'xa_sentinel_unit_1',
  pack_id: 'sentinel',
  buyer_address: 'erd1' + 'q'.repeat(58),
  status: 'paid',
  server_confirmed: true,
  payment_verified: true,
  provider_tx_id: 'test_psp_tx',
  amount_cents: 5000,
  currency: 'EUR',
  delivery_verified: false,
  edition: 1,
  created_at: '2026-11-03T10:00:00Z',
}

test('OIDC RS256 JWT verifies exact pinned audience, immutable repo IDs and trusted main workflow', async () => {
  const id = await verifyGitHubOidc(token(), fetchKeys, now)
  assert.deepEqual(id, { runId: '123456789', attempt: '1' })
})
test('OIDC rejects wrong audience, repo ID, workflow, ref, event, expiry and unsigned forgeries', async () => {
  for (const change of [
    { aud: 'wrong' },
    { repository_id: '1' },
    { repository_owner_id: '1' },
    { repository: 'evil/fork' },
    { workflow_ref: 'Neltud/xArtists/.github/workflows/other.yml@refs/heads/main' },
    { ref: 'refs/heads/evil' },
    { event_name: 'pull_request' },
    { exp: Math.floor(now / 1000) - 1 },
    { iat: Math.floor(now / 1000) + 120 },
  ]) {
    await assert.rejects(verifyGitHubOidc(token({ ...claims, ...change }), fetchKeys, now),
      /github_oidc_denied/)
  }
  const other = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey
  await assert.rejects(verifyGitHubOidc(token(claims, other), fetchKeys, now),
    /github_oidc_denied/)
  await assert.rejects(verifyGitHubOidc('Bearer malformed', fetchKeys, now), /github_oidc_denied/)
})
test('OIDC is disabled unless explicit flag, postgres, dry and NO live/micro', () => {
  const e = {
    MINT_OIDC_PULL_ENABLED: '1',
    DATABASE_URL: 'postgres://127.0.0.1:5432/xartists_mint_probe',
    MINT_DRY_RUN: '1', MINT_LIVE_ENABLED: '0', MINT_MICRO_PRICE: 'false',
  }
  assert.equal(oidcMintPullEnabled(e), true)
  for (const change of [
    { MINT_OIDC_PULL_ENABLED: '0' },
    { DATABASE_URL: '' },
    { MINT_DRY_RUN: '0' },
    { MINT_LIVE_ENABLED: '1' },
    { MINT_MICRO_PRICE: 'true' },
  ]) {
    assert.equal(oidcMintPullEnabled({ ...e, ...change }), false)
  }
})
test('OIDC queue only lists paid and server-confirmed non-delivered orders', () => {
  const db = { orders: {
    good,
    status_only: { ...good, order_id: 'status_only', server_confirmed: false, payment_verified: false },
    refunded: { ...good, order_id: 'refunded', status: 'refunded' },
    fulfilled: { ...good, order_id: 'fulfilled', delivery_verified: true },
    invalid_buyer: { ...good, order_id: 'invalid_buyer', buyer_address: 'erd1bad' },
    invalid_edition: { ...good, order_id: 'invalid_edition', edition: 0 },
  } }
  assert.deepEqual(eligibleOidcOrders(db), [{ order_id: good.order_id }])
  db.orders.second = { ...good, order_id: 'xa_sentinel_unit_2', created_at: '2026-11-03T11:00:00Z' }
  assert.deepEqual(eligibleOidcOrders(db, 1, 1), [{ order_id: 'xa_sentinel_unit_2' }])
})
const localDb = process.env.TEST_DATABASE_URL || ''
let approved = false
try {
  const url = new URL(localDb)
  approved = process.env.ALLOW_EPHEMERAL_MINT_PG_TEST === '1' &&
    ['localhost', '127.0.0.1', '::1'].includes(url.hostname) &&
    url.pathname === '/xartists_mint_probe'
} catch {}

test('Postgres reservation survives concurrent runners; one dispatch + ack once', { skip: !approved }, async () => {
  const pg = (await import('pg')).default
  const pool = new pg.Pool({ connectionString: localDb, ssl: false })
  const env = {
    MINT_OIDC_PULL_ENABLED: '1',
    DATABASE_URL: localDb,
    MINT_DRY_RUN: '1', MINT_LIVE_ENABLED: '0',
    MINT_MICRO_PRICE: 'false', PGSSL: '0',
  }
  const order = { ...good, order_id: 'oidc_unit_' + crypto.randomBytes(5).toString('hex') }
  const identity = { runId: '123456789', attempt: '1' }
  try {
    const [a, b] = await Promise.all([
      claimOidcMintOrder(order, identity, env),
      claimOidcMintOrder(order, identity, env),
    ])
    assert.equal([a, b].filter(x => x.ok).length, 1)
    assert.equal([a, b].filter(x => x.reason === 'already_claimed_or_dispatched').length, 1)
    const claim = a.ok ? a : b
    assert.equal(claim.inputs.live_mint, 'false')
    assert.equal(claim.inputs.micro_price, 'false')
    assert.equal(claim.inputs.confirm, 'DRY_RUN')
    const ack = { order_id: order.order_id, claim_id: claim.claim_id, github_status: 204 }
    assert.equal((await ackOidcMintOrder(ack, { runId: 'wrong', attempt: '1' }, env)).ok, false)
    assert.equal((await ackOidcMintOrder({ ...ack, claim_id: crypto.randomUUID() }, identity, env)).ok, false)
    const success = await ackOidcMintOrder(ack, identity, env)
    assert.equal(success.status, 'submitted')
    assert.equal(success.delivery_verified, false)
    assert.equal((await ackOidcMintOrder(ack, identity, env)).ok, false)
    assert.equal((await claimOidcMintOrder(order, identity, env)).ok, false)
    const r = await pool.query('SELECT status, payload FROM mint_jobs WHERE order_id=$1', [order.order_id])
    assert.equal(r.rows.length, 1)
    assert.equal(r.rows[0].status, 'submitted')
    assert.equal(r.rows[0].payload.attempts, 1)
    assert.equal(r.rows[0].payload.chain_tx_hash, null)
    assert.equal(r.rows[0].payload.nft_identifier, null)
  } finally {
    await pool.query('DELETE FROM mint_jobs WHERE order_id=$1', [order.order_id])
    await pool.end()
  }
})
