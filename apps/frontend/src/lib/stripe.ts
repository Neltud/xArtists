/**
 * Stripe card payments (Access Packs Model C).
 * Secret key NEVER in frontend — only publishable key + backend session URL.
 *
 * Flow:
 * 1) Preferred: POST {VITE_ACCESS_API_BASE}/v1/checkout/session → redirect to session.url
 * 2) Fallback: VITE_STRIPE_PAYMENT_LINK_{PACK} Payment Links (Dashboard)
 * 3) Else: local paper intent
 */

import type { PackId } from '../config/agentPacks'

export type StripeCheckoutSessionRequest = {
  pack_id: PackId
  buyer_address: string
  success_url?: string
  cancel_url?: string
  currency?: 'eur' | 'usd'
}

export type StripeCheckoutSessionResponse = {
  id?: string
  url?: string
  status?: string
}

export function getAccessApiBase(): string {
  return ((import.meta.env.VITE_ACCESS_API_BASE as string | undefined) || '').replace(/\/$/, '')
}

export function getStripePublishableKey(): string | undefined {
  const k = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined
  return k?.trim() || undefined
}

export function isStripeConfigured(): boolean {
  return Boolean(getAccessApiBase() || getStripePaymentLink('pulse'))
}

/** Optional per-pack Payment Links from Stripe Dashboard */
export function getStripePaymentLink(packId: PackId): string | undefined {
  const map: Record<PackId, string | undefined> = {
    pulse: import.meta.env.VITE_STRIPE_PAYMENT_LINK_PULSE as string | undefined,
    yield: import.meta.env.VITE_STRIPE_PAYMENT_LINK_YIELD as string | undefined,
    sentinel: import.meta.env.VITE_STRIPE_PAYMENT_LINK_SENTINEL as string | undefined,
  }
  const url = map[packId]?.trim()
  return url || undefined
}

export function buildPackSuccessUrl(packId?: PackId, origin = window.location.origin): string {
  const base = import.meta.env.BASE_URL || '/'
  const q = new URLSearchParams({ paid: '1' })
  if (packId) q.set('pack', packId)
  return `${origin}${base}#/my-packs?${q.toString()}`
}

export function buildPackCancelUrl(origin = window.location.origin): string {
  const base = import.meta.env.BASE_URL || '/'
  return `${origin}${base}#/my-packs?cancelled=1`
}

/** Create Checkout Session via backend; returns hosted URL. */
export async function createStripeCheckoutSession(
  body: StripeCheckoutSessionRequest
): Promise<StripeCheckoutSessionResponse> {
  const api = getAccessApiBase()
  if (!api) throw new Error('VITE_ACCESS_API_BASE manquant')

  const payload = {
    ...body,
    success_url: body.success_url || buildPackSuccessUrl(body.pack_id),
    cancel_url: body.cancel_url || buildPackCancelUrl(),
    currency: body.currency || 'eur',
    provider: 'stripe',
    mode: 'payment',
  }

  const r = await fetch(`${api}/v1/checkout/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!r.ok) {
    const text = await r.text().catch(() => '')
    throw new Error(`Stripe session HTTP ${r.status}${text ? `: ${text.slice(0, 120)}` : ''}`)
  }
  return (await r.json()) as StripeCheckoutSessionResponse
}

/**
 * Démarre Stripe : session API → Payment Link → paper.
 */
export async function startStripeCardPayment(opts: {
  packId: PackId
  buyerAddress: string
}): Promise<'redirect' | 'payment_link' | 'paper'> {
  const api = getAccessApiBase()
  if (api) {
    try {
      const session = await createStripeCheckoutSession({
        pack_id: opts.packId,
        buyer_address: opts.buyerAddress,
        success_url: buildPackSuccessUrl(opts.packId),
      })
      if (session.url) {
        window.location.href = session.url
        return 'redirect'
      }
    } catch {
      /* fallback link */
    }
  }

  const link = getStripePaymentLink(opts.packId)
  if (link) {
    try {
      const u = new URL(link)
      // Client-side only hint; Stripe Links ignore unknown params sometimes — intent in localStorage is source of truth
      u.searchParams.set('client_reference_id', opts.buyerAddress)
      window.location.href = u.toString()
    } catch {
      window.location.href = link
    }
    return 'payment_link'
  }

  return 'paper'
}
