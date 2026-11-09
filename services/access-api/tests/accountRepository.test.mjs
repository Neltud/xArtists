import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  findOrCreateAccountForVerifiedIdentity, linkVerifiedWallet, readAccountProjection,
} from '../src/accountRepository.mjs'

const userId = 'de305d54-75b4-431b-adb2-eb6b9e546014'
const address = 'erd1' + 'q'.repeat(58)
const verifiedAt = '2026-11-09T10:00:00Z'
function fakePool(respond) {
  const calls = []
  const client = {
    async query(sql, params) {
      calls.push({ sql, params })
      return respond(sql, params)
    },
    release() { calls.push({ sql: 'RELEASE' }) },
  }
  return { calls, connect: async () => client, query: client.query }
}
test('verified identity returns existing active account without inserting', async () => {
  const db = fakePool(sql => sql.includes('SELECT a.id') ? { rows: [{ id: userId }] } : { rows: [] })
  const result = await findOrCreateAccountForVerifiedIdentity(db, {
    provider: 'google', subject: 'oidc-subject-123', verifiedAt,
  })
  assert.deepEqual(result, { user_id: userId, created: false })
  assert.equal(db.calls.some(c => c.sql.includes('INSERT')), false)
  assert.equal(db.calls.at(-2).sql, 'COMMIT')
  assert.equal(db.calls.at(-1).sql, 'RELEASE')
})
test('disabled identity cannot be reassigned to a new account', async () => {
  const db = fakePool(sql => sql.includes('SELECT 1 FROM xa_account_identities')
    ? { rows: [{ '?column?': 1 }] } : { rows: [] })
  await assert.rejects(findOrCreateAccountForVerifiedIdentity(db, {
    provider: 'google', subject: 'disabled-sub', verifiedAt,
  }), /identity_account_disabled/)
  assert.equal(db.calls.some(c => c.sql === 'ROLLBACK'), true)
  assert.equal(db.calls.some(c => c.sql.includes('INSERT')), false)
})
test('rejects unverified identity shapes before database access', async () => {
  const db = fakePool(() => { throw new Error('should not query') })
  await assert.rejects(findOrCreateAccountForVerifiedIdentity(db, {
    provider: 'unknown', subject: 'x', verifiedAt,
  }), /invalid_verified_identity/)
  await assert.rejects(findOrCreateAccountForVerifiedIdentity(db, {
    provider: 'google', subject: '', verifiedAt,
  }), /invalid_verified_identity/)
  assert.equal(db.calls.length, 0)
})
test('wallet belonging to another user cannot be linked', async () => {
  const db = fakePool(sql => {
    if (sql.includes('FROM xa_user_accounts')) return { rows: [{ id: userId }] }
    if (sql.includes('FROM xa_account_wallets')) return { rows: [{ user_id: 'another-user' }] }
    return { rows: [] }
  })
  await assert.rejects(linkVerifiedWallet(db, { userId, address, verifiedAt }), /wallet_linked_to_another_account/)
  assert.equal(db.calls.some(c => c.sql.includes('INSERT')), false)
  assert.equal(db.calls.some(c => c.sql === 'ROLLBACK'), true)
})
test('inactive account and invalid wallet cannot link', async () => {
  const db = fakePool(() => ({ rows: [] }))
  await assert.rejects(linkVerifiedWallet(db, { userId, address, verifiedAt }), /account_not_active/)
  await assert.rejects(linkVerifiedWallet(db, { userId, address: 'fake', verifiedAt }), /invalid_verified_wallet/)
})
test('read projection derives wallet type on server without returning addresses', async () => {
  const db = fakePool(sql => {
    if (sql.includes('FROM xa_user_accounts')) return { rows: [{ id: userId, created_at: verifiedAt }] }
    if (sql.includes('FROM xa_account_wallets')) return { rows: [{
      network: 'multiversx', address, verified_at: new Date(verifiedAt),
    }] }
    return { rows: [] }
  })
  const result = await readAccountProjection(db, userId)
  assert.equal(result.account_type, 'wallet_linked')
  assert.equal(result.wallet_count, 1)
  assert.equal(JSON.stringify(result).includes(address), false)
})
