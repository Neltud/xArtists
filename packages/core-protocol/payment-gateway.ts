/** Unified Payment Gateway — orchestration MoonPay / Stripe / Relayer (stubs). */

import type { PaymentIntent, TransactionReceipt } from './types'

export type PaymentRail = 'moonpay' | 'stripe' | 'relayer_gasless' | 'paper'

export interface PaymentRouteResult {
  rail: PaymentRail
  next: 'redirect' | 'session' | 'paper'
  detail: string
}

export function routePayment(intent: PaymentIntent): PaymentRouteResult {
  if (intent.target_chain === 'MULTIVERSX' && intent.target_asset.toUpperCase().includes('EGLD')) {
    return {
      rail: 'moonpay',
      next: 'redirect',
      detail: 'On-ramp EGLD via MoonPay (Apple/Google Pay/card)',
    }
  }
  if (intent.currency_fiat === 'EUR' || intent.currency_fiat === 'USD') {
    return {
      rail: 'stripe',
      next: 'session',
      detail: 'Fiat pack / service via Stripe Checkout',
    }
  }
  return { rail: 'paper', next: 'paper', detail: 'No live rail — paper only' }
}

export function paperReceipt(intent: PaymentIntent): TransactionReceipt {
  return {
    tx_hash: `paper_${Date.now()}`,
    status: 'PENDING',
    chain: intent.target_chain === 'MULTIVERSX' ? 'multiversx' : 'ethereum',
    gas_spent_by_relayer: '0',
    final_atomic_amount: '0',
    lifecycle: 'CREATED',
  }
}
