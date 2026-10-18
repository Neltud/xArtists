/**
 * Paybox / e-Transactions — carte FR (hosted redirect, secrets serveur uniquement).
 *
 * SECURITY: amount is NEVER trusted from the client.
 * Backend (access-api / access_pack) looks up price from server catalog by pack_id only.
 * Do not pass amount_cents in the request body for payment; it is ignored server-side.
 */

import type { PackId } from '../config/agentPacks'
import { getAccessApiBase, buildPackSuccessUrl, buildPackCancelUrl } from './stripe'

export type PayboxSessionRequest = {
  pack_id: PackId
  buyer_address: string
  /** @deprecated Ignored by server. Kept for UI display only. */
  amount_cents?: number
  success_url?: string
  cancel_url?: string
}

export function getPayboxPaymentUrl(): string | undefined {
  const u = import.meta.env.VITE_PAYBOX_PAYMENT_URL as string | undefined
  return u?.trim() || undefined
}

export function isPayboxConfigured(): boolean {
  return Boolean(getAccessApiBase() || getPayboxPaymentUrl())
}

export async function createPayboxSession(
  body: PayboxSessionRequest
): Promise<{ url?: string; order_id?: string; amount_cents?: number; amount_eur?: number }> {
  const api = getAccessApiBase()
  if (!api) throw new Error('VITE_ACCESS_API_BASE manquant pour Paybox API')

  // Never send amount_cents — server catalog is the only source of truth
  const r = await fetch(`${api}/v1/checkout/paybox`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pack_id: body.pack_id,
      buyer_address: body.buyer_address,
      provider: 'paybox',
      currency: 'eur',
      success_url: body.success_url || buildPackSuccessUrl(body.pack_id),
      cancel_url: body.cancel_url || buildPackCancelUrl(),
    }),
  })
  if (!r.ok) {
    const text = await r.text().catch(() => '')
    throw new Error(`Paybox session HTTP ${r.status}${text ? `: ${text.slice(0, 120)}` : ''}`)
  }
  return (await r.json()) as { url?: string; order_id?: string; amount_cents?: number; amount_eur?: number }
}

/**
 * Legacy redirect helper. Amount is intentionally NOT put in the URL
 * to prevent price manipulation via query params.
 * Prefer createPayboxSession (POST) which returns a signed URL from the server.
 */
export function openPayboxCheckout(opts: {
  orderId: string
  returnUrl?: string
  packId?: PackId
  buyerAddress?: string
}): boolean {
  const base = getPayboxPaymentUrl()
  if (!base) return false
  try {
    const url = new URL(base)
    url.searchParams.set('orderId', opts.orderId)
    // amount deliberately omitted — server must resolve from pack_id / order
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
 * Démarre Paybox : session API (server price) → URL env → paper.
 */
export async function startPayboxCardPayment(opts: {
  packId: PackId
  buyerAddress: string
  /** Display-only; ignored by payment path */
  amountEur?: number
}): Promise<'redirect' | 'payment_link' | 'paper'> {
  const orderId = `xa-${opts.packId}-${Date.now().toString(36)}`

  const api = getAccessApiBase()
  if (api) {
    try {
      const session = await createPayboxSession({
        pack_id: opts.packId,
        buyer_address: opts.buyerAddress,
        success_url: buildPackSuccessUrl(opts.packId),
      })
      if (session.url) {
        window.location.href = session.url
        return 'redirect'
      }
      // stub may return order_id without url — still considered initiated
      if (session.order_id) {
        // fall through to env URL if present, else paper
      }
    } catch {
      /* fallback URL env */
    }
  }

  if (getPayboxPaymentUrl()) {
    const ok = openPayboxCheckout({
      orderId,
      returnUrl: buildPackSuccessUrl(opts.packId),
      packId: opts.packId,
      buyerAddress: opts.buyerAddress,
    })
    if (ok) return 'payment_link'
  }

  return 'paper'
}
