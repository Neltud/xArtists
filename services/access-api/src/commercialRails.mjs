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

/**
 * Global Pay roadmap, NOT a provider availability or transaction authorization.
 * Each rail must obtain independent commercial/regulatory approval and a
 * verified environment before being promoted. Wallet NFT mainnet gates are
 * owned by the separate marketplace code, not this fiat catalog.
 */
export function globalPaymentReadiness() {
  const planned = (id, purpose, candidates, currencies, requiredEvidence) => ({
    id, purpose, candidates, currencies, required_evidence: requiredEvidence,
    status: 'not_released', checkout_enabled: false, transfer_enabled: false,
    stored_balance_enabled: false, card_issuance_enabled: false,
  })
  return {
    schema: 'xartists_global_pay_readiness/v1',
    mode: 'planning_only',
    custody_by_xartists: false,
    supported_display_currencies_target: ['EUR','USD','GBP'],
    rails: [
      planned('service_checkout','merchant_payment',['stripe','paybox'],['EUR','USD','GBP'],
        ['merchant_activity_approved','test_checkout_and_signed_webhook','tax_and_refund_policy']),
      planned('artist_payout','marketplace_settlement',['stripe_connect'],['EUR','USD','GBP'],
        ['marketplace_activity_approved','seller_onboarding_and_country_eligibility','payout_and_dispute_reconciliation']),
      planned('crypto_onramp','external_wallet_delivery',['moonpay'],['EUR','USD','GBP'],
        ['provider_and_country_asset_eligibility','signed_checkout_and_recipient_binding','provider_receipt_and_delivery']),
      planned('payment_account','regulated_partner_account',[],['EUR','USD','GBP'],
        ['licensed_partner_contract','kyc_aml_and_jurisdiction_approval','reconciled_partner_balance_and_withdrawal']),
      planned('debit_card','regulated_partner_card',[],['EUR','USD','GBP'],
        ['issuer_contract_and_consumer_program_approval','eligible_funding_account','card_lifecycle_disputes_and_limits']),
    ],
  }
}
