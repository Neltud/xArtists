import { createHmac } from 'node:crypto'

const FIELDS = new Set([
  'apiKey', 'currencyCode', 'baseCurrencyCode', 'baseCurrencyAmount',
  'walletAddress', 'email', 'redirectURL', 'colorCode', 'theme', 'language', 'paymentMethod',
])
const METHODS = new Set(['apple_pay', 'google_pay', 'credit_debit_card', 'sepa_bank_transfer'])

export function appendMoonpaySignature(raw, secretKey) {
  const signature = createHmac('sha256', secretKey).update(new URL(raw).search).digest('base64')
  return `${raw}&signature=${encodeURIComponent(signature)}`
}

export function moonpayConfig(env = process.env) {
  const publicKey = (env.MOONPAY_PUBLIC_KEY || '').trim()
  const secretKey = (env.MOONPAY_SECRET_KEY || '').trim()
  const mode = /^pk_(test|live)_[A-Za-z0-9_-]{8,}$/.exec(publicKey)?.[1]
  const ready = Boolean(mode && secretKey.startsWith(`sk_${mode}_`) && secretKey.length > 16)
  return {
    publicKey, secretKey, ready,
    mode: mode || 'off',
    origin: mode === 'test' ? 'https://buy-sandbox.moonpay.com' : 'https://buy.moonpay.com',
    returnUrl: env.MOONPAY_RETURN_URL || 'https://neltud.github.io/xArtists/',
  }
}

/** Pure URL signing. Never calls MoonPay, buys assets, or exposes the secret. */
export function signMoonpayUrl(raw, config = moonpayConfig()) {
  if (!config.ready) throw Object.assign(new Error('moonpay_not_configured'), { statusCode: 503 })
  if (typeof raw !== 'string' || raw.length > 4096 || /[\s<>]/.test(raw)) throw new Error('invalid_moonpay_url')
  const url = new URL(raw)
  if (url.origin !== config.origin || url.pathname !== '/' || url.username || url.password || url.hash) {
    throw new Error('invalid_moonpay_origin')
  }
  const seen = new Set()
  for (const [key] of url.searchParams) {
    if (!FIELDS.has(key) || seen.has(key)) throw new Error('invalid_moonpay_parameter')
    seen.add(key)
  }
  const q = url.searchParams
  if (q.get('apiKey') !== config.publicKey) throw new Error('moonpay_key_mismatch')
  // This integration delivers EGLD to MultiversX. Other assets need their own verified route.
  if (q.get('currencyCode') !== 'egld') throw new Error('unsupported_moonpay_asset')
  if (!['eur', 'usd', 'gbp'].includes(q.get('baseCurrencyCode'))) throw new Error('invalid_fiat_currency')
  if (q.has('baseCurrencyAmount')) {
    const amount = q.get('baseCurrencyAmount')
    if (!/^\d+(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0 || Number(amount) > 10000) throw new Error('invalid_fiat_amount')
  }
  if (q.has('walletAddress') && !/^erd1[023456789acdefghjklmnpqrstuvwxyz]{58}$/.test(q.get('walletAddress'))) throw new Error('invalid_wallet')
  if (q.has('email') && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.get('email')) || q.get('email').length > 254)) throw new Error('invalid_email')
  if (q.has('paymentMethod') && !METHODS.has(q.get('paymentMethod'))) throw new Error('invalid_payment_method')
  if (q.has('colorCode') && !/^[0-9a-f]{6}$/i.test(q.get('colorCode'))) throw new Error('invalid_theme_color')
  if (q.has('theme') && !['dark', 'light'].includes(q.get('theme'))) throw new Error('invalid_theme')
  if (q.has('language') && !['fr', 'en'].includes(q.get('language'))) throw new Error('invalid_language')
  if (q.has('redirectURL')) {
    const target = new URL(q.get('redirectURL'))
    const allowed = new URL(config.returnUrl)
    if (target.protocol !== 'https:' || target.username || target.password ||
      target.origin !== allowed.origin || target.pathname !== allowed.pathname || target.search !== allowed.search) {
      throw new Error('invalid_return_url')
    }
  }
  // Keep the original encoded query bytes and order; signature must be last.
  return appendMoonpaySignature(raw, config.secretKey)
}
