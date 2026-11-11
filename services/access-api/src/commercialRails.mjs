/**
 * xArtists commercial routing — operator-approved TARGET PRICES only.
 * Read-only preview data. No executable quote, payment authorization, mint,
 * Stripe product creation, wallet transfer, IPN or checkout.
 */
export const FIAT_SERVICE_TIERS = Object.freeze({
  fiat_379: Object.freeze({ cents: 379, currency: 'EUR', interval: 'month', includes_nft: false }),
  fiat_579: Object.freeze({ cents: 579, currency: 'EUR', interval: 'month', includes_nft: false }),
  fiat_979: Object.freeze({ cents: 979, currency: 'EUR', interval: 'month', includes_nft: false }),
})
export const GENESIS_EGLD_TARGETS = Object.freeze({
  pulse: Object.freeze({ egld: '33', currency: 'EGLD', requires_wallet: true, includes_nft: true }),
  yield: Object.freeze({ egld: '22', currency: 'EGLD', requires_wallet: true, includes_nft: true }),
  sentinel: Object.freeze({ egld: '11', currency: 'EGLD', requires_wallet: true, includes_nft: true }),
})
// Last READ-ONLY reference from 2026-11-08; NOT a quote today.
export const LAST_OBSERVED_MAINNET_EGLD = Object.freeze({
  pulse: '1', yield: '5', sentinel: '2.5',
})

const closed = (reason, data = {}) => ({
  ...data, preview_only: true, checkout_enabled: false,
  can_pay: false, can_mint: false, can_grant_entitlement: false,
  reason,
})

/** Returns a safe catalog preview. Never converts EUR to EGLD. */
export function previewCommercialOffer({ sku, provider } = {}) {
  if (typeof sku !== 'string' || typeof provider !== 'string') return closed('invalid_commercial_route')
  if (Object.hasOwn(FIAT_SERVICE_TIERS, sku)) {
    if (provider !== 'stripe') return closed('fiat_subscription_requires_stripe_sandbox_review')
    return closed('stripe_fiat_services_sandbox_only', {
      sku, provider: 'stripe', ...FIAT_SERVICE_TIERS[sku],
      requires_wallet: false, entitlement_class: 'subscription_services_only',
    })
  }
  if (Object.hasOwn(GENESIS_EGLD_TARGETS, sku)) {
    if (provider !== 'multiversx_wallet') {
      return closed('genesis_requires_verified_wallet_and_egld')
    }
    return closed('genesis_price_target_not_verified_onchain', {
      sku, provider: 'multiversx_wallet', ...GENESIS_EGLD_TARGETS[sku],
      observed_2026_11_08_egld: LAST_OBSERVED_MAINNET_EGLD[sku],
      entitlement_class: 'genesis_nft_only_after_onchain_proof',
    })
  }
  if (provider === 'moonpay') return closed('moonpay_egld_onramp_not_nft_purchase')
  if (provider === 'paybox') return closed('paybox_independent_psp_not_certified')
  if (provider === 'finance_computer') return closed('finance_computer_unverified_partnership')
  return closed('unknown_product_or_provider')
}
