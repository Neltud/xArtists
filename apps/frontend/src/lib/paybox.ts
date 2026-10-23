/**
 * Paybox System — carte FR (hosted redirect, secrets serveur uniquement).
 * amount NEVER trusted from client. Browser return never confirms payment.
 */

import type { PackId } from '../config/agentPacks'
import { getAccessApiBase, buildPackSuccessUrl, buildPackCancelUrl } from './stripe'

export type PayboxSessionRequest = {
  pack_id: PackId
  buyer_address: string
  success_url?: string
  cancel_url?: string
  artist_beneficiary?: string
}

export type PayboxOrderStatus =
  | 'created' | 'redirected' | 'paid' | 'refused' | 'cancelled' | 'error' | 'late_paid' | 'unavailable'

export type PayboxSessionResponse = {
  ok?: boolean
  url?: string
  order_id?: string
  amount_cents?: number
  amount_eur?: number
  status?: string
  delivery?: string
  error?: string
  message?: string
}

export function isPayboxConfigured(): boolean {
  return Boolean(getAccessApiBase()) && import.meta.env.VITE_PAYBOX_ENABLED === 'true'
}

export async function createPayboxSession(body: PayboxSessionRequest): Promise<PayboxSessionResponse> {
  const api = getAccessApiBase()
  if (!api) throw new Error('VITE_ACCESS_API_BASE manquant pour Paybox API')
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
      artist_beneficiary: body.artist_beneficiary,
    }),
  })
  const text = await r.text().catch(() => '')
  let data: PayboxSessionResponse = {}
  try { data = text ? (JSON.parse(text) as PayboxSessionResponse) : {} } catch { data = { error: text.slice(0, 120) } }
  if (!r.ok) {
    const code = data.error || `HTTP_${r.status}`
    if (r.status === 501) throw new Error(`paybox_unavailable:${code}`)
    throw new Error(`paybox_refused:${code}${data.message ? `:${data.message.slice(0, 80)}` : ''}`)
  }
  return data
}

export async function startPayboxCardPayment(opts: {
  packId: PackId
  buyerAddress: string
  amountEur?: number
  artistBeneficiary?: string
}): Promise<'redirect' | 'paper' | 'unavailable'> {
  const api = getAccessApiBase()
  if (!api || import.meta.env.VITE_PAYBOX_ENABLED !== 'true') return 'unavailable'
  try {
    const session = await createPayboxSession({
      pack_id: opts.packId,
      buyer_address: opts.buyerAddress,
      success_url: buildPackSuccessUrl(opts.packId),
      artist_beneficiary: opts.artistBeneficiary,
    })
    if (session.order_id) {
      try {
        sessionStorage.setItem(
          'xartists_paybox_pending',
          JSON.stringify({ order_id: session.order_id, pack_id: opts.packId, ts: Date.now() })
        )
      } catch { /* */ }
    }
    if (session.url) {
      window.location.href = session.url
      return 'redirect'
    }
    return 'unavailable'
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('paybox_unavailable') || msg.includes('501')) return 'unavailable'
    throw e
  }
}

/** Poll server order status — browser ?paid= alone never confirms. */
export async function fetchPayboxOrderStatus(
  orderId: string,
  buyerAddress?: string
): Promise<{ status: PayboxOrderStatus; server_confirmed: boolean; pack_id?: string }> {
  const api = getAccessApiBase()
  if (!api) return { status: 'unavailable', server_confirmed: false }
  const q = buyerAddress ? `?buyer=${encodeURIComponent(buyerAddress)}` : ''
  const r = await fetch(`${api}/v1/checkout/paybox/order/${encodeURIComponent(orderId)}${q}`)
  if (!r.ok) return { status: 'error', server_confirmed: false }
  const data = (await r.json()) as { status?: PayboxOrderStatus; server_confirmed?: boolean; pack_id?: string }
  return {
    status: (data.status as PayboxOrderStatus) || 'error',
    server_confirmed: Boolean(data.server_confirmed),
    pack_id: data.pack_id,
  }
}
