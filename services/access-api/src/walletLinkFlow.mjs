/**
 * Internal atomic wallet-link orchestration, NOT an HTTP endpoint.
 * Caller must supply a server-owned signature verifier. Never pass a verifier
 * implemented from browser-provided `verified: true` flags.
 */
import { randomUUID } from 'node:crypto'
import { consumeVerifiedWalletLinkChallenge } from './walletLinkChallenge.mjs'

export async function linkWalletWithVerifiedChallenge(pool, {
  userId, address, domain, nonce, signature, message, now = new Date(),
}, verifySignature) {
  if (typeof verifySignature !== 'function') throw new TypeError('signature_verifier_required')
  if (typeof signature !== 'string' || !signature ||
      typeof message !== 'string' || !message) throw new TypeError('signed_message_required')
  // Signature verification MUST bind the exact challenge fields and origin.
  const verified = await verifySignature({ userId, address, domain, nonce, signature, message })
  if (verified !== true) throw new Error('wallet_signature_invalid')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const account = await client.query(
      'SELECT id FROM xa_user_accounts WHERE id=$1 AND disabled_at IS NULL FOR UPDATE',
      [userId],
    )
    if (account.rowCount !== 1) throw new Error('account_not_active')
    await consumeVerifiedWalletLinkChallenge(client, { nonce, userId, address, domain, now })
    const existing = await client.query(
      'SELECT user_id FROM xa_account_wallets WHERE network=$1 AND address=$2',
      ['multiversx', address],
    )
    if (existing.rowCount) {
      if (existing.rows[0].user_id !== userId) throw new Error('wallet_linked_to_another_account')
      await client.query('COMMIT')
      return { linked: true, created: false }
    }
    await client.query(
      'INSERT INTO xa_account_wallets(id,user_id,network,address,verified_at) VALUES($1,$2,$3,$4,$5)',
      [randomUUID(), userId, 'multiversx', address, now],
    )
    await client.query('COMMIT')
    return { linked: true, created: true }
  } catch (error) {
    await client.query('ROLLBACK')
    if (error.code === '23505') throw new Error('wallet_link_conflict')
    throw error
  } finally {
    client.release()
  }
}
