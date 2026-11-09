/** Pure account/commerce policy. No auth provider, payment, database writes or mint side effects. */
export const ACCOUNT_TYPE = Object.freeze({
  WALLETLESS: 'walletless',
  WALLET_LINKED: 'wallet_linked',
})
export const COMMERCE_MODE = Object.freeze({
  EGLD_PURCHASE: 'egld_purchase',
  FIAT_SUBSCRIPTION: 'fiat_subscription',
})
export const ENTITLEMENT_SOURCE = Object.freeze({
  NFT: 'verified_nft',
  SUBSCRIPTION: 'verified_subscription',
})

const isVerifiedWallet = wallet =>
  wallet?.network === 'multiversx' &&
  /^erd1[a-z0-9]{58}$/.test(wallet.address || '') &&
  typeof wallet.verified_at === 'string' &&
  Number.isFinite(Date.parse(wallet.verified_at))

export function deriveAccountType(wallets = []) {
  if (!Array.isArray(wallets)) throw new TypeError('wallets_must_be_array')
  return wallets.some(isVerifiedWallet) ? ACCOUNT_TYPE.WALLET_LINKED : ACCOUNT_TYPE.WALLETLESS
}

/** UI projection only: never authorize using this result without authenticated server checks. */
export function availableCommerceModes(wallets = []) {
  return deriveAccountType(wallets) === ACCOUNT_TYPE.WALLET_LINKED
    ? [COMMERCE_MODE.EGLD_PURCHASE, COMMERCE_MODE.FIAT_SUBSCRIPTION]
    : [COMMERCE_MODE.FIAT_SUBSCRIPTION]
}

/** Deny by default. Fiat subscriptions never create an NFT entitlement. */
export function evaluateCommerceIntent({ mode, wallets = [], paymentVerified = false, chainVerified = false } = {}) {
  const accountType = deriveAccountType(wallets)
  if (mode === COMMERCE_MODE.FIAT_SUBSCRIPTION) {
    return {
      allowed: paymentVerified === true,
      account_type: accountType,
      entitlement_source: paymentVerified === true ? ENTITLEMENT_SOURCE.SUBSCRIPTION : null,
      mint_allowed: false,
      reason: paymentVerified === true ? 'subscription_verified' : 'subscription_unverified',
    }
  }
  if (mode === COMMERCE_MODE.EGLD_PURCHASE) {
    const allowed = accountType === ACCOUNT_TYPE.WALLET_LINKED &&
      paymentVerified === true && chainVerified === true
    return {
      allowed,
      account_type: accountType,
      entitlement_source: allowed ? ENTITLEMENT_SOURCE.NFT : null,
      // This is only a policy precondition; actual mint still requires separate certified gates.
      mint_allowed: false,
      reason: allowed ? 'egld_proofs_verified_pending_mint_certification' : 'egld_wallet_or_proof_missing',
    }
  }
  return {
    allowed: false, account_type: accountType, entitlement_source: null,
    mint_allowed: false, reason: 'unsupported_commerce_mode',
  }
}
