/**
 * Checkout packs —
 * - Stripe / Paybox = paiement réel (si configuré)
 * - Sinon = APERÇU appareil uniquement (JAMAIS présenté comme achat)
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { useWallet } from '../context/WalletContext'
import AccessTermsModal from './AccessTermsModal'
import { canBuyAgent } from '../config/scStatus'
import { markPackOwned } from '../lib/nftPacks'
import LottieIcon from './LottieIcon'
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

export default function PackCheckout({
  packId: forcedId = null,
  onClear,
  onPaperDone,
}: {
  packId?: PackId | null
  onClear?: () => void
  onPaperDone?: (id: PackId) => void
} = {}) {
  const { connected, address } = useWallet()
  const methods = availablePayMethods()
  const hasPaidRail = methods.some(m => m === 'stripe' || m === 'paybox')
  const [method, setMethod] = useState<PayMethod>(() => defaultPayMethod())
  const [selected, setSelected] = useState<PackId | null>(
    forcedId && ONLY.includes(forcedId) ? forcedId : null,
  )
  useEffect(() => {
    if (forcedId && ONLY.includes(forcedId)) setSelected(forcedId)
    else if (forcedId === null) setSelected(null)
  }, [forcedId])

  const [termsOpen, setTermsOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'terms' | 'redirect' | 'done'>('idle')
  const [msg, setMsg] = useState('')
  const [previewOnly, setPreviewOnly] = useState(false)

  const pack = PACKS.find(p => p.id === selected)
  const mintLive = canBuyAgent()
  const isLocalPath = method === 'paper' || !hasPaidRail

  const startBuy = (id: PackId) => {
    if (!ONLY.includes(id)) return
    setSelected(id)
    setMsg('')
    setPreviewOnly(false)
    setStatus('idle')
  }

  const onAcceptTerms = async () => {
    setTermsOpen(false)
    if (!pack || !address) return

    // --- Paiement réel uniquement Stripe / Paybox ---
    if ((method === 'stripe' || method === 'paybox') && hasPaidRail) {
      setStatus('redirect')
      setMsg(method === 'stripe' ? 'Ouverture Stripe…' : 'Ouverture Paybox…')
      saveIntent({
        packId: pack.id,
        provider: method,
        amount: pack.priceEur.list,
        currency: 'EUR',
        address,
        kind: 'paid_checkout',
      })
      try {
        await startPackPayment({
          method,
          packId: pack.id,
          buyerAddress: address,
          amountEur: pack.priceEur.list,
        })
      } catch (e) {
        setMsg(String(e))
        setStatus('idle')
      }
      return
    }

    // --- Aperçu local : PAS un achat ---
    if (!previewOnly) {
      setMsg('Choisis « Activer aperçu » — ce n’est pas un achat ni un NFT.')
      setStatus('idle')
      return
    }
    saveIntent({
      packId: pack.id,
      provider: 'device_preview',
      address,
      kind: 'preview_not_purchase',
      purchased: false,
    })
    markPackOwned(pack.id)
    setStatus('done')
    setMsg(`Aperçu « ${pack.name} » activé sur cet appareil uniquement — aucun paiement, aucun NFT mint.`)
    onPaperDone?.(pack.id)
  }

  return (
    <div className="space-y-4">
      {!selected && (
        <div className="flex flex-wrap gap-2">
          {PACKS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => startBuy(p.id)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-200 hover:bg-white/[0.08] active:scale-[0.98]"
            >
              {p.icon} {p.name}
            </button>
          ))}
        </div>
      )}

      {selected && pack && (
        <>
          {hasPaidRail && (
            <div className="flex flex-wrap gap-2 items-center">
              {methods
                .filter(m => m !== 'paper')
                .map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMethod(m)
                      setPreviewOnly(false)
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs border transition active:scale-[0.98] ${
                      method === m && !previewOnly
                        ? 'border-violet-400/40 bg-violet-500/15 text-violet-100'
                        : 'border-white/10 text-zinc-500'
                    }`}
                  >
                    {payMethodLabel(m)}
                  </button>
                ))}
              {onClear && (
                <button type="button" className="text-xs text-zinc-500 underline" onClick={onClear}>
                  Changer
                </button>
              )}
            </div>
          )}

          {hasPaidRail && method !== 'paper' && !previewOnly && (
            <>
              <p className="text-[11px] text-zinc-500">
                {method === 'stripe' && stripeStatusHint()}
                {method === 'paybox' && payboxStatusHint()}
              </p>
              <button
                type="button"
                className="btn-primary text-sm active:scale-[0.98]"
                disabled={status === 'redirect' || !connected}
                onClick={() => {
                  if (!connected || !address?.startsWith('erd1')) {
                    setMsg('Connecte un wallet erd1 avant un paiement réel.')
                    return
                  }
                  setPreviewOnly(false)
                  setTermsOpen(true)
                  setStatus('terms')
                }}
              >
                {status === 'redirect' ? '…' : `Payer ${pack.priceEur.list} €`}
              </button>
            </>
          )}

          <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3 py-3 space-y-2">
            <p className="text-[12px] text-amber-100/95 font-medium">
              Aperçu salles (cet appareil)
            </p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Débloque l’UI des salles Pulse / Yield / Sentinel ici seulement. Ce n’est{' '}
              <strong className="text-zinc-200">pas un achat</strong>, pas un transfert EGLD, pas un
              mint NFT. Un nettoyage du navigateur efface cet aperçu.
            </p>
            <button
              type="button"
              className="btn-secondary text-sm active:scale-[0.98]"
              onClick={() => {
                if (!connected || !address?.startsWith('erd1')) {
                  setMsg('Connecte ton wallet pour lier l’aperçu à une adresse (toujours sans paiement).')
                  return
                }
                setMethod('paper')
                setPreviewOnly(true)
                setTermsOpen(true)
                setStatus('terms')
              }}
            >
              Activer aperçu — 0 € · sans NFT
            </button>
          </div>

          {!mintLive && (
            <p className="text-[11px] text-zinc-500">Mint NFT pack on-chain : bientôt.</p>
          )}
        </>
      )}

      {status === 'done' && (
        <div className="flex items-start gap-3 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-3">
          <LottieIcon preset="check" loop={false} size={36} />
          <div className="min-w-0">
            <p className="text-sm text-cyan-50 font-medium">{msg}</p>
            <p className="text-[12px] text-cyan-100/70 mt-0.5">
              <Link to="/my-packs" className="underline underline-offset-2 hover:text-white">
                Mes salles (aperçu)
              </Link>
            </p>
          </div>
        </div>
      )}

      {msg && status !== 'done' && <p className="text-[12px] text-amber-200/90">{msg}</p>}

      <AccessTermsModal
        open={termsOpen}
        onClose={() => {
          setTermsOpen(false)
          setStatus('idle')
          setPreviewOnly(false)
        }}
        onAccept={onAcceptTerms}
        packName={pack?.name}
      />
    </div>
  )
}
