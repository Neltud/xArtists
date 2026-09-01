/**
 * Paybox / e-Transactions — paiement carte FR (redirection hosted, comme MoonPay).
 * Secret / signature uniquement côté serveur.
 *
 * VITE_PAYBOX_PAYMENT_URL = URL de session préparée par le backend.
 */

export function getPayboxPaymentUrl(): string | undefined {
  const u = (import.meta.env.VITE_PAYBOX_PAYMENT_URL as string | undefined)?.trim()
  return u || undefined
}

export function isPayboxConfigured(): boolean {
  return Boolean(getPayboxPaymentUrl())
}

export function openPayboxCheckout(opts?: {
  orderId?: string
  amountCents?: number
  returnUrl?: string
}): boolean {
  const base = getPayboxPaymentUrl()
  if (!base) return false
  try {
    const url = new URL(base)
    if (opts?.orderId) url.searchParams.set('orderId', opts.orderId)
    if (opts?.amountCents != null) url.searchParams.set('amount', String(opts.amountCents))
    if (opts?.returnUrl) url.searchParams.set('returnUrl', opts.returnUrl)
    window.open(url.toString(), '_blank', 'noopener,noreferrer')
    return true
  } catch {
    window.open(base, '_blank', 'noopener,noreferrer')
    return true
  }
}
