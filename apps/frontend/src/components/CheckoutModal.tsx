import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * Checkout packs — Crypto | Fiat. Full i18n. On-chain buyPack → 1 ESDT NFT.
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
import { useI18n } from '../i18n/I18nContext'
import { useAgentPackTx } from '../hooks/useAgentPackTx'

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
  const { t } = useI18n()
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
  const { buyPack, pending: packTxPending } = useAgentPackTx()
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
      setMsg(t('checkout.msg.fiatNotConfigured'))
      return
    }
    const method = methods.includes(fiatMethod) ? fiatMethod : methods[0]
    const buyer = hasErd1 ? address! : ensureGuestId()
    setBusy(true)
    setMsg(
      hasErd1
        ? method === 'stripe'
          ? t('checkout.msg.redirectStripe')
          : t('checkout.msg.redirectPaybox')
        : t('checkout.msg.guestPay', { id: buyer }),
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
      rule: '1_pack_1_esdt_nft_via_relayer',
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
      setMsg(t('checkout.msg.cryptoNeedsWallet'))
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
      rule: '1_pack_1_esdt_nft',
    })
    try {
      const result = await buyPack(pack.id)
      setMsg(
        result.sessionId
          ? `TX ${String(result.sessionId).slice(0, 12)}… — NFT ${pack.id} à la confirmation bloc`
          : t('checkout.msg.mintSoon', { amount: pack.priceEgld.list }),
      )
      onStarted?.('crypto')
      setTimeout(() => onClose(), 1800)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const onAcceptTerms = async () => {
    setTermsOpen(false)
    if (rail === 'fiat') await launchFiat()
    else if (rail === 'crypto') await launchCrypto()
  }

  return (
    <div
      data-xartists-modal="1"
      className="xa-modal-overlay fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal
      aria-labelledby="checkout-title"
      onClick={onClose}
    >
      <div
        className="xa-modal-panel glass-hud w-full max-w-md max-h-[92vh] overflow-y-auto space-y-4 rounded-2xl border border-purple-500/30 bg-black/85 backdrop-blur-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-tech uppercase tracking-widest text-violet-300/90">
              {xaRender(t('checkout.title'))}
            </p>
            <h2 id="checkout-title" className="text-lg font-bold text-white">
              {xaRender(pack.icon)} {xaRender(pack.name)}{xaRender(' ')}
              <span className="text-[11px] font-normal text-zinc-500">{xaRender(pack.tierLabel)}</span>
            </h2>
            <p className="text-[12px] text-zinc-400 mt-0.5 mono tabular-nums">
              {xaRender(t('checkout.priceLine', { egld: pack.priceEgld.list, eur: pack.priceEur.list }))}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10 text-lg leading-none"
            aria-label={t('checkout.close')}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <p className="text-[11px] text-zinc-500 leading-relaxed border border-white/10 rounded-xl px-3 py-2">
          {xaRender(t('checkout.disclaimer'))}
        </p>

        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-tech">
            {xaRender(t('checkout.chooseRail'))}
          </p>

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
            <p className="text-sm font-semibold text-white">{xaRender(t('checkout.rail.web3'))}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">{xaRender(t('checkout.rail.crypto.desc'))}</p>
            <p className="text-[11px] text-cyan-300/90 mt-1 mono">
              {xaRender(pack.priceEgld.list)} {xaRender(" EGLD ·")}{xaRender(' ')}
              {xaRender(mintLive ? t('checkout.rail.crypto.mintOpen') : t('checkout.rail.crypto.mintSoon'))}
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
            <p className="text-sm font-semibold text-white">{xaRender(t('checkout.rail.card'))}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">{xaRender(t('checkout.rail.fiat.desc'))}</p>
            <p className="text-[11px] text-violet-300/90 mt-1 mono">
              {xaRender(pack.priceEur.list)} € ·{xaRender(' ')}
              {xaRender(hasFiat ? t('checkout.rail.fiat.ready') : t('checkout.rail.fiat.soon'))}
            </p>
          </button>
        </div>

        {xaRender(rail === 'fiat' && hasFiat && (
          <div className="flex flex-wrap gap-2">
            {xaRender(methods.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setFiatMethod(m)}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${
                  fiatMethod === m
                    ? 'border-violet-400/50 bg-violet-500/20 text-white'
                    : 'border-white/10 text-zinc-400'
                }`}
              >
                {xaRender(m === 'stripe' ? t('checkout.method.stripe') : t('checkout.method.paybox'))}
              </button>
            )))}
          </div>
        ))}

        {xaRender(rail === 'fiat' && !hasErd1 && (
          <p className="text-[11px] text-zinc-500 leading-relaxed">{xaRender(t('checkout.guestHint'))}</p>
        ))}

        {xaRender(rail === 'crypto' && !hasErd1 && (
          <div className="space-y-2">
            <button type="button" className="btn-primary w-full text-sm" onClick={() => requestOpenConnect()}>
              {xaRender(t('common.connect'))}
            </button>
            <button
              type="button"
              className="w-full text-center text-[12px] underline text-cyan-300"
              onClick={() => requestOpenConnect()}
            >
              {xaRender(t('checkout.connectXportal'))}
            </button>
          </div>
        ))}

        {xaRender(rail === 'crypto' && isMoonPayConfigured() && hasErd1 && (
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
              if (!r.ok) setMsg(r.error || t('checkout.msg.moonpayFail'))
              else setMsg(t('checkout.msg.moonpayOk'))
            }}
          >
            {xaRender(t('checkout.needEgld'))}
          </button>
        ))}

        {xaRender(rail && (
          <button
            type="button"
            className="btn-primary w-full text-sm"
            disabled={busy || packTxPending || (rail === 'crypto' && !hasErd1)}
            onClick={() => setTermsOpen(true)}
          >
            {xaRender(busy || packTxPending
              ? '…'
              : rail === 'fiat'
                ? t('checkout.continueFiat', { amount: pack.priceEur.list })
                : t('checkout.continueCrypto', { amount: pack.priceEgld.list }))}
          </button>
        ))}

        <div className="border-t border-white/10 pt-3 space-y-2">
          <p className="text-[11px] text-zinc-500">
            {xaRender(t('checkout.or'))}{xaRender(' ')}
            <button
              type="button"
              className="text-amber-200/90 underline"
              onClick={() => {
                if (!hasErd1) {
                  setMsg(t('checkout.msg.previewNeedWallet'))
                  requestOpenConnect()
                  return
                }
                onPreview?.(pack.id)
                onClose()
              }}
            >
              {xaRender(t('checkout.preview'))}
            </button>
          </p>
          <p className="text-[10px] text-zinc-600">
            <Link to="/legal" className="underline hover:text-zinc-400" onClick={onClose}>
              {xaRender(t('checkout.legalLink'))}
            </Link>
          </p>
        </div>

        {xaRender(msg && <p className="text-[12px] text-amber-200/90">{xaRender(msg)}</p>)}

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
