/**
 * MoonPay hosted on-ramp helpers.
 * Apple Pay: paymentMethod=apple_pay (Safari / device with Apple Pay).
 * Widget must NOT run in a sandboxed iframe for Apple Pay — we use window.open.
 * @see https://dev.moonpay.com/widget/on-ramp/customization/parameters
 */

export type MoonpayPaymentMethod =
  | 'apple_pay'
  | 'google_pay'
  | 'credit_debit_card'
  | 'sepa_bank_transfer'

export type BuildMoonpayUrlOpts = {
  walletAddress: string
  currencyCode?: string
  /** Prefer Apple Pay / Google Pay / card */
  paymentMethod?: MoonpayPaymentMethod
  /** Fiat amount hint (USD) */
  baseCurrencyAmount?: string | number
  baseCurrencyCode?: string
  redirectURL?: string
  colorCode?: string
}

const DEFAULT_WALLET =
  'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

export function getMoonpayPublicKey(): string | undefined {
  const k = import.meta.env.VITE_MOONPAY_PUBLIC_KEY as string | undefined
  return k?.trim() || undefined
}

export function isMoonpayLive(): boolean {
  return Boolean(getMoonpayPublicKey())
}

export function buildMoonpayBuyUrl(opts: BuildMoonpayUrlOpts): string {
  const publicKey = getMoonpayPublicKey() || 'pk_test_123'
  const live = Boolean(getMoonpayPublicKey())
  const base = live ? 'https://buy.moonpay.com' : 'https://buy-staging.moonpay.com'

  const currencyCode = (opts.currencyCode || 'EGLD').replace(/^\$/, '')
  const walletAddress = opts.walletAddress?.startsWith('erd1')
    ? opts.walletAddress
    : DEFAULT_WALLET

  const params = new URLSearchParams({
    apiKey: publicKey,
    currencyCode: currencyCode === 'TRO' ? 'EGLD' : currencyCode,
    walletAddress,
  })

  if (currencyCode.toUpperCase() === 'EGLD' || currencyCode.toUpperCase() === 'TRO') {
    params.set('currencyCode', 'egl d'.includes(' ') ? 'EGLD' : 'EGLD')
    params.set('currencyCode', 'EGLD')
  }

  if (opts.paymentMethod) {
    params.set('paymentMethod', opts.paymentMethod)
  }
  if (opts.baseCurrencyAmount != null && opts.baseCurrencyAmount !== '') {
    params.set('baseCurrencyAmount', String(opts.baseCurrencyAmount))
  }
  if (opts.baseCurrencyCode) {
    params.set('baseCurrencyCode', opts.baseCurrencyCode)
  } else if (opts.baseCurrencyAmount != null) {
    params.set('baseCurrencyCode', 'usd')
  }
  if (opts.redirectURL) {
    params.set('redirectURL', opts.redirectURL)
  }
  if (opts.colorCode) {
    params.set('colorCode', opts.colorCode.replace('#', ''))
  } else {
    params.set('colorCode', '7c3aed')
  }

  // MultiversX EGLD
  if ((params.get('currencyCode') || '').toUpperCase() === 'EGLD') {
    // chain param supported on some MoonPay builds
    params.set('theme', 'dark')
  }

  return `${base}/?${params.toString()}`
}

export function openMoonpayBuy(opts: BuildMoonpayUrlOpts): void {
  const url = buildMoonpayBuyUrl(opts)
  window.open(url, '_blank', 'noopener,noreferrer')
}

/** Rough client hint — real availability decided inside MoonPay + Apple. */
export function maySupportApplePay(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent || ''
  const isAppleDevice = /iPhone|iPad|iPod|Macintosh/.test(ua)
  const isSafari =
    /Safari/.test(ua) && !/Chrome|Chromium|Edg|Firefox|Android/.test(ua)
  // Safari on Mac / iOS is the primary Apple Pay web surface
  return isAppleDevice && (isSafari || /iPhone|iPad|iPod/.test(ua))
}

export { DEFAULT_WALLET as MOONPAY_DEFAULT_WALLET }
