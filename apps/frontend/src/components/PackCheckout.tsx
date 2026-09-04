/**
 * Checkout packs — Stripe + Paybox + paper.
 * Uniquement Pulse · Yield · Sentinel.
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { useWallet } from '../context/WalletContext'
import AccessTermsModal from './AccessTermsModal'
import { canBuyAgent } from '../config/scStatus'
import {
  availablePayMethods,
  defaultPayMethod,
  payMethodLabel,
  startPackPayment,
  stripeStatusHint,
  payboxStatusHint,
  type PayMethod,
} from '../lib/payments'

const ONLY: PackId[] = ['pulse', 'yield', 'sentinel']
const PACKS = AGENT_PACKS.filter(p => ONLY.includes(p.id)).slice(0, 3)

function savePaperIntent(payload: Record<string, unknown>) {
  try {
    localStorage.setItem('xartists_access_checkout_intent', JSON.stringify(payload))
  } catch {
    /* ignore */
  }
}

export default function PackCheckout({
  packId: forcedId = null,
  onClear,
}: {
  packId?: PackId | null
  onClear?: () => void
} = {}) {
  const { connected, address } = useWallet()
  const methods = availablePayMethods()
  const [method, setMethod] = useState<PayMethod>(() => defaultPayMethod())
  const [selected, setSelected] = useState<PackId | null>(
    forcedId && ONLY.includes(forcedId) ? forcedId : null
  )
  useEffect(() => {
    if (forcedId && ONLY.includes(forcedId)) setSelected(forcedId)
    else if (forcedId === null) setSelected(null)
  }, [forcedId])

  const [termsOpen, setTermsOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'terms' | 'redirect' | 'done'>('idle')
  const [msg, setMsg] = useState('')

  const pack = PACKS.find(p => p.id === selected)
  const mintLive = canBuyAgent()

  const startBuy = (id: PackId) => {
    if (!ONLY.includes(id)) return
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
    setMsg(
      method === 'stripe'
        ? 'Ouverture Stripe…'
        : method === 'paybox'
          ? 'Ouverture Paybox…'
          : 'Enregistrement paper…'
    )
    try {
      const mode = await startPackPayment({
        method,
        packId: pack.id,
        buyerAddress: address,
        amountEur: pack.priceEur.list,
      })
      if (mode === 'redirect') return
      if (mode === 'payment_link') {
        setMsg(
          method === 'paybox'
            ? `Paybox ouvert pour ${pack.name} (${pack.priceEur.list} €).`
            : `Lien Stripe ouvert pour ${pack.name} (${pack.priceEur.list} €).`
        )
        setStatus('done')
        savePaperIntent({
          product: 'access_pack',
          model: 'C',
          provider: method,
          pack_id: pack.id,
          price_eur: pack.priceEur.list,
          buyer_address: address,
          paper_only: false,
          pending_provider: true,
          mint_sc_live: mintLive,
          ts: new Date().toISOString(),
        })
        return
      }
      // paper
      savePaperIntent({
        product: 'access_pack',
        model: 'C',
        provider: 'paper',
        pack_id: pack.id,
        price_eur: pack.priceEur.list,
        buyer_address: address,
        paper_only: true,
        mint_sc_live: mintLive,
        ts: new Date().toISOString(),
      })
      setMsg(
        `Conditions OK — ${pack.name}. Mode paper : intention enregistrée (carte non configurée).`
      )
      setStatus('done')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erreur checkout')
      setStatus('idle')
    }
  }

  const badge =
    method === 'stripe'
      ? stripeStatusHint() === 'off'
        ? 'Paper'
        : `Stripe · ${stripeStatusHint()}`
      : method === 'paybox'
        ? payboxStatusHint() === 'off'
          ? 'Paper'
          : `Paybox · ${payboxStatusHint()}`
        : 'Paper'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-white">Paiement</h2>
        <span
          className={`text-[10px] uppercase px-2 py-0.5 rounded-full border ${
            method === 'paper'
              ? 'border-amber-500/40 text-amber-200'
              : 'border-emerald-500/40 text-emerald-300'
          }`}
        >
          {badge}
        </span>
      </div>

      {/* Méthode : Stripe · Paybox · Paper */}
      <div className="flex flex-wrap gap-1.5">
        {methods.map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium border transition-colors ${
              method === m
                ? 'border-white/30 bg-white/10 text-white'
                : 'border-white/10 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {payMethodLabel(m)}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-zinc-600 leading-relaxed">
        {method === 'stripe' &&
          'Carte via Stripe Checkout / Payment Link — clé secrète côté serveur uniquement.'}
        {method === 'paybox' &&
          'Carte FR via Paybox e-Transactions — signature serveur, redirection TPE.'}
        {method === 'paper' &&
          'Démo : aucune carte. Configure VITE_ACCESS_API_BASE ou Payment Links / Paybox URL.'}
      </p>

      {selected && pack ? (
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/5 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-white">
              {pack.icon} {pack.name}
            </p>
            <p className="text-[11px] text-zinc-500">
              {pack.priceEur.list} € · {payMethodLabel(method)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary text-xs py-2 px-3"
              onClick={() => startBuy(pack.id)}
            >
              {method === 'paper' ? 'Enregistrer' : 'Payer'}
            </button>
            {onClear && (
              <button type="button" className="btn-secondary text-xs py-2 px-3" onClick={onClear}>
                Annuler
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-[12px] text-zinc-500">
          Sélectionnez <strong className="text-zinc-400">Pulse</strong>,{' '}
          <strong className="text-zinc-400">Yield</strong> ou{' '}
          <strong className="text-zinc-400">Sentinel</strong> ci-dessus.
        </p>
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
