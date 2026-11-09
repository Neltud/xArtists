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
 * Fail-closed subscription access.
 * `providerVerified` must come from server-side webhook verification and
 * transactionally persisted subscription records, never from request JSON.
 * `periodEnd` is an ISO timestamp; canceled subscriptions retain access only
 * if the provider-confirmed paid-through date is in the future.
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
  if (refunded === true) return deny('subscription_refunded')
  if (!Number.isFinite(now)) return deny('invalid_clock')
  if (typeof periodEnd !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(periodEnd)) {
    return deny('invalid_subscription_period')
  }
  const end = Date.parse(periodEnd)
  if (!Number.isFinite(end) || end <= now) return deny('subscription_expired')
  if (canceledAt != null && (!Number.isFinite(Date.parse(canceledAt)) ||
      ![SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.CANCELED].includes(status))) {
    return deny('invalid_subscription_cancellation')
  }
  if (![SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIALING, SUBSCRIPTION_STATUS.CANCELED].includes(status)) {
    return deny('subscription_not_active')
  }
  // A canceled subscription needs explicit cancellation evidence to retain access.
  if (status === SUBSCRIPTION_STATUS.CANCELED && canceledAt == null) {
    return deny('cancellation_evidence_required')
  }
  return {
    has_access: true, reason: 'subscription_period_verified',
    entitlement_source: 'verified_subscription',
    nft_owned: false, mint_allowed: false,
  }
}
