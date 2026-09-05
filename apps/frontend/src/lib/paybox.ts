/**
 * Paybox / e-Transactions — carte FR (hosted redirect, secrets serveur uniquement).
 *
 * 1) POST {VITE_ACCESS_API_BASE}/v1/checkout/paybox → { url }
 * 2) Fallback GET VITE_PAYBOX_PAYMENT_URL?orderId&amount&…
 */

import type { PackId } from '../config/agentPacks'
import { getAccessApiBase, buildPackSuccessUrl, buildPackCancelUrl } from './stripe'

export function getPayboxPaymentUrl(): string | undefined {
  const u = (import.meta.env.VITE_PAYBOX_PAYMENT_URL as string | undefined)?.trim()
  return u || undefined
}

export function isPayboxConfigured(): boolean {
  return Boolean(getAccessApiBase() || getPayboxPaymentUrl())
}

export type PayboxSessionRequest = {
  pack_id: PackId
  buyer_address: string
  amount_cents: number
  success_url?: string
  cancel_url?: string
}

export async function createPayboxSession(
  body: PayboxSessionRequest
): Promise<{ url?: string; order_id?: string }> {
  const api = getAccessApiBase()
  if (!api) throw new Error('VITE_ACCESS_API_BASE manquant pour Paybox API')

  const r = await fetch(`${api}/v1/checkout/paybox`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...body,
      provider: 'paybox',
      currency: 'eur',
      success_url: body.success_url || buildPackSuccessUrl(),
      cancel_url: body.cancel_url || buildPackCancelUrl(),
    }),
  })
  if (!r.ok) {
    const text = await r.text().catch(() => '')
    throw new Error(`Paybox session HTTP ${r.status}${text ? `: ${text.slice(0, 120)}` : ''}`)
  }
  return (await r.json()) as { url?: string; order_id?: string }
}

/** Ouvre le TPE hébergé (URL backend ou VITE_PAYBOX_PAYMENT_URL). */
export function openPayboxCheckout(opts: {
  orderId: string
  amountCents: number
  returnUrl?: string
  packId?: PackId
  buyerAddress?: string
}): boolean {
  const base = getPayboxPaymentUrl()
  if (!base) return false
  try {
    const url = new URL(base)
    url.searchParams.set('orderId', opts.orderId)
    url.searchParams.set('amount', String(opts.amountCents))
    if (opts.returnUrl) url.searchParams.set('returnUrl', opts.returnUrl)
    if (opts.packId) url.searchParams.set('pack_id', opts.packId)
    if (opts.buyerAddress) url.searchParams.set('buyer_address', opts.buyerAddress)
    window.location.href = url.toString()
    return true
  } catch {
    window.location.href = base
    return true
  }
}

/**
 * Démarre Paybox : session API → URL env → paper.
 */
export async function startPayboxCardPayment(opts: {
  packId: PackId
  buyerAddress: string
  amountEur: number
}): Promise<'redirect' | 'payment_link' | 'paper'> {
  const amountCents = Math.round(opts.amountEur * 100)
  const orderId = `xa-${opts.packId}-${Date.now().toString(36)}`

  const api = getAccessApiBase()
  if (api) {
    try {
      const session = await createPayboxSession({
        pack_id: opts.packId,
        buyer_address: opts.buyerAddress,
        amount_cents: amountCents,
      })
      if (session.url) {
        window.location.href = session.url
        return 'redirect'
      }
    } catch {
      /* fallback URL env */
    }
  }

  if (getPayboxPaymentUrl()) {
    const ok = openPayboxCheckout({
      orderId,
      amountCents,
      returnUrl: buildPackSuccessUrl(),
      packId: opts.packId,
      buyerAddress: opts.buyerAddress,
    })
    if (ok) return 'payment_link'
  }

  return 'paper'
}
