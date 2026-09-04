/**
 * Orchestrateur checkout packs — Stripe (1) + Paybox (3).
 * Secrets jamais en front.
 */

import type { PackId } from '../config/agentPacks'
import {
  startStripeCardPayment,
  isStripeConfigured,
  getAccessApiBase,
  getStripePaymentLink,
} from './stripe'
import {
  startPayboxCardPayment,
  isPayboxConfigured,
  getPayboxPaymentUrl,
} from './paybox'

export type PayMethod = 'stripe' | 'paybox' | 'paper'

export function availablePayMethods(): PayMethod[] {
  const m: PayMethod[] = []
  if (isStripeConfigured()) m.push('stripe')
  if (isPayboxConfigured()) m.push('paybox')
  if (!m.length) m.push('paper')
  return m
}

export function defaultPayMethod(): PayMethod {
  const m = availablePayMethods()
  if (m.includes('stripe')) return 'stripe'
  if (m.includes('paybox')) return 'paybox'
  return 'paper'
}

export function payMethodLabel(m: PayMethod): string {
  switch (m) {
    case 'stripe':
      return getAccessApiBase() ? 'Stripe (API)' : 'Stripe (Payment Link)'
    case 'paybox':
      return getAccessApiBase() && !getPayboxPaymentUrl()
        ? 'Paybox (API)'
        : 'Paybox / e-Transactions'
    default:
      return 'Paper (démo)'
  }
}

export async function startPackPayment(opts: {
  method: PayMethod
  packId: PackId
  buyerAddress: string
  amountEur: number
}): Promise<'redirect' | 'payment_link' | 'paper'> {
  if (opts.method === 'stripe') {
    return startStripeCardPayment({
      packId: opts.packId,
      buyerAddress: opts.buyerAddress,
    })
  }
  if (opts.method === 'paybox') {
    return startPayboxCardPayment({
      packId: opts.packId,
      buyerAddress: opts.buyerAddress,
      amountEur: opts.amountEur,
    })
  }
  return 'paper'
}

export function stripeStatusHint(): string {
  if (getAccessApiBase()) return 'API'
  if (getStripePaymentLink('pulse')) return 'Links'
  return 'off'
}

export function payboxStatusHint(): string {
  if (getAccessApiBase()) return 'API'
  if (getPayboxPaymentUrl()) return 'URL'
  return 'off'
}
