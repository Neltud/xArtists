/** MoonPay EGLD on-ramp. Public key in Vite; HMAC secret only in Access API. */
const BUY_BASE_PROD = 'https://buy.moonpay.com'
const BUY_BASE_SANDBOX = 'https://buy-sandbox.moonpay.com'

export type MoonpayPaymentMethod = 'apple_pay' | 'google_pay' | 'credit_debit_card' | 'sepa_bank_transfer'
export type MoonPayBuyParams = {
  walletAddress?: string
  baseCurrencyAmount?: number | string
  baseCurrencyCode?: 'eur' | 'usd' | 'gbp'
  currencyCode?: string
  email?: string
  redirectURL?: string
  colorCode?: string
  paymentMethod?: MoonpayPaymentMethod
}

export function getMoonPayApiKey(): string {
  return (import.meta.env.VITE_MOONPAY_API_KEY as string | undefined)?.trim() || ''
}

function getSigningApi(): string {
  const raw = (import.meta.env.VITE_ACCESS_API_BASE as string | undefined)?.trim() || ''
  try {
    const url = new URL(raw)
    const local = ['localhost', '127.0.0.1'].includes(url.hostname)
    if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash) return ''
    return raw.replace(/\/+$/, '')
  } catch {
    return ''
  }
}

export function isMoonPayConfigured(): boolean {
  return /^pk_(test|live)_[A-Za-z0-9_-]{8,}$/.test(getMoonPayApiKey()) && Boolean(getSigningApi())
}

export function isMoonPaySandbox(): boolean {
  return getMoonPayApiKey().startsWith('pk_test_')
}

function buildUnsignedUrl(p: MoonPayBuyParams): string {
  if ((p.currencyCode || 'egld').toLowerCase() !== 'egld') throw new Error('Cet achat par carte prend en charge EGLD.')
  const q = new URLSearchParams({
    apiKey: getMoonPayApiKey(),
    currencyCode: 'egld',
    baseCurrencyCode: p.baseCurrencyCode || 'eur',
    colorCode: (p.colorCode || '8b5cf6').replace(/^#/, ''),
    theme: 'dark',
    language: 'fr',
  })
  if (p.baseCurrencyAmount != null) {
    const amount = Number(p.baseCurrencyAmount)
    if (!Number.isFinite(amount) || amount <= 0 || amount > 10000 || !/^\d+(?:\.\d{1,2})?$/.test(String(p.baseCurrencyAmount))) throw new Error('Montant d’achat invalide.')
    q.set('baseCurrencyAmount', String(p.baseCurrencyAmount))
  }
  if (p.walletAddress) {
    const address = p.walletAddress.trim()
    if (!/^erd1[023456789acdefghjklmnpqrstuvwxyz]{58}$/.test(address)) throw new Error('Adresse MultiversX invalide.')
    q.set('walletAddress', address)
  }
  if (p.email) q.set('email', p.email)
  if (p.redirectURL) q.set('redirectURL', p.redirectURL)
  if (p.paymentMethod) q.set('paymentMethod', p.paymentMethod)
  return `${isMoonPaySandbox() ? BUY_BASE_SANDBOX : BUY_BASE_PROD}/?${q.toString()}`
}

/** No unsigned fallback: never silently drop the recipient or open a rejected URL. */
export async function getMoonPayCheckoutUrl(params: MoonPayBuyParams = {}): Promise<string> {
  if (!isMoonPayConfigured()) throw new Error('Achat par carte indisponible pour le moment.')
  const unsigned = buildUnsignedUrl(params)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(`${getSigningApi()}/moonpay/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: unsigned }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error('MoonPay indisponible. Aucun paiement n’a été lancé.')
    const body = await response.json() as { url?: unknown }
    const prefix = `${unsigned}&signature=`
    if (typeof body.url !== 'string' || !body.url.startsWith(prefix) ||
      !/^[A-Za-z0-9%]+$/.test(body.url.slice(prefix.length)) ||
      !/^[A-Za-z0-9+/]{43}=$/.test(decodeURIComponent(body.url.slice(prefix.length)))) {
      throw new Error('Lien de paiement non vérifiable. Aucun paiement n’a été lancé.')
    }
    return body.url
  } finally {
    clearTimeout(timeout)
  }
}

/** Same-tab checkout avoids a popup after the asynchronous signature. */
export async function openMoonPayBuy(params: MoonPayBuyParams = {}): Promise<{ ok: boolean; error?: string }> {
  try {
    const url = await getMoonPayCheckoutUrl(params)
    window.location.assign(url)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'MoonPay indisponible.' }
  }
}

export function moonpayStatusHint(): string {
  return !isMoonPayConfigured() ? 'off' : isMoonPaySandbox() ? 'sandbox' : 'live'
}

export const MOONPAY_DEFAULT_WALLET = ''
export const isMoonpayLive = () => isMoonPayConfigured() && !isMoonPaySandbox()
export const openMoonpayBuy = openMoonPayBuy

export function maySupportApplePay(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as Window & { ApplePaySession?: { canMakePayments?: () => boolean } }
  try { return Boolean(w.ApplePaySession?.canMakePayments?.()) } catch { return false }
}

export function maySupportGooglePay(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|Chrome/i.test(navigator.userAgent) && !/iPhone|iPad/i.test(navigator.userAgent)
}
