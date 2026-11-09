/**
 * Internal PostgreSQL account repository. NOT an HTTP auth endpoint.
 * Callers MUST independently verify OIDC or SIWX before invoking link methods.
 * All writes are transaction-scoped and never grant payment or mint authority.
 */
import { randomUUID } from 'node:crypto'
import { deriveAccountType } from './accountTypes.mjs'

const assertUuid = value => {
  if (typeof value !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value)) {
    throw new TypeError('invalid_account_id')
  }
}
const assertDate = value => {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) throw new TypeError('invalid_verification_time')
}
const assertIdentity = ({ provider, subject, verifiedAt }) => {
  if (!['google', 'email_oidc'].includes(provider) || typeof subject !== 'string' ||
    subject.length < 1 || subject.length > 512) throw new TypeError('invalid_verified_identity')
  assertDate(verifiedAt)
}
const assertWallet = ({ address, verifiedAt }) => {
  if (typeof address !== 'string' || !/^erd1[a-z0-9]{58}$/.test(address)) throw new TypeError('invalid_verified_wallet')
  assertDate(verifiedAt)
}
async function transaction(pool, fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/** The caller supplies a provider-verified assertion, never browser-supplied identity fields. */
export async function findOrCreateAccountForVerifiedIdentity(pool, { provider, subject, verifiedAt }) {
  assertIdentity({ provider, subject, verifiedAt })
  return transaction(pool, async client => {
    // Serialize concurrent creation for the same identity, across API replicas.
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [provider + ':' + subject])
    const existing = await client.query(
      'SELECT a.id FROM xa_account_identities i JOIN xa_user_accounts a ON a.id=i.user_id WHERE i.provider=$1 AND i.provider_subject=$2 AND a.disabled_at IS NULL',
      [provider, subject],
    )
    if (existing.rows.length) return { user_id: existing.rows[0].id, created: false }
    // A disabled account identity must never be reassigned to a new user.
    const blocked = await client.query(
      'SELECT 1 FROM xa_account_identities WHERE provider=$1 AND provider_subject=$2',
      [provider, subject],
    )
    if (blocked.rows.length) throw new Error('identity_account_disabled')
    const userId = randomUUID()
    await client.query('INSERT INTO xa_user_accounts(id) VALUES($1)', [userId])
    await client.query(
      'INSERT INTO xa_account_identities(id,user_id,provider,provider_subject,verified_at) VALUES($1,$2,$3,$4,$5)',
      [randomUUID(), userId, provider, subject, verifiedAt],
    )
    return { user_id: userId, created: true }
  })
}

/** Requires prior verified SIWX proof bound to this account and a one-use challenge. */
export async function linkVerifiedWallet(pool, { userId, address, verifiedAt }) {
  assertUuid(userId)
  assertWallet({ address, verifiedAt })
  return transaction(pool, async client => {
    const account = await client.query(
      'SELECT id FROM xa_user_accounts WHERE id=$1 AND disabled_at IS NULL FOR UPDATE', [userId],
    )
    if (!account.rows.length) throw new Error('account_not_active')
    const existing = await client.query(
      'SELECT user_id FROM xa_account_wallets WHERE network=$1 AND address=$2', ['multiversx', address],
    )
    if (existing.rows.length) {
      if (existing.rows[0].user_id !== userId) throw new Error('wallet_linked_to_another_account')
      return { linked: true, created: false }
    }
    // Unique(network,address) protects races across different account locks.
    try {
      await client.query(
        'INSERT INTO xa_account_wallets(id,user_id,network,address,verified_at) VALUES($1,$2,$3,$4,$5)',
        [randomUUID(), userId, 'multiversx', address, verifiedAt],
      )
    } catch (error) {
      if (error.code === '23505') throw new Error('wallet_link_conflict')
      throw error
    }
    return { linked: true, created: true }
  })
}

export async function readAccountProjection(pool, userId) {
  assertUuid(userId)
  const account = await pool.query(
    'SELECT id,created_at FROM xa_user_accounts WHERE id=$1 AND disabled_at IS NULL', [userId],
  )
  if (!account.rows.length) return null
  const wallets = await pool.query(
    'SELECT network,address,verified_at FROM xa_account_wallets WHERE user_id=$1', [userId],
  )
  return {
    user_id: account.rows[0].id,
    created_at: account.rows[0].created_at,
    account_type: deriveAccountType(wallets.rows.map(w => ({
      ...w, verified_at: w.verified_at instanceof Date ? w.verified_at.toISOString() : w.verified_at,
    }))),
    wallet_count: wallets.rows.length,
  }
}
