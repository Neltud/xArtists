/**
 * Access-API payment session adapter — amounts never sent from client catalog override.
 * Fail-closed when API returns 501 / no URL (Paybox/Stripe not fully wired).
 */

import type { IPaymentSession, PaymentSessionRequest, PaymentSessionResult } from '../application/adapters'
import { getAccessApiBase } from '../lib/stripe'

export class AccessApiPaymentSession implements IPaymentSession {
  constructor(
    private readonly provider: 'stripe' | 'paybox' = 'stripe',
  ) {}

  async createSession(req: PaymentSessionRequest): Promise<PaymentSessionResult> {
    const api = getAccessApiBase()
    if (!api) {
      return { ok: false, error: 'access_api_not_configured' }
    }

    if (this.provider === 'paybox') {
      const enabled = import.meta.env.VITE_PAYBOX_ENABLED === 'true'
      if (!enabled) {
        return { ok: false, error: 'paybox_disabled', httpStatus: 501 }
      }
    }

    const path =
      this.provider === 'paybox' ? '/v1/checkout/paybox' : '/v1/checkout/session'

    try {
      const r = await fetch(`${api}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // pack_id + buyer only — never amount_cents / amountEur from client
        body: JSON.stringify({
          pack_id: req.packId,
          buyer_address: req.buyerAddress,
          provider: this.provider,
          currency: 'eur',
        }),
      })

      if (!r.ok) {
        const text = await r.text().catch(() => '')
        return {
          ok: false,
          error: text.slice(0, 200) || `http_${r.status}`,
          httpStatus: r.status,
        }
      }

      const data = (await r.json()) as {
        url?: string
        id?: string
        order_id?: string
        ok?: boolean
        error?: string
      }

      if (!data.url) {
        return {
          ok: false,
          error: data.error || 'session_url_missing',
          httpStatus: r.status,
        }
      }

      return {
        ok: true,
        url: data.url,
        sessionId: data.id || data.order_id || 'unknown',
      }
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      }
    }
  }
}
