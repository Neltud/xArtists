/**
 * Paybox / e-Transactions — carte FR (hosted redirect, secrets serveur uniquement).
 *
 * SECURITY: amount is NEVER trusted from the client or the URL.
 * Only POST /v1/checkout/paybox may start a payment. The server looks up
 * price_cents from the catalog (Pulse 110€, Yield 75€, Sentinel 50€).
 */

import type { PackId } from '../config/agentPacks'
import { getAccessApiBase, buildPackSuccessUrl, buildPackCancelUrl } from './stripe'

export type PayboxSessionRequest = {
  pack_id: PackId
  buyer_address: string
  success_url?: string
  cancel_url?: string
}

export function isPayboxConfigured(): boolean {
  // Explicit opt-in: the API currently has no signed Paybox session or verified IPN.
  return Boolean(getAccessApiBase()) && import.meta.env.VITE_PAYBOX_ENABLED === 'true'
}

export async function createPayboxSession(
  body: PayboxSessionRequest
): Promise<{ url?: string; order_id?: string; amount_cents?: number; amount_eur?: number }> {
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
    }),
  })
  if (!r.ok) {
    const text = await r.text().catch(() => '')
    throw new Error(`Paybox session HTTP ${r.status}${text ? `: ${text.slice(0, 120)}` : ''}`)
  }
  return (await r.json()) as { url?: string; order_id?: string; amount_cents?: number; amount_eur?: number }
}

/**
 * Démarre Paybox uniquement via session serveur.
 * Pas de redirect GET avec montant — un lien direct ne peut pas fixer le prix.
 */
export async function startPayboxCardPayment(opts: {
  packId: PackId
  buyerAddress: string
  /** Display-only; never sent */
  amountEur?: number
}): Promise<'redirect' | 'paper'> {
  const api = getAccessApiBase()
  if (!api) return 'paper'

  const session = await createPayboxSession({
    pack_id: opts.packId,
    buyer_address: opts.buyerAddress,
    success_url: buildPackSuccessUrl(opts.packId),
  })
  if (session.url) {
    window.location.href = session.url
    return 'redirect'
  }
  return 'paper'
}
