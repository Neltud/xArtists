/**
 * MoonPay on-ramp — buy EGLD with card / Apple Pay.
 * Public key only in front. walletAddress signature via backend if configured.
 *
 * Secrets (GitHub Actions / Pages — never commit):
 *   VITE_MOONPAY_API_KEY=pk_live_… or pk_test_…
 * Optional server: VITE_ACCESS_API_BASE + POST /moonpay/sign { url }
 */

const BUY_BASE_PROD = 'https://buy.moonpay.com'
const BUY_BASE_SANDBOX = 'https://buy-sandbox.moonpay.com'

export function getMoonPayApiKey(): string {
  const k = (import.meta.env.VITE_MOONPAY_API_KEY as string | undefined)?.trim() || ''
  return k
}

export function isMoonPayConfigured(): boolean {
  const k = getMoonPayApiKey()
  return k.startsWith('pk_') && k.length > 20
}

export function isMoonPaySandbox(): boolean {
  return getMoonPayApiKey().startsWith('pk_test')
}

export type MoonPayBuyParams = {
  /** erd1… destination — requires URL signature when set */
  walletAddress?: string
  /** Fiat amount prefill e.g. 50 */
  baseCurrencyAmount?: number
  baseCurrencyCode?: 'eur' | 'usd' | 'gbp'
  /** default egld */
  currencyCode?: string
  email?: string
  redirectURL?: string
  colorCode?: string
}

function buildUnsignedUrl(p: MoonPayBuyParams): string {
  const apiKey = getMoonPayApiKey()
  const base = isMoonPaySandbox() ? BUY_BASE_SANDBOX : BUY_BASE_PROD
  const q = new URLSearchParams()
  q.set('apiKey', apiKey)
  q.set('currencyCode', (p.currencyCode || 'egld').toLowerCase())
  q.set('baseCurrencyCode', (p.baseCurrencyCode || 'eur').toLowerCase())
  if (p.baseCurrencyAmount != null && p.baseCurrencyAmount > 0) {
    q.set('baseCurrencyAmount', String(p.baseCurrencyAmount))
  }
  if (p.walletAddress?.startsWith('erd1')) {
    q.set('walletAddress', p.walletAddress.trim())
  }
  if (p.email) q.set('email', p.email)
  if (p.redirectURL) q.set('redirectURL', p.redirectURL)
  // xArtists dark theme accent
  q.set('colorCode', (p.colorCode || '8b5cf6').replace('#', ''))
  q.set('theme', 'dark')
  q.set('language', 'fr')
  return `${base}?${q.toString()}`
}

/** Optional HMAC signature from Access API (secret key server-side). */
async function signUrlIfPossible(url: string): Promise<string> {
  const api = (import.meta.env.VITE_ACCESS_API_BASE as string | undefined)?.replace(/\/$/, '')
  if (!api) return url
  try {
    const r = await fetch(`${api}/moonpay/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    if (!r.ok) return url
    const j = (await r.json()) as { signature?: string; url?: string }
    if (j.url && typeof j.url === 'string') return j.url
    if (j.signature) {
      const u = new URL(url)
      u.searchParams.set('signature', j.signature)
      return u.toString()
    }
  } catch {
    /* open unsigned — user pastes address in MoonPay */
  }
  return url
}

/**
 * Opens MoonPay buy widget in a new tab.
 * Without backend sign, walletAddress is omitted so MoonPay does not require signature.
 */
export async function openMoonPayBuy(params: MoonPayBuyParams = {}): Promise<{ ok: boolean; error?: string }> {
  if (!isMoonPayConfigured()) {
    return {
      ok: false,
      error: 'MoonPay non configuré — ajoute VITE_MOONPAY_API_KEY (pk_test_… / pk_live_…) dans les secrets Pages.',
    }
  }

  // Without sign endpoint, strip wallet to avoid MoonPay signature rejection
  const api = (import.meta.env.VITE_ACCESS_API_BASE as string | undefined)?.replace(/\/$/, '')
  const p: MoonPayBuyParams = { ...params }
  if (!api && p.walletAddress) {
    // Prefer signed wallet when API present; else open without lock-in address
    // User can still paste erd1 in the widget.
    delete p.walletAddress
  }

  let url = buildUnsignedUrl(p)
  if (params.walletAddress && api) {
    url = buildUnsignedUrl({ ...params })
    url = await signUrlIfPossible(url)
  }

  try {
    const w = window.open(url, '_blank', 'noopener,noreferrer')
    if (!w) {
      // popup blocked — navigate same tab
      window.location.assign(url)
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ouverture MoonPay échouée' }
  }
}

export function moonpayStatusHint(): string {
  if (!isMoonPayConfigured()) return 'off'
  return isMoonPaySandbox() ? 'sandbox' : 'live'
}

/** Compat exports for on-ramp UI (camelCase callers). */
export const MOONPAY_DEFAULT_WALLET = ''
export type MoonpayPaymentMethod =
  | 'apple_pay'
  | 'google_pay'
  | 'credit_debit_card'
  | 'sepa_bank_transfer'
export const isMoonpayLive = isMoonPayConfigured
export const openMoonpayBuy = openMoonPayBuy

export function maySupportApplePay(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as Window & { ApplePaySession?: { canMakePayments?: () => boolean } }
  try {
    return !!w.ApplePaySession?.canMakePayments?.()
  } catch {
    return false
  }
}

export function maySupportGooglePay(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /Android|Chrome/i.test(ua) && !/iPhone|iPad/i.test(ua)
}
