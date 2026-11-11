/** Subscription entitlement projection only. Caller must load provider-verified ledger records. */
export const SUBSCRIPTION_STATUS = Object.freeze({
  TRIALING: 'trialing',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  UNPAID: 'unpaid',
  INCOMPLETE: 'incomplete',
})

/**
 * Accept an unambiguous, strict UTC timestamp (seconds and optional milliseconds).
 * Date.parse alone normalizes impossible dates such as February 30.
 * The provider adapter must convert provider-specific epoch/offset values to UTC
 * after verifying and persisting the event; browser-controlled data is untrusted.
 */
function parseVerifiedUtcTimestamp(value) {
  if (typeof value !== 'string') return null
  const match = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.(\d{1,3}))?Z$/.exec(value)
  if (!match) return null
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return null
  const date = new Date(parsed)
  if (date.getUTCFullYear() !== Number(match[1]) ||
      date.getUTCMonth() + 1 !== Number(match[2]) ||
      date.getUTCDate() !== Number(match[3]) ||
      date.getUTCHours() !== Number(match[4]) ||
      date.getUTCMinutes() !== Number(match[5]) ||
      date.getUTCSeconds() !== Number(match[6])) return null
  return parsed
}

/**
 * Fail-closed subscription access for SERVICES ONLY.
 * providerVerified MUST be derived from a validated, durably committed PSP
 * event by the backend, never from a browser field or a success redirect.
 * This pure projection DOES NOT verify webhook signatures, issue sessions,
 * authorize user identity, create an entitlement, or grant NFT ownership.
 *
 * periodEnd and canceledAt must be canonical UTC strings (Z suffix);
 * normalize provider timestamps in the trusted adapter before calling.
 */
export function projectSubscriptionAccess({
  status,
  providerVerified = false,
  periodEnd,
  canceledAt = null,
  refunded = false,
  now = Date.now(),
} = {}) {
  const deny = reason => ({
    has_access: false, reason, entitlement_source: null,
    nft_owned: false, mint_allowed: false,
  })
  if (providerVerified !== true) return deny('subscription_not_provider_verified')
  // Reject ambiguous provider ledger flags rather than treating strings as booleans.
  if (refunded !== false) return deny('subscription_refunded_or_unknown')
  if (typeof now !== 'number' || !Number.isFinite(now)) return deny('invalid_clock')
  const end = parseVerifiedUtcTimestamp(periodEnd)
  if (end === null) return deny('invalid_subscription_period')
  if (end <= now) return deny('subscription_expired')
  if (![SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIALING, SUBSCRIPTION_STATUS.CANCELED].includes(status)) {
    return deny('subscription_not_active')
  }
  if (canceledAt != null) {
    const canceled = parseVerifiedUtcTimestamp(canceledAt)
    if (canceled === null || canceled > now || canceled > end ||
        ![SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.CANCELED].includes(status)) {
      return deny('invalid_subscription_cancellation')
    }
  }
  // Canceled access is allowed only through an independently verified
  // paid-through period AND actual (not scheduled future) cancellation evidence.
  if (status === SUBSCRIPTION_STATUS.CANCELED && canceledAt == null) {
    return deny('cancellation_evidence_required')
  }
  return {
    has_access: true, reason: 'subscription_period_verified',
    entitlement_source: 'verified_subscription',
    nft_owned: false, mint_allowed: false,
  }
}
