/**
 * GitHub OIDC -> Render dry-run mint pull. No PAT in Render.
 * Only the trusted main workflow may reserve a server-confirmed paid order.
 * A claimed job is never retried automatically: uncertain dispatches need reconciliation.
 */
import crypto from 'node:crypto'
import { assertPaymentAllowsMint, withMintJobLock, MINT_JOB_STATUS, usePostgresJobs } from './mintDispatch.mjs'

export const OIDC_AUDIENCE = 'xartists-render-mint-pull-v1'
const ISSUER = 'https://token.actions.githubusercontent.com'
const JWKS_URL = ISSUER + '/.well-known/jwks'
const TRUSTED_WORKFLOW = 'Neltud/xArtists/.github/workflows/mint-oidc-pull.yml@refs/heads/main'
const REPO_ID = '999144165'
const OWNER_ID = '95723989'
let cachedKeys = null
let cachedUntil = 0

export function oidcMintPullEnabled(env = process.env) {
  return env.MINT_OIDC_PULL_ENABLED === '1' &&
    Boolean(String(env.DATABASE_URL || '').trim()) &&
    String(env.MINT_DRY_RUN ?? '1') !== '0' &&
    String(env.MINT_DRY_RUN ?? '1').toLowerCase() !== 'false' &&
    env.MINT_LIVE_ENABLED !== '1' &&
    String(env.MINT_MICRO_PRICE ?? 'false').toLowerCase() !== 'true'
}

function badIdentity() {
  return Object.assign(new Error('github_oidc_denied'), { statusCode: 401 })
}

function decodeSegment(segment) {
  if (!/^[A-Za-z0-9_-]+$/.test(segment) || segment.length > 12000) throw badIdentity()
  try {
    return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'))
  } catch {
    throw badIdentity()
  }
}

export async function verifyGitHubOidc(authHeader, fetchImpl = fetch, now = Date.now()) {
  const match = /^Bearer ([A-Za-z0-9_.-]+)$/.exec(String(authHeader || ''))
  if (!match || match[1].length > 16000) throw badIdentity()
  const parts = match[1].split('.')
  if (parts.length !== 3) throw badIdentity()
  const header = decodeSegment(parts[0])
  const claims = decodeSegment(parts[1])
  if (!header || header.alg !== 'RS256' || header.typ !== 'JWT' ||
      typeof header.kid !== 'string' || !header.kid || header.kid.length > 256 ||
      !claims || typeof claims !== 'object') throw badIdentity()
  const seconds = Math.floor(now / 1000)
  if (claims.iss !== ISSUER || claims.aud !== OIDC_AUDIENCE ||
      !Number.isInteger(claims.exp) || !Number.isInteger(claims.iat) ||
      claims.exp <= seconds || claims.exp > seconds + 900 ||
      claims.iat > seconds + 60 || claims.iat < seconds - 900 ||
      (claims.nbf !== undefined && (!Number.isInteger(claims.nbf) || claims.nbf > seconds + 60)) ||
      claims.repository !== 'Neltud/xArtists' ||
      String(claims.repository_id) !== REPO_ID ||
      String(claims.repository_owner_id) !== OWNER_ID ||
      claims.ref !== 'refs/heads/main' || claims.ref_type !== 'branch' ||
      claims.workflow_ref !== TRUSTED_WORKFLOW ||
      !['schedule', 'workflow_dispatch'].includes(claims.event_name) ||
      typeof claims.sub !== 'string' || !claims.sub.endsWith(':ref:refs/heads/main') ||
      !/^[1-9][0-9]{0,19}$/.test(String(claims.run_id || '')) ||
      !/^[1-9][0-9]{0,6}$/.test(String(claims.run_attempt || ''))) {
    throw badIdentity()
  }
  if (now >= cachedUntil || !cachedKeys) {
    let response
    try {
      response = await fetchImpl(JWKS_URL, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      })
      if (!response.ok) throw new Error('jwks_unavailable')
      const data = await response.json()
      if (!Array.isArray(data.keys) || data.keys.length > 40) throw new Error('invalid_jwks')
      cachedKeys = data.keys
      cachedUntil = now + 5 * 60 * 1000
    } catch {
      throw badIdentity()
    }
  }
  const key = cachedKeys.find(k => k.kid === header.kid && k.kty === 'RSA' &&
    (k.alg === undefined || k.alg === 'RS256') && (!k.use || k.use === 'sig'))
  if (!key) throw badIdentity()
  try {
    const pub = crypto.createPublicKey({ key, format: 'jwk' })
    const signed = Buffer.from(parts[0] + '.' + parts[1])
    const sig = Buffer.from(parts[2], 'base64url')
    if (!crypto.verify('RSA-SHA256', signed, pub, sig)) throw badIdentity()
  } catch {
    throw badIdentity()
  }
  return { runId: String(claims.run_id), attempt: String(claims.run_attempt) }
}

function eligible(order) {
  return order && order.status === 'paid' &&
    order.server_confirmed === true &&
    order.delivery_verified !== true &&
    /^[1-9][0-9]{0,5}$/.test(String(order.edition || 1)) &&
    /^[A-Za-z0-9_-]{1,64}$/.test(String(order.order_id || '')) &&
    assertPaymentAllowsMint(order).ok
}

export function eligibleOidcOrders(db, limit = 10, offset = 0) {
  const orders = Object.values(db?.orders || {})
  return orders.filter(eligible)
    .sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')))
    .slice(Math.max(0, offset), Math.max(0, offset) + Math.min(Math.max(1, limit), 10))
    .map(o => ({ order_id: o.order_id }))
}

export async function claimOidcMintOrder(order, identity, env = process.env) {
  if (!oidcMintPullEnabled(env) || !usePostgresJobs(env)) {
    return { ok: false, reason: 'oidc_pull_disabled' }
  }
  if (!eligible(order)) return { ok: false, reason: 'order_not_eligible' }
  const claimId = crypto.randomUUID()
  return withMintJobLock(order.order_id, async db => {
    if (db.jobs[order.order_id]) {
      return { ok: false, reason: 'already_claimed_or_dispatched' }
    }
    const now = new Date().toISOString()
    const job = {
      order_id: order.order_id,
      pack_id: String(order.pack_id).toLowerCase(),
      buyer_address: order.buyer_address,
      edition: String(order.edition || 1),
      status: MINT_JOB_STATUS.DISPATCHING,
      mode: 'dry_run',
      github_dispatch_accepted: false,
      chain_tx_hash: null,
      nft_identifier: null,
      claim_hash: crypto.createHash('sha256').update(claimId).digest('hex'),
      claim_run_id: identity.runId,
      claim_attempt: identity.attempt,
      provider_tx_id: order.provider_tx_id,
      amount_cents: order.amount_cents,
      micro_price: false,
      attempts: 1,
      store: 'postgres',
      error: null,
      created_at: now,
      updated_at: now,
    }
    db.jobs[order.order_id] = job
    return {
      ok: true,
      claim_id: claimId,
      inputs: {
        pack: job.pack_id,
        buyer: job.buyer_address,
        edition: job.edition,
        order_id: job.order_id,
        live_mint: 'false',
        confirm: 'DRY_RUN',
        micro_price: 'false',
      },
    }
  }, env)
}

export async function ackOidcMintOrder(input, identity, env = process.env) {
  if (!oidcMintPullEnabled(env) || !usePostgresJobs(env)) {
    return { ok: false, reason: 'oidc_pull_disabled' }
  }
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(String(input?.order_id || '')) ||
      !/^[0-9a-f-]{36}$/.test(String(input?.claim_id || '')) ||
      !Number.isInteger(input?.github_status)) {
    return { ok: false, reason: 'invalid_ack' }
  }
  return withMintJobLock(input.order_id, async db => {
    const job = db.jobs[input.order_id]
    const hash = crypto.createHash('sha256').update(input.claim_id).digest('hex')
    if (!job || job.claim_hash !== hash || job.claim_run_id !== identity.runId ||
        job.claim_attempt !== identity.attempt || job.status !== MINT_JOB_STATUS.DISPATCHING) {
      return { ok: false, reason: 'ack_not_authorized_or_finalized' }
    }
    job.status = input.github_status === 204
      ? MINT_JOB_STATUS.SUBMITTED
      : MINT_JOB_STATUS.RECONCILIATION_REQUIRED
    job.github_dispatch_accepted = input.github_status === 204
    job.error = input.github_status === 204 ? null : 'github_dispatch_not_confirmed'
    job.updated_at = new Date().toISOString()
    // A 204 is a GitHub dispatch acknowledgement, NOT NFT delivery.
    return { ok: true, status: job.status, delivery_verified: false }
  }, env)
}
