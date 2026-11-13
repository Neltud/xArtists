/**
 * xOrus private report access policy (candidate only).
 * Authentication, subscription reconciliation, current chain ownership and atomic quota
 * reservation MUST come from trusted server adapters. No frontend/browser grant accepted.
 * Not connected to any live route or checkout.
 */
export const XORUS_OFFER_SCOPES = Object.freeze({
  pulse: 'analysis:markets',
  yield: 'analysis:defi',
  sentinel: 'analysis:risk',
})

const YEAR_MS = 366 * 86_400_000
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{7,127}$/
const REPORT_ID = /^[a-f0-9]{64}$/
const WALLET = /^erd1[a-z0-9]{58}$/
// Match the UUID persisted as xa_user_accounts.id by accountRepository.mjs.
// A raw email, Neon JWT sub or user-supplied alias is never the xArtists account id.
const EMAIL_ACCOUNT = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i
const GRANT_ID = /^xag_[A-Za-z0-9_-]{12,80}$/
const PROOF_MAX_AGE_MS = 60_000

const deny = (reason, status = 403) => Object.freeze({ allowed: false, status, reason })
const validTime = t => Number.isSafeInteger(t) && t > 0

function authenticatedActor(actor) {
  if (!actor || actor.verified !== true) return false
  if (actor.kind === 'email')
    return EMAIL_ACCOUNT.test(actor.subject) && actor.proof === 'verified_email_session'
  if (actor.kind === 'wallet')
    return WALLET.test(actor.subject) && actor.proof === 'siwx_verified'
  return false
}

function validGrant(grant, actor, offer, scope, now) {
  if (!grant || !GRANT_ID.test(grant.grantId) || grant.subject !== actor.subject ||
      grant.subjectKind !== actor.kind || grant.offer !== offer || grant.scope !== scope ||
      grant.status !== 'active' || grant.revokedAt != null || grant.refundedAt != null ||
      !validTime(grant.issuedAt) || !validTime(grant.expiresAt) ||
      grant.issuedAt > now || grant.expiresAt <= now ||
      grant.expiresAt - grant.issuedAt > YEAR_MS ||
      !validTime(grant.ledgerCheckedAt) || grant.ledgerCheckedAt > now + 1000 ||
      now - grant.ledgerCheckedAt > PROOF_MAX_AGE_MS) return false
  const p = grant.evidence
  if (!p || p.verified !== true || !validTime(p.checkedAt) ||
      p.checkedAt > now + 1000 || now - p.checkedAt > PROOF_MAX_AGE_MS) return false
  if (p.kind === 'verified_psp_subscription')
    return actor.kind === 'email' && p.billingStatus === 'active' &&
      p.settlement === 'verified' && typeof p.eventId === 'string' && ID.test(p.eventId)
  if (p.kind === 'verified_mvx_nft_ownership')
    return actor.kind === 'wallet' && p.chainId === '1' &&
      p.owner === actor.subject && typeof p.tokenIdentifier === 'string' &&
      ID.test(p.tokenIdentifier) && typeof p.contract === 'string' && WALLET.test(p.contract)
  return false
}

function validPrivateReport(report, reportId, offer, scope, now) {
  return report && report.reportId === reportId && report.offer === offer &&
    report.scope === scope && report.kind === 'derived_xartists_analysis' &&
    report.visibility === 'private' && report.status === 'ready' &&
    report.rawDataIncluded === false && report.commercialUsageApproved === true &&
    validTime(report.sourceTs) && validTime(report.generatedAt) &&
    validTime(report.expiresAt) && report.sourceTs <= report.generatedAt &&
    report.generatedAt <= now && report.expiresAt > now
}

/**
 * Atomic private-report authorization, not an issuer or a public endpoint.
 * lookupGrant MUST fetch a current DB record scoped to authenticated actor+offer.
 * lookupReport MUST fetch a private, licensed, derived report with validated digest
 * and source timestamps, scoped to the same offer. Neither accepts HTTP parameters
 * as authority; they read trusted, persistent server records.
 * reserveQuota MUST atomically reserve a fresh report read and refuse duplicate/replayed
 * reservations; an in-memory decrement is not sufficient for production.
 * No report contents or provider data are returned by this function.
 */
export async function authorizeXorusReportRead({
  enabled = false, commercialUsageRightsVerified = false,
  actor, offer, reportId, lookupGrant, lookupReport, reserveQuota, now = Date.now(),
} = {}) {
  if (!enabled || !commercialUsageRightsVerified) return deny('commercial_service_disabled', 503)
  if (!authenticatedActor(actor)) return deny('authenticated_session_required', 401)
  if (!Object.hasOwn(XORUS_OFFER_SCOPES, offer) || !REPORT_ID.test(reportId || ''))
    return deny('invalid_report_request', 400)
  if (!validTime(now) || typeof lookupGrant !== 'function' ||
      typeof lookupReport !== 'function' || typeof reserveQuota !== 'function')
    return deny('entitlement_store_unavailable', 503)

  const scope = XORUS_OFFER_SCOPES[offer]
  let grant
  try {
    grant = await lookupGrant({ subject: actor.subject, subjectKind: actor.kind, offer, scope })
  } catch {
    return deny('entitlement_store_unavailable', 503)
  }
  if (!validGrant(grant, actor, offer, scope, now)) return deny('not_entitled')

  let report
  try {
    report = await lookupReport({ reportId, offer, scope })
  } catch {
    return deny('report_store_unavailable', 503)
  }
  if (!validPrivateReport(report, reportId, offer, scope, now))
    return deny('report_not_accessible', 404)

  if (!Number.isSafeInteger(grant.quotaRemaining) || grant.quotaRemaining <= 0 ||
      !validTime(grant.quotaResetAt) || grant.quotaResetAt <= now)
    return deny('quota_exhausted', 429)

  let receipt
  try {
    receipt = await reserveQuota({ grantId: grant.grantId, subject: actor.subject,
      scope, reportId, now, expectedLedgerCheckedAt: grant.ledgerCheckedAt })
  } catch {
    return deny('quota_store_unavailable', 503)
  }
  if (!receipt || receipt.reserved !== true || receipt.grantId !== grant.grantId ||
      !Number.isSafeInteger(receipt.remaining) || receipt.remaining < 0 ||
      receipt.remaining >= grant.quotaRemaining)
    return deny('quota_reservation_failed', 429)

  // Never return customer IDs, tokens, subscription references, chain evidence or raw data.
  return Object.freeze({ allowed: true, status: 200, offer, scope,
    reportId, remainingQuota: receipt.remaining, expiresAt: grant.expiresAt })
}
