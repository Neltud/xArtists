/**
 * Server-side buyer identity for Paybox orders.
 * Client-supplied address is NEVER trusted alone.
 *
 * Paths:
 *  1) Authorization: Bearer <access JWT> — verified HS256, sub = erd1…
 *  2) SIWX body proof — verifySignedChallenge (nonce one-use, expiry)
 */
import { verifyJwt } from './verifyAccess.mjs'
import { verifySignedChallenge } from './siwx.mjs'

export function resolveAuthenticatedBuyer(ctx) {
  const auth = String(ctx.headers.authorization || ctx.headers.Authorization || '')
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''

  if (token && ctx.jwtSecret && ctx.jwtSecret.length >= 16) {
    const payload = verifyJwt(token, ctx.jwtSecret)
    if (!payload) {
      return { ok: false, error: 'invalid_or_expired_token', statusCode: 401 }
    }
    const sub = String(payload.sub || '')
    if (!/^erd1[a-z0-9]{58}$/i.test(sub)) {
      return { ok: false, error: 'token_missing_wallet_sub', statusCode: 401 }
    }
    const claimed = typeof ctx.body.buyer_address === 'string' ? ctx.body.buyer_address.trim() : ''
    if (claimed && claimed.toLowerCase() !== sub.toLowerCase()) {
      return { ok: false, error: 'buyer_address_mismatch_token', statusCode: 403 }
    }
    return { ok: true, buyer: sub, method: 'jwt' }
  }

  const address = typeof (ctx.body.buyer_address || ctx.body.address) === 'string'
    ? String(ctx.body.buyer_address || ctx.body.address).trim()
    : ''
  const signature = ctx.body.signature || ctx.body.sig || ''
  const message = ctx.body.message || ''
  const nonce = ctx.body.nonce || ''
  if (address && signature && message && nonce) {
    if (!/^erd1[a-z0-9]{58}$/i.test(address)) {
      return { ok: false, error: 'invalid_buyer_address', statusCode: 400 }
    }
    const verified = verifySignedChallenge({
      address,
      signature: String(signature),
      message: String(message),
      nonce: String(nonce),
    })
    if (!verified) {
      return { ok: false, error: 'siwx_invalid_or_replayed', statusCode: 401 }
    }
    return { ok: true, buyer: address, method: 'siwx' }
  }

  return { ok: false, error: 'buyer_auth_required', statusCode: 401 }
}
