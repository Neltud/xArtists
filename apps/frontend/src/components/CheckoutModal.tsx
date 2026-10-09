/**
 * Checkout packs — Crypto (wallet) | Fiat (wallet ou guest receive id).
 * data-xartists-modal="1" → pause WebGL.
 */
import { useEffect, useState } from 'react'
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
import { generateGuestReceiveId, loadGuestReceiveId, saveGuestReceiveId } from './LoginModal'
import { useWebglPauseWhen } from '../hooks/useWebglPause'

export type CheckoutRail = 'crypto' | 'fiat' | null

type Props = {
  open: boolean
  packId: PackId
  onClose: () => void
  onStarted?: (rail: 'crypto' | 'fiat') => void
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
  const [guestId, setGuestId] = useState<string | null>(() => loadGuestReceiveId())
  const methods = availablePayMethods().filter(m => m !== 'paper')
  const hasFiat = methods.length > 0
  const mintLive = canBuyAgent()
  const hasErd1 = connected && !!address?.startsWith('erd1')

  useWebglPauseWhen(open)

  useEffect(() => {
    if (!open) {
      setRail(null)
      setMsg('')
      setBusy(false)
    }
  }, [open])

  if (!open || !pack) return null

  const ensureGuestId = () => {
    let id = guestId || loadGuestReceiveId()
    if (!id) {
      id = generateGuestReceiveId()
      saveGuestReceiveId(id, { packId: pack.id, purpose: 'fiat_pack_pending' })
      setGuestId(id)
    }
    return id
  }

  const launchFiat = async () => {
    if (!hasFiat) {
      setMsg('Rail fiat non configuré (Stripe / Paybox / Access API).')
      return
    }
    const method = methods.includes(fiatMethod) ? fiatMethod : methods[0]
    const buyer = hasErd1 ? address! : ensureGuestId()
    setBusy(true)
    setMsg(
      hasErd1
        ? method === 'stripe'
          ? 'Redirection Stripe…'
          : 'Redirection Paybox / e-Transactions…'
        : `Paiement lié à l’ID ${buyer} — claim erd1 après confirmation…`,
    )
    saveIntent({
      packId: pack.id,
      provider: method,
      amount: pack.priceEur.list,
      currency: 'EUR',
      address: hasErd1 ? address : undefined,
      guestReceiveId: hasErd1 ? undefined : buyer,
      kind: 'fiat_checkout',
      rail: 'fiat',
      note: 'Mint après webhook — pas LIA broker',
    })
    try {
      await startPackPayment({
        method,
        packId: pack.id,
        buyerAddress: hasErd1 ? address! : `guest:${buyer}`,
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
    if (!hasErd1) {
      setMsg('Le rail crypto exige xPortal / erd1.')
      requestOpenConnect()
      return
    }
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
        `Mint pack on-chain bientôt. Prix : ${pack.priceEgld.list} EGLD. MoonPay possible pour recharger.`,
      )
      setBusy(false)
      onStarted?.('crypto')
      return
    }
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
      data-xartists-modal="1"
      className="xa-modal-overlay fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-labelledby="checkout-title"
      onClick={onClose}
    >
      <div
        className="xa-modal-panel glass-hud w-full max-w-md max-h-[92vh] overflow-y-auto space-y-4 shadow-[0_0_40px_rgba(139,92,246,0.2)]"
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
            <p className="text-[12px] text-zinc-400 mt-0.5 mono tabular-nums">
              {pack.priceEgld.list} EGLD · ≈ {pack.priceEur.list} €
            </p>
          </div>
          <button type="button" className="btn-secondary text-xs px-2 py-1" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="text-[11px] text-zinc-500 leading-relaxed border border-white/10 rounded-xl px-3 py-2">
          Produit d’accès numérique limité — <strong className="text-zinc-300">pas un fond</strong>{' '}
          d’investissement. LIA = <strong className="text-zinc-300">analytique / paper</strong> uniquement.
          Fiat = prestataires tiers régulés.
        </p>

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
              EGLD via <strong className="text-zinc-200">xPortal</strong> (wallet requis).
            </p>
            <p className="text-[11px] text-cyan-300/90 mt-1.5 mono tabular-nums">
              {pack.priceEgld.list} EGLD · mint {mintLive ? 'ouvert' : 'bientôt'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setRail('fiat')
              setMsg('')
              if (!hasErd1) ensureGuestId()
            }}
            className={`w-full text-left rounded-2xl border p-3 transition active:scale-[0.99] ${
              rail === 'fiat'
                ? 'border-violet-400/50 bg-violet-500/10'
                : 'border-white/10 bg-black/30 hover:border-white/20'
            }`}
          >
            <p className="text-sm font-semibold text-white">2 · Fiat / FC rail</p>
            <p className="text-[12px] text-zinc-400 mt-1">
              Carte / SEPA via gateway régulé. Sans wallet :{' '}
              <strong className="text-zinc-200">ID réception temporaire</strong> → mint après claim
              erd1.
            </p>
            <p className="text-[11px] text-violet-300/90 mt-1.5 mono tabular-nums">
              {pack.priceEur.list} € · {hasFiat ? 'gateway dispo' : 'config ops'}
              {!hasErd1 && guestId ? ` · guest ${guestId.slice(0, 18)}…` : ''}
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

        {rail === 'fiat' && !hasErd1 && (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-100/90 space-y-1">
            <p>Pas de wallet connecté — un ID temporaire sera attaché au paiement.</p>
            <button type="button" className="underline text-cyan-300" onClick={() => requestOpenConnect()}>
              Ou connecter xPortal / accès simplifié
            </button>
          </div>
        )}

        {rail === 'crypto' && isMoonPayConfigured() && hasErd1 && (
          <button
            type="button"
            className="w-full text-left text-[12px] text-zinc-400 hover:text-zinc-200"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              const r = await startMoonPayEgld({
                buyerAddress: address || undefined,
                amountEur: Math.max(20, pack.priceEur.list),
              })
              setBusy(false)
              if (!r.ok) setMsg(r.error || 'MoonPay indisponible')
              else setMsg('MoonPay ouvert — recharge EGLD puis reviens.')
            }}
          >
            Besoin d’EGLD ? MoonPay ↗
          </button>
        )}

        {rail && (
          <button
            type="button"
            className="btn-primary w-full text-sm"
            disabled={busy || (rail === 'crypto' && !hasErd1)}
            onClick={() => setTermsOpen(true)}
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
                if (!hasErd1) {
                  setMsg('Connecte un wallet pour lier l’aperçu.')
                  requestOpenConnect()
                  return
                }
                onPreview?.(pack.id)
                onClose()
              }}
            >
              aperçu appareil (0 € · pas un achat)
            </button>
          </p>
          <p className="text-[10px] text-zinc-600">
            <Link to="/legal" className="underline hover:text-zinc-400" onClick={onClose}>
              Mentions légales
            </Link>
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
