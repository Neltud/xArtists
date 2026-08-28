import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { useWallet } from '../context/WalletContext'
import AccessTermsModal from './AccessTermsModal'
import { canBuyAgent } from '../config/scStatus'
import {
  startStripeCardPayment,
  isStripeConfigured,
  getAccessApiBase,
  getStripePublishableKey,
} from '../lib/stripe'

/**
 * Access Pack checkout — Model C.
 * Cards: Stripe Checkout Session (API) or Payment Link env fallback.
 */
export default function PackCheckout() {
  const { connected, address } = useWallet()
  const [selected, setSelected] = useState<PackId | null>(null)
  const [termsOpen, setTermsOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'terms' | 'redirect' | 'done'>('idle')
  const [msg, setMsg] = useState('')

  const pack = AGENT_PACKS.find(p => p.id === selected)
  const mintLive = canBuyAgent()
  const stripeOk = isStripeConfigured()
  const hasApi = Boolean(getAccessApiBase())
  const pk = getStripePublishableKey()

  const startBuy = (id: PackId) => {
    if (!connected || !address?.startsWith('erd1')) {
      setMsg('Connecte ton wallet MultiversX (erd1…) avant checkout — le NFT part vers cette adresse.')
      return
    }
    setSelected(id)
    setTermsOpen(true)
    setStatus('terms')
    setMsg('')
  }

  const onAcceptTerms = async () => {
    setTermsOpen(false)
    if (!pack || !address) return
    setStatus('redirect')
    setMsg('Ouverture Stripe…')

    try {
      const mode = await startStripeCardPayment({
        packId: pack.id,
        buyerAddress: address,
      })

      if (mode === 'redirect') {
        return
      }

      if (mode === 'payment_link') {
        setMsg(
          `Lien Stripe ouvert pour ${pack.name} (${pack.priceEur.list} €). ` +
            'Après paiement, le webhook serveur déclenche le mint (si API configurée).'
        )
        setStatus('done')
        return
      }

      // paper
      const intent = {
        product: 'access_pack',
        model: 'C',
        provider: 'stripe_pending',
        pack_id: pack.id,
        price_eur: pack.priceEur.list,
        buyer_address: address,
        paper_only: true,
        mint_sc_live: mintLive,
        ts: new Date().toISOString(),
      }
      try {
        localStorage.setItem('xartists_access_checkout_intent', JSON.stringify(intent))
      } catch {
        /* ignore */
      }
      setMsg(
        `Conditions acceptées. Intent paper pour ${pack.name} (${pack.priceEur.list} €). ` +
          'Configure VITE_ACCESS_API_BASE (Checkout Session) ou VITE_STRIPE_PAYMENT_LINK_* pour payer par carte.'
      )
      setStatus('done')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Checkout Stripe échoué')
      setStatus('idle')
    }
  }

  return (
    <div className="card border-purple-500/20">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
        <h3 className="font-bold text-sm">Checkout packs · Stripe (carte)</h3>
        <span
          className={`text-[10px] uppercase px-2 py-0.5 rounded-full border ${
            stripeOk
              ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
              : 'border-amber-500/40 text-amber-200 bg-amber-500/10'
          }`}
        >
          {hasApi ? 'API Stripe' : stripeOk ? 'Payment Link' : 'Paper'}
        </span>
      </div>
      <p className="text-[11px] text-zinc-500 mb-4">
        Carte bancaire via <strong className="text-zinc-300">Stripe Checkout</strong> → mint NFT pack vers ton
        erd1 après webhook. On-ramp crypto (EGLD) reste MoonPay (Apple/Google Pay).
        {pk && <span className="text-zinc-600"> · pk configurée</span>}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        {AGENT_PACKS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => startBuy(p.id)}
            className={`rounded-xl border px-3 py-3 text-left transition-colors ${
              selected === p.id
                ? 'border-cyan-400/50 bg-cyan-500/10'
                : 'border-white/10 bg-white/5 hover:border-purple-400/40'
            }`}
          >
            <span className="text-lg">{p.icon}</span>
            <p className="text-xs font-bold text-white mt-1">{p.name}</p>
            <p className="text-[10px] text-zinc-500">{p.priceEur.list} € · carte Stripe</p>
          </button>
        ))}
      </div>

      {msg && (
        <p className="text-xs text-amber-100/90 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 mb-3">
          {msg}
        </p>
      )}

      {status === 'done' && (
        <Link to="/my-packs" className="btn-secondary text-xs py-2 px-3 inline-block mb-2">
          Voir My Packs →
        </Link>
      )}

      {!connected && (
        <p className="text-[11px] text-zinc-500">Connecte un wallet pour démarrer le checkout carte.</p>
      )}

      <AccessTermsModal
        open={termsOpen}
        packName={pack?.name || ''}
        onClose={() => {
          setTermsOpen(false)
          setStatus('idle')
        }}
        onAccept={onAcceptTerms}
      />
    </div>
  )
}
