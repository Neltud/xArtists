/**
 * Checkout packs — deux rails clairs :
 * 1) Crypto direct (EGLD / $TRO) via xPortal
 * 2) Fiat on-ramp (carte / SEPA EUR-RON) → gateway régulé (Stripe / Paybox / FC)
 *    puis mint pack on-chain après webhook (ops Access API)
 *
 * LIA n’est PAS dans ce flux : agent analytique + paper uniquement.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getPack, type PackId } from '../config/agentPacks'
import { useWallet } from '../context/WalletContext'
import { canBuyAgent } from '../config/scStatus'
import { requestOpenConnect } from '../lib/walletEvents'
import {
  availablePayMethods,
  defaultPayMethod,
  startPackPayment,
  startMoonPayEgld,
  isMoonPayConfigured,
  type PayMethod,
} from '../lib/payments'
import AccessTermsModal from './AccessTermsModal'

export type CheckoutRail = 'crypto' | 'fiat' | null

type Props = {
  open: boolean
  packId: PackId
  onClose: () => void
  /** Called when fiat redirect starts or crypto TX is initiated */
  onStarted?: (rail: 'crypto' | 'fiat') => void
  /** Device preview only — never claim purchase */
  onPreview?: (id: PackId) => void
}

function saveIntent(payload: Record<string, unknown>) {
  try {
    localStorage.setItem(
      'xartists_access_checkout_intent',
      JSON.stringify({ ...payload, ts: Date.now() }),
    )
  } catch {
    /* */
  }
}

export default function CheckoutModal({ open, packId, onClose, onStarted, onPreview }: Props) {
  const pack = getPack(packId)
  const { connected, address } = useWallet()
  const [rail, setRail] = useState<CheckoutRail>(null)
  const [fiatMethod, setFiatMethod] = useState<PayMethod>(() => defaultPayMethod())
  const [termsOpen, setTermsOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const methods = availablePayMethods().filter(m => m !== 'paper')
  const hasFiat = methods.length > 0
  const mintLive = canBuyAgent()

  if (!open || !pack) return null

  const needWallet = () => {
    if (!connected || !address?.startsWith('erd1')) {
      setMsg('Connecte xPortal (erd1) pour continuer.')
      requestOpenConnect()
      return false
    }
    return true
  }

  const launchFiat = async () => {
    if (!needWallet() || !address) return
    if (!hasFiat) {
      setMsg('Rail fiat non configuré (Stripe / Paybox / Access API).')
      return
    }
    const method = methods.includes(fiatMethod) ? fiatMethod : methods[0]
    setBusy(true)
    setMsg(method === 'stripe' ? 'Redirection Stripe…' : 'Redirection Paybox / e-Transactions…')
    saveIntent({
      packId: pack.id,
      provider: method,
      amount: pack.priceEur.list,
      currency: 'EUR',
      address,
      kind: 'fiat_checkout',
      rail: 'fiat',
      note: 'Mint on-chain après webhook Access API — pas LIA broker',
    })
    try {
      await startPackPayment({
        method,
        packId: pack.id,
        buyerAddress: address,
        amountEur: pack.priceEur.list,
      })
      onStarted?.('fiat')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const launchCrypto = async () => {
    if (!needWallet() || !address) return
    setBusy(true)
    saveIntent({
      packId: pack.id,
      provider: 'xportal_crypto',
      amountEgld: pack.priceEgld.list,
      address,
      kind: 'crypto_checkout',
      rail: 'crypto',
    })
    if (!mintLive) {
      setMsg(
        `Mint pack on-chain bientôt. Prix catalogue : ${pack.priceEgld.list} EGLD. Tu peux charger de l’EGLD via MoonPay puis revenir.`,
      )
      setBusy(false)
      onStarted?.('crypto')
      return
    }
    // SC live : ouvrir marketplace agents / tx builder (route dédiée)
    setMsg('Ouverture du flux mint on-chain…')
    window.location.hash = `#/agents?mint=${pack.id}`
    onStarted?.('crypto')
    setBusy(false)
    onClose()
  }

  const onAcceptTerms = async () => {
    setTermsOpen(false)
    if (rail === 'fiat') await launchFiat()
    else if (rail === 'crypto') await launchCrypto()
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-3"
      role="dialog"
      aria-modal
      aria-labelledby="checkout-title"
      onClick={onClose}
    >
      <div
        className="glass-hud w-full max-w-md max-h-[92vh] overflow-y-auto p-4 space-y-4 shadow-[0_0_40px_rgba(139,92,246,0.2)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-tech uppercase tracking-widest text-violet-300/90">
              Checkout pack
            </p>
            <h2 id="checkout-title" className="text-lg font-bold text-white">
              {pack.icon} {pack.name}{' '}
              <span className="text-[11px] font-normal text-zinc-500">{pack.tierLabel}</span>
            </h2>
            <p className="text-[12px] text-zinc-400 mt-0.5">
              {pack.priceEgld.list} EGLD · ≈ {pack.priceEur.list} €
            </p>
          </div>
          <button type="button" className="btn-secondary text-xs px-2 py-1" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="text-[11px] text-zinc-500 leading-relaxed border border-white/10 rounded-xl px-3 py-2">
          Produit d’accès numérique limité — <strong className="text-zinc-300">pas un fond</strong>{' '}
          d’investissement. LIA reste un agent <strong className="text-zinc-300">analytique / paper</strong>{' '}
          : aucun mandat de gestion ni compte titres broker dans cette dApp.
        </p>

        {/* Rail selection */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-tech">Choisir le rail</p>

          <button
            type="button"
            onClick={() => {
              setRail('crypto')
              setMsg('')
            }}
            className={`w-full text-left rounded-2xl border p-3 transition active:scale-[0.99] ${
              rail === 'crypto'
                ? 'border-cyan-400/50 bg-cyan-500/10'
                : 'border-white/10 bg-black/30 hover:border-white/20'
            }`}
          >
            <p className="text-sm font-semibold text-white">1 · Crypto direct</p>
            <p className="text-[12px] text-zinc-400 mt-1">
              Payer en <strong className="text-zinc-200">EGLD</strong> (ou $TRO si pair dispo) via{' '}
              <strong className="text-zinc-200">xPortal</strong>. Mint NFT pack on-chain quand le SC
              agents est LIVE.
            </p>
            <p className="text-[11px] text-cyan-300/90 mt-1.5 mono">
              {pack.priceEgld.list} EGLD · mint {mintLive ? 'ouvert' : 'bientôt'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setRail('fiat')
              setMsg('')
            }}
            className={`w-full text-left rounded-2xl border p-3 transition active:scale-[0.99] ${
              rail === 'fiat'
                ? 'border-violet-400/50 bg-violet-500/10'
                : 'border-white/10 bg-black/30 hover:border-white/20'
            }`}
          >
            <p className="text-sm font-semibold text-white">2 · Fiat / FC rail</p>
            <p className="text-[12px] text-zinc-400 mt-1">
              Carte ou virement <strong className="text-zinc-200">SEPA (EUR / RON)</strong> via gateway
              régulé (Stripe, Paybox, ou partenaire FC / broker). Après confirmation webhook → mint
              pack MultiversX sur ton erd1.
            </p>
            <p className="text-[11px] text-violet-300/90 mt-1.5">
              {pack.priceEur.list} € · {hasFiat ? 'gateway dispo' : 'config secrets / Access API'}
            </p>
          </button>
        </div>

        {rail === 'fiat' && hasFiat && (
          <div className="flex flex-wrap gap-2">
            {methods.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setFiatMethod(m)}
                className={`rounded-full px-3 py-1 text-[11px] border ${
                  fiatMethod === m
                    ? 'border-violet-400/40 bg-violet-500/15 text-violet-100'
                    : 'border-white/10 text-zinc-500'
                }`}
              >
                {m === 'stripe' ? 'Stripe (carte)' : 'Paybox / SEPA'}
              </button>
            ))}
          </div>
        )}

        {rail === 'crypto' && isMoonPayConfigured() && (
          <button
            type="button"
            className="w-full text-left text-[12px] text-zinc-400 underline-offset-2 hover:text-zinc-200"
            disabled={busy}
            onClick={async () => {
              if (!needWallet()) return
              setBusy(true)
              const r = await startMoonPayEgld({
                buyerAddress: address || undefined,
                amountEur: Math.max(20, pack.priceEur.list),
              })
              setBusy(false)
              if (!r.ok) setMsg(r.error || 'MoonPay indisponible')
              else setMsg('MoonPay ouvert — recharge EGLD puis reviens pour le mint.')
            }}
          >
            Besoin d’EGLD ? On-ramp MoonPay (carte → EGLD) ↗
          </button>
        )}

        {rail && (
          <button
            type="button"
            className="btn-primary w-full text-sm"
            disabled={busy}
            onClick={() => {
              if (!needWallet()) return
              setTermsOpen(true)
            }}
          >
            {busy
              ? '…'
              : rail === 'fiat'
                ? `Continuer · ${pack.priceEur.list} € fiat`
                : `Continuer · ${pack.priceEgld.list} EGLD`}
          </button>
        )}

        <div className="border-t border-white/10 pt-3 space-y-2">
          <p className="text-[11px] text-zinc-500">
            Ou{' '}
            <button
              type="button"
              className="text-amber-200/90 underline"
              onClick={() => {
                if (!needWallet()) return
                onPreview?.(pack.id)
                onClose()
              }}
            >
              aperçu appareil (0 € · pas un achat · pas de NFT)
            </button>
          </p>
          <p className="text-[10px] text-zinc-600">
            <Link to="/legal" className="underline hover:text-zinc-400" onClick={onClose}>
              Mentions légales
            </Link>
            {' · '}
            Webhook mint = ops Access API — hors LIA trading.
          </p>
        </div>

        {msg && <p className="text-[12px] text-amber-200/90">{msg}</p>}

        <AccessTermsModal
          open={termsOpen}
          onClose={() => setTermsOpen(false)}
          onAccept={onAcceptTerms}
          packName={pack.name}
        />
      </div>
    </div>
  )
}
