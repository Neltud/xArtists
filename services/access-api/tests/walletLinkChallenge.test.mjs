import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hashWalletLinkNonce, consumeVerifiedWalletLinkChallenge } from '../src/walletLinkChallenge.mjs'

const args = {
  nonce: 'a'.repeat(64),
  userId: 'de305d54-75b4-431b-adb2-eb6b9e546014',
  address: 'erd1' + 'q'.repeat(58),
  domain: 'xartists.example',
  now: new Date('2026-11-09T12:00:00Z'),
}
test('nonce is hashed, never sent raw to database', async () => {
  let params
  const db = { async query(_sql, values) { params = values; return { rowCount: 1 } } }
  assert.deepEqual(await consumeVerifiedWalletLinkChallenge(db, args), { consumed: true })
  assert.equal(params[0], hashWalletLinkNonce(args.nonce))
  assert.notEqual(params[0], args.nonce)
  assert.equal(params[1], args.userId)
  assert.equal(params[2], args.address)
  assert.equal(params[3], args.domain)
})
test('replay, expiry, wrong account or wrong origin fail closed when no row consumed', async () => {
  const db = { async query() { return { rowCount: 0 } } }
  await assert.rejects(consumeVerifiedWalletLinkChallenge(db, args), /invalid_or_replayed/)
})
test('malformed nonce and wallet context rejected before database access', async () => {
  const db = { async query() { throw new Error('should not query') } }
  for (const changed of [
    { nonce: 'short' }, { userId: 'bad' }, { address: 'bad' },
    { domain: '' }, { now: new Date('invalid') },
  ]) {
    await assert.rejects(consumeVerifiedWalletLinkChallenge(db, { ...args, ...changed }), /invalid_wallet_link/)
  }
})
