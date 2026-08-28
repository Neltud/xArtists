import { Link } from 'react-router-dom'
import { isStripeConfigured, getAccessApiBase } from '../lib/stripe'

/** Status strip for Stripe card payments (packs). */
export default function StripeCardBanner() {
  const ok = isStripeConfigured()
  const api = Boolean(getAccessApiBase())

  return (
    <div
      className={`rounded-xl border px-3 py-2 text-[11px] mb-4 ${
        ok
          ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-100'
          : 'border-zinc-700 bg-zinc-900/50 text-zinc-400'
      }`}
    >
      <strong className="text-white">Stripe · cartes</strong>
      {ok
        ? api
          ? ' — Checkout Session API branchée (packs Pulse / Yield / Sentinel).'
          : ' — Payment Links env — brancher API pour mint auto post-paiement.'
        : ' — non configuré : intent paper uniquement.'}{' '}
      <Link to="/my-packs" className="underline text-indigo-200">
        My Packs
      </Link>
    </div>
  )
}
