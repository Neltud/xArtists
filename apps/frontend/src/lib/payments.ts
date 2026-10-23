/**
 * Orchestrateur checkout packs — Stripe + Paybox + paper.
 * MoonPay = on-ramp EGLD (voir lib/moonpay.ts), pas un moyen de payer le pack fiat direct.
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
} from './paybox'
import { isMoonPayConfigured, moonpayStatusHint, openMoonPayBuy } from './moonpay'

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
      return 'Paybox (API)'
    default:
      return 'Paper (démo)'
  }
}

export type PackPaymentResult = 'redirect' | 'payment_link' | 'paper' | 'unavailable' | 'refused'

export async function startPackPayment(opts: {
  method: PayMethod
  packId: PackId
  buyerAddress: string
  amountEur: number
}): Promise<PackPaymentResult> {
  if (opts.method === 'stripe') {
    return startStripeCardPayment({
      packId: opts.packId,
      buyerAddress: opts.buyerAddress,
    })
  }
  if (opts.method === 'paybox') {
    try {
      const r = await startPayboxCardPayment({
        packId: opts.packId,
        buyerAddress: opts.buyerAddress,
        amountEur: opts.amountEur,
      })
      return r
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('paybox_refused')) return 'refused'
      if (msg.includes('paybox_unavailable') || msg.includes('501')) return 'unavailable'
      throw e
    }
  }
  return 'paper'
}

export function stripeStatusHint(): string {
  if (getAccessApiBase()) return 'API'
  if (getStripePaymentLink('pulse')) return 'Links'
  return 'off'
}

export function payboxStatusHint(): string {
  return isPayboxConfigured() ? 'API' : 'off'
}

/** Recharge EGLD puis user paie on-chain (stake, market, etc.). */
export async function startMoonPayEgld(opts: {
  buyerAddress?: string
  amountEur?: number
}): Promise<{ ok: boolean; error?: string }> {
  if (!isMoonPayConfigured()) {
    return { ok: false, error: 'MoonPay off — VITE_MOONPAY_API_KEY' }
  }
  return openMoonPayBuy({
    walletAddress: opts.buyerAddress,
    baseCurrencyAmount: opts.amountEur ?? 50,
    baseCurrencyCode: 'eur',
    currencyCode: 'egld',
  })
}

export { isMoonPayConfigured, moonpayStatusHint }
