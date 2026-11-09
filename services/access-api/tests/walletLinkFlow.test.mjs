import { test } from 'node:test'
import assert from 'node:assert/strict'
import { linkWalletWithVerifiedChallenge } from '../src/walletLinkFlow.mjs'

const input = {
  userId: 'de305d54-75b4-431b-adb2-eb6b9e546014',
  address: 'erd1' + 'q'.repeat(58),
  domain: 'xartists.example',
  nonce: 'a'.repeat(64),
  signature: 'verified-signature-by-server',
  message: 'exact signed message',
  now: new Date('2026-11-09T12:00:00Z'),
}
function fixture({ challenge = 1, wallet = [], account = 1 } = {}) {
  const calls = []
  const client = {
    async query(sql) {
      calls.push(sql)
      if (sql.includes('FROM xa_user_accounts')) return { rowCount: account, rows: account ? [{ id: input.userId }] : [] }
      if (sql.includes('UPDATE xa_wallet_link_challenges')) return { rowCount: challenge, rows: challenge ? [{ id: 'challenge' }] : [] }
      if (sql.includes('SELECT user_id FROM xa_account_wallets')) return { rowCount: wallet.length, rows: wallet }
      return { rowCount: 1, rows: [] }
    },
    release() { calls.push('RELEASE') },
  }
  return { calls, connect: async () => client }
}
test('valid proof consumes nonce and inserts wallet in same transaction', async () => {
  const db = fixture()
  const result = await linkWalletWithVerifiedChallenge(db, input, async () => true)
  assert.deepEqual(result, { linked: true, created: true })
  const consume = db.calls.findIndex(s => s.includes('UPDATE xa_wallet_link_challenges'))
  const insert = db.calls.findIndex(s => s.includes('INSERT INTO xa_account_wallets'))
  assert.ok(consume > 0 && insert > consume)
  assert.equal(db.calls.at(-2), 'COMMIT')
  assert.equal(db.calls.at(-1), 'RELEASE')
})
test('invalid signature never opens transaction', async () => {
  const db = fixture()
  await assert.rejects(linkWalletWithVerifiedChallenge(db, input, async () => false), /wallet_signature_invalid/)
  assert.equal(db.calls.length, 0)
})
test('replayed nonce rolls back without linking', async () => {
  const db = fixture({ challenge: 0 })
  await assert.rejects(linkWalletWithVerifiedChallenge(db, input, async () => true), /invalid_or_replayed/)
  assert.equal(db.calls.some(s => s.includes('INSERT INTO xa_account_wallets')), false)
  assert.ok(db.calls.includes('ROLLBACK'))
})
test('cross-account wallet conflict rolls back consumed nonce', async () => {
  const db = fixture({ wallet: [{ user_id: 'another-account' }] })
  await assert.rejects(linkWalletWithVerifiedChallenge(db, input, async () => true), /wallet_linked_to_another_account/)
  assert.ok(db.calls.includes('ROLLBACK'))
  assert.equal(db.calls.some(s => s.includes('INSERT INTO xa_account_wallets')), false)
})
test('missing signature verifier rejected', async () => {
  const db = fixture()
  await assert.rejects(linkWalletWithVerifiedChallenge(db, input), /signature_verifier_required/)
  assert.equal(db.calls.length, 0)
})
