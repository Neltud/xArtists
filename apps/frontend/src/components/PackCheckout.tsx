import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * Checkout packs — opens CheckoutModal (crypto | fiat). Full i18n.
 * Device preview is never presented as a purchase.
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { useWallet } from '../context/WalletContext'
import CheckoutModal from './CheckoutModal'
import { canBuyAgent } from '../config/scStatus'
import LottieIcon from './LottieIcon'
import { availablePayMethods } from '../lib/payments'
import { getAccessApiBase } from '../lib/stripe'
import { requestOpenConnect } from '../lib/walletEvents'
import { useI18n } from '../i18n/I18nContext'
import { getAccessToken } from '../lib/accessSession'
import { prepareSimplePack, confirmSimplePack, cancelSimplePack, ensureSimplePaperToken } from '../lib/liaSimple'
import type { PreparedSimpleIntent, SimplePaperReceipt, SimpleIntent } from '../../../../packages/lia-intent/src/simple'

const ONLY: PackId[] = ['pulse', 'yield', 'sentinel']
const PACKS = AGENT_PACKS.filter(p => ONLY.includes(p.id)).slice(0, 3)

export default function PackCheckout({
  packId: forcedId = null,
  onClear,
  onPaperDone,
}: {
  packId?: PackId | null
  onClear?: () => void
  onPaperDone?: (id: PackId) => void
} = {}) {
  const { t } = useI18n()
  const { connected, address, canAttemptSign } = useWallet()
  const methods = availablePayMethods()
  const hasPaidRail = methods.some(m => m === 'stripe' || m === 'paybox')
  // Independent manual release decision: unset/false on every public build
  // until payments, S1/S2, DB schema, contract and refunds are reviewed.
  // A frontend flag alone NEVER grants permission; API runtime must also pass.
  const commercialGoRequested = import.meta.env.VITE_GENESIS_COMMERCIAL_GO === '1'
  const [merchantCheckoutReady, setMerchantCheckoutReady] = useState(false)
  const [cryptoCheckoutReady, setCryptoCheckoutReady] = useState(false)
  useEffect(() => {
    setMerchantCheckoutReady(false)
    setCryptoCheckoutReady(false)
    if (!commercialGoRequested) return
    const abort = new AbortController()
    const api = getAccessApiBase() || 'https://xartists-access-api.onrender.com'
    fetch(api + '/health', { signal: abort.signal, cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error('merchant_health_unavailable')
        return response.json()
      })
      .then(health => {
        if (abort.signal.aborted) return
        // No commercial claim on config alone. Failed/stale/unavailable
        // health checks always keep both rails disabled.
        const deliveryReady =
          health?.service === 'access-api' &&
          health?.orders_backend === 'postgres' &&
          health?.mint_live_enabled === true &&
          health?.mint_dry_run === false
        const payboxReady =
          hasPaidRail && methods.includes('paybox') &&
          health?.paybox_checkout_enabled === true &&
          deliveryReady
        // Crypto cannot bypass the independent operator release flag merely
        // because an SC address/code hash is configured in the frontend.
        const cryptoReady = deliveryReady && canBuyAgent()
        setMerchantCheckoutReady(payboxReady)
        setCryptoCheckoutReady(cryptoReady)
      })
      .catch(() => {
        if (!abort.signal.aborted) {
          setMerchantCheckoutReady(false)
          setCryptoCheckoutReady(false)
        }
      })
    return () => abort.abort()
  }, [commercialGoRequested, hasPaidRail])
  const [selected, setSelected] = useState<PackId | null>(
    forcedId && ONLY.includes(forcedId) ? forcedId : null,
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'done'>('idle')
  const [msg, setMsg] = useState('')
  const [paperBusy, setPaperBusy] = useState(false)
  const [paperPrepared, setPaperPrepared] = useState<PreparedSimpleIntent | null>(null)
  const [paperReceipt, setPaperReceipt] = useState<SimplePaperReceipt | null>(null)
  const [paperMessage, setPaperMessage] = useState('')

  useEffect(() => {
    if (forcedId && ONLY.includes(forcedId)) setSelected(forcedId)
    else if (forcedId === null) setSelected(null)
  }, [forcedId])

  const pack = PACKS.find(p => p.id === selected)
  const checkoutAvailable = commercialGoRequested && (merchantCheckoutReady || cryptoCheckoutReady)
  const isGuest = !connected || !address?.startsWith('erd1')

  const roomKey = (id: PackId) =>
    id === 'pulse'
      ? t('packCheckout.room.pulse')
      : id === 'yield'
        ? t('packCheckout.room.yield')
        : t('packCheckout.room.sentinel')

  // The existing purchase action now prepares a strictly paper-only quote when
  // commercial checkout is closed. Access SIWX authenticates the wallet; it
  // does NOT authorize a transaction or sign an intent.
  const onPreparePaper = async (id: PackId) => {
    if (paperBusy) return
    setPaperPrepared(null)
    setPaperReceipt(null)
    setPaperMessage('')
    if (isGuest) {
      setPaperMessage('Connectez votre wallet pour préparer une simulation. Aucun achat ne sera effectué.')
      requestOpenConnect()
      return
    }
    if (!canAttemptSign && !getAccessToken(address)) {
      setPaperMessage('Vérification xPortal nécessaire. Une adresse en lecture seule ne peut pas préparer une simulation authentifiée.')
      return
    }
    const intent: SimpleIntent =
      id === 'pulse'
        ? { type: 'BUY_PACK', packTier: 'pulse', amountEur: '110', userAddress: address }
        : id === 'yield'
          ? { type: 'BUY_PACK', packTier: 'yield', amountEur: '75', userAddress: address }
          : { type: 'BUY_PACK', packTier: 'sentinel', amountEur: '50', userAddress: address }
    setPaperBusy(true)
    try {
      const token = await ensureSimplePaperToken(address)
      if (!token) throw new Error('Authentification SIWX indisponible. Aucun paiement lancé.')
      const ready = await prepareSimplePack(intent, token)
      setPaperPrepared(ready)
    } catch (error) {
      setPaperMessage(error instanceof Error ? error.message : 'Simulation temporairement indisponible')
    } finally {
      setPaperBusy(false)
    }
  }

  const onConfirmPaper = async () => {
    if (!paperPrepared || paperBusy || paperPrepared.quote.packTier !== selected) return
    setPaperBusy(true)
    setPaperMessage('')
    try {
      const token = getAccessToken(address) || await ensureSimplePaperToken(address)
      if (!token) throw new Error('Authentification du wallet expirée')
      const receipt = await confirmSimplePack(paperPrepared.confirmationId, token)
      setPaperReceipt(receipt)
      setPaperPrepared(null)
    } catch (error) {
      setPaperPrepared(null)
      setPaperMessage(error instanceof Error ? error.message : 'Simulation non confirmée')
    } finally {
      setPaperBusy(false)
    }
  }

  const onCancelPaper = async () => {
    if (!paperPrepared || paperBusy) return
    const id = paperPrepared.confirmationId
    setPaperPrepared(null)
    setPaperMessage('Simulation annulée · aucun paiement ni NFT.')
    const token = getAccessToken(address)
    if (!token) return
    try { await cancelSimplePack(id, token) } catch {
      // The backend may have expired the quote. No payment or mint can occur.
    }
  }

  const onPreview = (id: PackId) => {
    if (isGuest) {
      setMsg(t('packCheckout.guestPreview'))
      return
    }
    try {
      localStorage.setItem(
        'xartists_access_checkout_intent',
        JSON.stringify({
          packId: id,
          provider: 'device_preview',
          address,
          kind: 'preview_not_purchase',
          purchased: false,
          ts: Date.now(),
        }),
      )
    } catch {
      /* */
    }
    setStatus('done')
    setMsg(t('packCheckout.previewDone', { id, room: roomKey(id) }))
    onPaperDone?.(id)
  }

  const onSelectPack = (id: PackId) => {
    setSelected(id)
    setPaperPrepared(null)
    setPaperReceipt(null)
    setPaperMessage('')
    setMsg('')
    setStatus('idle')
    if (isGuest) {
      setMsg(t('packCheckout.guestSelect', { room: roomKey(id) }))
    }
  }

  return (
    <div className="space-y-4">
      {xaRender(!selected && (
        <div className="flex flex-wrap gap-2">
          {xaRender(PACKS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPack(p.id)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-sm hover:border-violet-400/40"
            >
              <span className="font-semibold text-white">
                {xaRender(p.icon)} {xaRender(p.name)}
              </span>
              <span className="block text-[11px] text-zinc-500">{xaRender(p.priceEgld.list)} {xaRender(" EGLD")}</span>
            </button>
          )))}
        </div>
      ))}

      {xaRender(selected && pack && status !== 'done' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-zinc-300">
              {xaRender(t('packCheckout.selected'))} <strong className="text-white">{xaRender(pack.name)}</strong>
            </p>
            <button
              type="button"
              className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={paperBusy}
              aria-disabled={paperBusy}
              onClick={() => {
                if (!checkoutAvailable) {
                  void onPreparePaper(pack.id)
                  return
                }
                if (isGuest) {
                  setMsg(t('packCheckout.connectFirst'))
                  requestOpenConnect()
                  return
                }
                setModalOpen(true)
              }}
            >
              {xaRender(paperBusy ? 'Préparation…' : checkoutAvailable ? t('packCheckout.buy') : 'Préparer une simulation · PAPER')}
            </button>
            {!checkoutAvailable && (
              <button
                type="button"
                className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/90 hover:border-violet-400/40"
                onClick={() => onPreview(pack.id)}
              >
                {xaRender(t('checkout.preview'))} · {xaRender('sans paiement ni NFT')}
              </button>
            )}
            {xaRender(onClear && (
              <button type="button" className="text-xs text-zinc-500 underline" onClick={onClear}>
                {xaRender(t('packCheckout.change'))}
              </button>
            ))}
          </div>

          {!checkoutAvailable && (
            <p role="status" className="text-[12px] text-amber-200/90 leading-relaxed">
              {xaRender('Aucun achat ni mint disponible actuellement. Les prix sont indicatifs et l’aperçu ne délivre aucun droit NFT.')}
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] px-3 py-2">
              <p className="font-medium text-cyan-100/90">{xaRender(t('packCheckout.crypto'))}</p>
              <p className="text-zinc-400 mt-0.5">
                {xaRender(t('packCheckout.cryptoLine', { amount: pack.priceEgld.list }))}
                {xaRender(' · ')}
                {xaRender(cryptoCheckoutReady ? t('packCheckout.mintLive') : t('packCheckout.mintSoon'))}
              </p>
            </div>
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] px-3 py-2">
              <p className="font-medium text-violet-100/90">{xaRender(t('packCheckout.fiat'))}</p>
              <p className="text-zinc-400 mt-0.5">
                {xaRender(t('packCheckout.fiatLine', { amount: pack.priceEur.list }))}
                {xaRender(' · ')}
                {xaRender(merchantCheckoutReady ? t('packCheckout.gatewayOn') : t('packCheckout.soon'))}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500">{xaRender(t('packCheckout.liaNote'))}</p>
        </>
      ))}

      {xaRender(paperPrepared && selected === paperPrepared.quote.packTier && (
        <section role="region" aria-label="Confirmer la simulation LIA" className="rounded-xl border border-cyan-400/40 bg-cyan-500/[0.06] p-4 space-y-3">
          <p className="text-sm font-semibold text-cyan-100">LIA · devis Rule1 · simulation uniquement</p>
          <p className="text-xs text-zinc-200">
            {xaRender(paperPrepared.quote.packTier.toUpperCase())} · {xaRender(paperPrepared.quote.amountEur)} € ·
            estimation {xaRender(paperPrepared.quote.estimatedEgld)} EGLD
          </p>
          <p className="text-xs text-zinc-400">
            Taux indicatif : {xaRender(paperPrepared.quote.rateEurPerEgld)} €/EGLD.
            Validité 30 s maximum. Solde et gas non vérifiés.
          </p>
          <p className="text-xs text-amber-100">Aucun paiement, ordre, NFT, avantage ou accès ne sera créé.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={paperBusy}
              className="btn-primary text-xs disabled:opacity-50"
              onClick={() => { void onConfirmPaper() }}>
              Confirmer la simulation
            </button>
            <button type="button" disabled={paperBusy}
              className="rounded-xl border border-white/20 px-3 py-2 text-xs text-white disabled:opacity-50"
              onClick={() => { void onCancelPaper() }}>
              Annuler
            </button>
          </div>
        </section>
      ))}

      {xaRender(paperReceipt && (
        <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/[0.06] p-3 text-xs text-emerald-100">
          Simulation enregistrée (PAPER). 0 € prélevé · aucun NFT minté · aucun accès accordé.
          Référence audit : <code>{xaRender(paperReceipt.auditId.slice(0, 12))}</code>
        </p>
      ))}

      {xaRender(paperMessage && (
        <p role="alert" className="rounded-xl border border-amber-400/25 p-3 text-xs text-amber-100">{xaRender(paperMessage)}</p>
      ))}

      {xaRender(status === 'done' && (
        <div className="flex items-start gap-3 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-3">
          <LottieIcon preset="check" loop={false} size={36} />
          <div className="min-w-0">
            <p className="text-sm text-cyan-50 font-medium">{xaRender(msg)}</p>
            <p className="text-[12px] text-cyan-100/70 mt-0.5">
              <Link to="/my-packs" className="underline underline-offset-2 hover:text-white">
                {xaRender(t('packCheckout.myRooms'))}
              </Link>
            </p>
          </div>
        </div>
      ))}

      {xaRender(msg && status !== 'done' && (
        <p className="text-[12px] text-amber-200/90 leading-relaxed">{xaRender(msg)}</p>
      ))}

      {xaRender(selected && checkoutAvailable && (
        <CheckoutModal
          open={modalOpen}
          packId={selected}
          onClose={() => setModalOpen(false)}
          onPreview={onPreview}
          onStarted={() => setModalOpen(false)}
        />
      ))}
    </div>
  )
}
