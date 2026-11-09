/**
 * Atomic one-time wallet-link challenge consumption.
 * Call ONLY after an independently verified SIWX signature over the exact
 * nonce, account ID, wallet address, origin domain and expiration.
 * No mint, auth session or wallet link is granted by this helper.
 */
import { createHash } from 'node:crypto'

export function hashWalletLinkNonce(nonce) {
  if (typeof nonce !== 'string' || !/^[a-f0-9]{64}$/.test(nonce)) {
    throw new TypeError('invalid_wallet_link_nonce')
  }
  return createHash('sha256').update(nonce, 'utf8').digest('hex')
}

export async function consumeVerifiedWalletLinkChallenge(client, {
  nonce, userId, address, domain, now = new Date(),
}) {
  const nonceHash = hashWalletLinkNonce(nonce)
  if (typeof userId !== 'string' || !/^[a-f0-9-]{36}$/i.test(userId) ||
    typeof address !== 'string' || !/^erd1[a-z0-9]{58}$/.test(address) ||
    typeof domain !== 'string' || domain.length < 3 || domain.length > 255 ||
    !(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new TypeError('invalid_wallet_link_challenge')
  }
  // Single SQL UPDATE atomically consumes a challenge across all replicas.
  // Caller must execute inside the SAME transaction as wallet linking.
  const result = await client.query(`
    UPDATE xa_wallet_link_challenges
       SET consumed_at=$5
     WHERE nonce_hash=$1 AND user_id=$2 AND address=$3 AND domain=$4
       AND consumed_at IS NULL AND issued_at <= $5 AND expires_at > $5
     RETURNING id
  `, [nonceHash, userId, address, domain, now])
  if (result.rowCount !== 1) throw new Error('wallet_link_challenge_invalid_or_replayed')
  return { consumed: true }
}
