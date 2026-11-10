import test from 'node:test'
import assert from 'node:assert/strict'
import {
  previewCommercialOffer, FIAT_SERVICE_TIERS, GENESIS_EGLD_TARGETS,
  LAST_OBSERVED_MAINNET_EGLD,
} from '../src/commercialRails.mjs'

function alwaysClosed(result) {
  assert.equal(result.preview_only, true)
  assert.equal(result.checkout_enabled, false)
  assert.equal(result.can_pay, false)
  assert.equal(result.can_mint, false)
  assert.equal(result.can_grant_entitlement, false)
}
test('the three owner-confirmed EUR monthly offers are walletless and NEVER NFTs', () => {
  for (const [sku, cents] of [['fiat_379',379],['fiat_579',579],['fiat_979',979]]) {
    const result=previewCommercialOffer({sku,provider:'stripe'})
    alwaysClosed(result)
    assert.equal(result.cents,cents)
    assert.equal(result.interval,'month')
    assert.equal(result.currency,'EUR')
    assert.equal(result.includes_nft,false)
    assert.equal(result.requires_wallet,false)
    assert.equal(result.entitlement_class,'subscription_services_only')
    assert.equal(FIAT_SERVICE_TIERS[sku].cents,cents)
  }
})
test('Genesis price targets 33/22/11 EGLD are NOT on-chain executable prices', () => {
  for (const [sku,egld,observed] of [
    ['pulse','33','1'],['yield','22','5'],['sentinel','11','2.5'],
  ]) {
    const r=previewCommercialOffer({sku,provider:'multiversx_wallet'})
    alwaysClosed(r)
    assert.equal(r.egld,egld)
    assert.equal(r.observed_2026_11_08_egld,observed)
    assert.equal(r.currency,'EGLD')
    assert.equal(r.includes_nft,true)
    assert.equal(r.requires_wallet,true)
    assert.equal(r.reason,'genesis_price_target_not_verified_onchain')
    assert.equal(GENESIS_EGLD_TARGETS[sku].egld,egld)
    assert.equal(LAST_OBSERVED_MAINNET_EGLD[sku],observed)
  }
})
test('an NFT cannot silently switch to a Stripe card checkout', () => {
  for (const provider of ['stripe','moonpay','paybox','finance_computer']) {
    const r=previewCommercialOffer({sku:'pulse',provider})
    alwaysClosed(r)
    assert.equal(r.reason,'genesis_requires_verified_wallet_and_egld')
  }
})
test('an EUR subscription never routes to a crypto or unknown PSP', () => {
  for (const provider of ['moonpay','paybox','multiversx_wallet','finance_computer']) {
    const r=previewCommercialOffer({sku:'fiat_379',provider})
    alwaysClosed(r)
    assert.equal(r.reason,'fiat_subscription_requires_stripe_sandbox_review')
  }
})
test('MoonPay is only an onramp, PayBox and Finance Computer are review-only', () => {
  const expected={moonpay:'moonpay_egld_onramp_not_nft_purchase',
    paybox:'paybox_independent_psp_not_certified',
    finance_computer:'finance_computer_unverified_partnership'}
  for (const [provider,reason] of Object.entries(expected)) {
    const r=previewCommercialOffer({sku:'not_an_offer',provider})
    alwaysClosed(r)
    assert.equal(r.reason,reason)
  }
})
test('unknown SKUs and prototype pollution keys never become offers', () => {
  for(const sku of ['constructor','__proto__','toString','fiat_2900','fiat_29000',
                      'yield_monthly','']) {
    const r=previewCommercialOffer({sku,provider:'stripe'})
    alwaysClosed(r)
    assert.equal(r.cents,undefined)
    assert.equal(r.egld,undefined)
  }
  for(const sku of [undefined,null,1,{},[]]) {
    const r=previewCommercialOffer({sku,provider:'stripe'})
    alwaysClosed(r)
    assert.equal(r.reason,'invalid_commercial_route')
  }
})
