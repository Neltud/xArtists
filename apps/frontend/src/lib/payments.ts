/**
 * Orchestrateur checkout packs — Stripe + Paybox + paper.
 * Fail-closed: Stripe without server session = unavailable.
 */

import type { PackId } from '../config/agentPacks'
import {
  startStripeCardPayment,
  isStripeConfigured,
  getAccessApiBase,
  getStripePaymentLink,
} from './stripe'
import { startPayboxCardPayment, isPayboxConfigured } from './paybox'
import { ensureAccessToken, getAccessToken } from './accessSession'
import { isMoonPayConfigured, openMoonPayBuy, moonpayStatusHint } from './moonpay'

export type PayMethod = 'stripe' | 'paybox' | 'paper'

export function availablePayMethods(): PayMethod[] {
  const m: PayMethod[] = []
  if (isStripeConfigured()) m.push('stripe')
  if (isPayboxConfigured()) m.push('paybox')
  m.push('paper')
  return m
}

export function preferredPayMethod(): PayMethod {
  const m = availablePayMethods()
  if (m.includes('paybox')) return 'paybox'
  if (m.includes('stripe')) return 'stripe'
  return 'paper'
}

export function payMethodLabel(m: PayMethod): string {
  switch (m) {
    case 'stripe':
      return 'Stripe (API)'
    case 'paybox':
      return 'Paybox (API)'
    default:
      return 'Paper (demo)'
  }
}

export type PackPaymentResult =
  | 'redirect'
  | 'payment_link'
  | 'paper'
  | 'unavailable'
  | 'refused'
  | 'auth_required'

export async function startPackPayment(opts: {
  method: PayMethod
  packId: PackId
  buyerAddress: string
  amountEur: number
  accessToken?: string
}): Promise<PackPaymentResult> {
  if (opts.method === 'stripe') {
    return startStripeCardPayment({
      packId: opts.packId,
      buyerAddress: opts.buyerAddress,
    })
  }
  if (opts.method === 'paybox') {
    const isWallet = /^erd1[a-z0-9]{58}$/i.test(opts.buyerAddress)
    if (!isWallet) return 'auth_required'

    let token = opts.accessToken || getAccessToken(opts.buyerAddress)
    if (!token) {
      token = (await ensureAccessToken({ address: opts.buyerAddress })) || undefined
    }
    if (!token) return 'auth_required'

    try {
      const r = await startPayboxCardPayment({
        packId: opts.packId,
        buyerAddress: opts.buyerAddress,
        amountEur: opts.amountEur,
        accessToken: token,
      })
      if (r === 'auth_required') return 'auth_required'
      return r
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('paybox_auth')) return 'auth_required'
      if (msg.includes('paybox_refused')) return 'refused'
      if (msg.includes('paybox_unavailable') || msg.includes('501')) return 'unavailable'
      throw e
    }
  }
  return 'paper'
}

export function stripeStatusHint(): string {
  if (getAccessApiBase()) return 'API'
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
