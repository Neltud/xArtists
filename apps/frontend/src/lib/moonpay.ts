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
  paymentMethod?: MoonpayPaymentMethod
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

  let currencyCode = (opts.currencyCode || 'EGLD').replace(/^\$/, '').toUpperCase()
  if (currencyCode === 'TRO') currencyCode = 'EGLD'

  const walletAddress = opts.walletAddress?.startsWith('erd1')
    ? opts.walletAddress
    : DEFAULT_WALLET

  const params = new URLSearchParams({
    apiKey: publicKey,
    currencyCode,
    walletAddress,
    theme: 'dark',
    colorCode: (opts.colorCode || '7c3aed').replace('#', ''),
  })

  if (opts.paymentMethod) {
    params.set('paymentMethod', opts.paymentMethod)
  }
  if (opts.baseCurrencyAmount != null && opts.baseCurrencyAmount !== '') {
    params.set('baseCurrencyAmount', String(opts.baseCurrencyAmount))
    params.set('baseCurrencyCode', (opts.baseCurrencyCode || 'usd').toLowerCase())
  }
  if (opts.redirectURL) {
    params.set('redirectURL', opts.redirectURL)
  }

  return `${base}/?${params.toString()}`
}

export function openMoonpayBuy(opts: BuildMoonpayUrlOpts): void {
  const url = buildMoonpayBuyUrl(opts)
  window.open(url, '_blank', 'noopener,noreferrer')
}

/** Client hint only — MoonPay + Apple decide final availability. */
export function maySupportApplePay(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent || ''
  const isAppleDevice = /iPhone|iPad|iPod|Macintosh/.test(ua)
  const isSafari =
    /Safari/.test(ua) && !/Chrome|Chromium|Edg|Firefox|Android/.test(ua)
  return isAppleDevice && (isSafari || /iPhone|iPad|iPod/.test(ua))
}

export { DEFAULT_WALLET as MOONPAY_DEFAULT_WALLET }
