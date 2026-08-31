import { useState, useEffect } from 'react'
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

/** Checkout Model C — un pack à la fois, pas de 2e grille de 3. */
export default function PackCheckout({
  packId: forcedId = null,
  onClear,
}: {
  packId?: PackId | null
  onClear?: () => void
} = {}) {
  const { connected, address } = useWallet()
  const [selected, setSelected] = useState<PackId | null>(forcedId)
  useEffect(() => {
    if (forcedId) setSelected(forcedId)
  }, [forcedId])
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
      setMsg('Connecte ton wallet MultiversX (erd1…) avant checkout.')
      setSelected(id)
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
      if (mode === 'redirect') return
      if (mode === 'payment_link') {
        setMsg(`Lien Stripe ouvert pour ${pack.name} (${pack.priceEur.list} €).`)
        setStatus('done')
        return
      }
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
        `Conditions OK — ${pack.name}. Mode paper / Stripe non branché : intention enregistrée localement.`
      )
      setStatus('done')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erreur checkout')
      setStatus('idle')
    }
  }

  return (
    <div className="card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-white">Paiement</h2>
        <span
          className={`text-[10px] uppercase px-2 py-0.5 rounded-full border ${
            stripeOk
              ? 'border-emerald-500/40 text-emerald-300'
              : 'border-amber-500/40 text-amber-200'
          }`}
        >
          {hasApi ? 'API Stripe' : stripeOk ? 'Payment Link' : 'Paper'}
        </span>
      </div>
      <p className="text-[11px] text-zinc-500">
        Un pack choisi → Stripe → NFT d’accès vers ton erd1.
        {pk ? ' · pk ok' : ''}
      </p>

      {selected && pack ? (
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/5 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-white">
              {pack.icon} {pack.name}
            </p>
            <p className="text-[11px] text-zinc-500">
              {pack.priceEur.list} € · Stripe · NFT d’accès
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary text-xs py-2 px-3"
              onClick={() => startBuy(pack.id)}
            >
              Payer
            </button>
            {onClear && (
              <button type="button" className="btn-secondary text-xs py-2 px-3" onClick={onClear}>
                Annuler
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-zinc-500" htmlFor="pack-select">
            Pack
          </label>
          <select
            id="pack-select"
            className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
            defaultValue=""
            onChange={e => {
              const v = e.target.value as PackId
              if (v) startBuy(v)
            }}
          >
            <option value="" disabled>
              Choisir…
            </option>
            {AGENT_PACKS.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.priceEur.list} €
              </option>
            ))}
          </select>
        </div>
      )}

      {msg && (
        <p className="text-xs text-amber-100/90 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          {msg}
        </p>
      )}

      {status === 'done' && (
        <Link to="/my-packs" className="btn-secondary text-xs py-2 px-3 inline-block">
          Voir My Packs →
        </Link>
      )}

      {!connected && (
        <p className="text-[11px] text-zinc-500">Connecte un wallet pour payer.</p>
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
