import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ACCOUNT_TYPE, COMMERCE_MODE, ENTITLEMENT_SOURCE,
  deriveAccountType, availableCommerceModes, evaluateCommerceIntent,
} from '../src/accountTypes.mjs'

const wallet = {
  network: 'multiversx',
  address: 'erd1' + 'q'.repeat(58),
  verified_at: '2026-11-09T07:00:00Z',
}
test('walletless account cannot use EGLD purchase', () => {
  assert.equal(deriveAccountType([]), ACCOUNT_TYPE.WALLETLESS)
  assert.deepEqual(availableCommerceModes([]), [COMMERCE_MODE.FIAT_SUBSCRIPTION])
  assert.equal(evaluateCommerceIntent({
    mode: COMMERCE_MODE.EGLD_PURCHASE, paymentVerified: true, chainVerified: true,
  }).allowed, false)
})
test('unverified and malformed wallets never grant wallet-linked account type', () => {
  assert.equal(deriveAccountType([{ ...wallet, verified_at: null }]), ACCOUNT_TYPE.WALLETLESS)
  assert.equal(deriveAccountType([{ ...wallet, network: 'other' }]), ACCOUNT_TYPE.WALLETLESS)
  assert.equal(deriveAccountType([{ ...wallet, address: 'fake' }]), ACCOUNT_TYPE.WALLETLESS)
  assert.throws(() => deriveAccountType(null), /wallets_must_be_array/)
})
test('verified wallet exposes EGLD and fiat subscription modes', () => {
  assert.equal(deriveAccountType([wallet]), ACCOUNT_TYPE.WALLET_LINKED)
  assert.deepEqual(availableCommerceModes([wallet]), [
    COMMERCE_MODE.EGLD_PURCHASE, COMMERCE_MODE.FIAT_SUBSCRIPTION,
  ])
})
test('fiat subscription grants only subscription access, never NFT mint', () => {
  for (const wallets of [[], [wallet]]) {
    const r = evaluateCommerceIntent({
      mode: COMMERCE_MODE.FIAT_SUBSCRIPTION, wallets,
      paymentVerified: true, chainVerified: true,
    })
    assert.equal(r.allowed, true)
    assert.equal(r.entitlement_source, ENTITLEMENT_SOURCE.SUBSCRIPTION)
    assert.equal(r.mint_allowed, false)
  }
  assert.equal(evaluateCommerceIntent({
    mode: COMMERCE_MODE.FIAT_SUBSCRIPTION, paymentVerified: false,
  }).allowed, false)
})
test('EGLD requires verified wallet and both payment and chain evidence', () => {
  for (const paymentVerified of [false, true]) {
    for (const chainVerified of [false, true]) {
      const r = evaluateCommerceIntent({
        mode: COMMERCE_MODE.EGLD_PURCHASE, wallets: [wallet],
        paymentVerified, chainVerified,
      })
      assert.equal(r.allowed, paymentVerified && chainVerified)
      assert.equal(r.mint_allowed, false)
    }
  }
  const approved = evaluateCommerceIntent({
    mode: COMMERCE_MODE.EGLD_PURCHASE, wallets: [wallet],
    paymentVerified: true, chainVerified: true,
  })
  assert.equal(approved.entitlement_source, ENTITLEMENT_SOURCE.NFT)
})
test('one-off fiat NFT checkout and unknown modes are rejected', () => {
  for (const mode of ['fiat_nft_purchase', 'fiat_one_off', '', null]) {
    const r = evaluateCommerceIntent({ mode, wallets: [wallet], paymentVerified: true, chainVerified: true })
    assert.equal(r.allowed, false)
    assert.equal(r.mint_allowed, false)
    assert.equal(r.entitlement_source, null)
  }
})
