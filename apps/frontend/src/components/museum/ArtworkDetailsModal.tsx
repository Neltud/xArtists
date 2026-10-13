/**
 * Fiche inspection œuvre + dock RWA Buy / Bid / Cert / Sell (i18n).
 * Signatures via xPortal — non-custodial.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { FrameItem } from './MuseumCorridor'
import { useI18n } from '../../i18n/I18nContext'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'
import { canListBuyNft } from '../../config/scStatus'

type Props = {
  frame: FrameItem
  onClose: () => void
  onBuy?: () => void
  isOwner?: boolean
}

export default function ArtworkDetailsModal({ frame, onClose, onBuy, isOwner }: Props) {
  const { t } = useI18n()
  const { connected } = useWallet()
  const live = canListBuyNft()
  const [bidOpen, setBidOpen] = useState(false)
  const [bidAmt, setBidAmt] = useState('')
  const [sellOpen, setSellOpen] = useState(false)
  const [sellPrice, setSellPrice] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const priceLabel =
    frame.priceLabel ||
    (frame.priceEur != null ? `${frame.priceEur} ${frame.currency || '€'}` : null) ||
    '—'

  const forSale = frame.onSale === true
  const sha = (frame as { sha256?: string }).sha256 || (frame as { hash?: string }).hash

  const needWallet = (fn: () => void) => {
    if (!connected) {
      requestOpenConnect()
      setMsg(t('museum.connectWallet'))
      return
    }
    fn()
  }

  const doBuy = () =>
    needWallet(() => {
      if (onBuy) onBuy()
      else {
        window.dispatchEvent(
          new CustomEvent('museum-buy-intent', {
            detail: { id: frame.id, title: frame.title, paper: !live },
          }),
        )
        setMsg(live ? t('museum.buyIntentLive') : t('museum.buyIntentPaper'))
      }
    })

  const doBid = () =>
    needWallet(() => {
      window.dispatchEvent(
        new CustomEvent('museum-bid-intent', {
          detail: { id: frame.id, amount: bidAmt, paper: true },
        }),
      )
      setMsg(t('museum.bidRecorded').replace('{amt}', bidAmt || '—'))
      setBidOpen(false)
    })

  const doSell = () =>
    needWallet(() => {
      window.dispatchEvent(
        new CustomEvent('museum-sell-intent', {
          detail: { id: frame.id, price: sellPrice, paper: !live },
        }),
      )
      setMsg(t('museum.sellRecorded').replace('{price}', sellPrice || '—'))
      setSellOpen(false)
    })

  return (
    <div
      className="absolute inset-0 z-30 flex items-end sm:items-center justify-center p-3 bg-black/60 backdrop-blur-md"
      role="dialog"
      aria-modal
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-purple-500/30 bg-black/90 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {frame.image ? (
          <img
            src={frame.image}
            alt={frame.title}
            className="w-full max-h-48 object-cover bg-zinc-950"
          />
        ) : (
          <div className="h-32 bg-zinc-900 flex items-center justify-center text-4xl">🎨</div>
        )}

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-white">{frame.title}</h2>
              <p className="text-[12px] text-zinc-400">
                {frame.artist || frame.subtitle || '—'} · {frame.collection || '—'}
              </p>
            </div>
            <button
              type="button"
              className="min-h-[44px] min-w-[44px] rounded-xl border border-white/15 text-zinc-300"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {forSale ? (
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-100">
                {t('museum.forSale')}
              </span>
            ) : (
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400">
                {t('museum.owned')}
              </span>
            )}
            {sha && (
              <span className="rounded-full border border-violet-400/40 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-100">
                {t('museum.certified')}
              </span>
            )}
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-100">
              {priceLabel}
            </span>
          </div>

          {frame.description && (
            <p className="text-[12px] text-zinc-400 leading-relaxed line-clamp-4">{frame.description}</p>
          )}

          {msg && (
            <p className="text-[12px] text-cyan-100/90 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2">
              {msg}
            </p>
          )}

          {/* Dock transactionnel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button type="button" className="btn-primary text-xs min-h-[44px]" onClick={doBuy}>
              {t('museum.buy')}
            </button>
            <button
              type="button"
              className="btn-secondary text-xs min-h-[44px]"
              onClick={() => setBidOpen(v => !v)}
            >
              {t('museum.bid')}
            </button>
            <Link
              to="/studio"
              className="btn-secondary text-xs min-h-[44px] inline-flex items-center justify-center"
              onClick={onClose}
            >
              {t('museum.cert')}
            </Link>
            {isOwner && (
              <button
                type="button"
                className="btn-secondary text-xs min-h-[44px]"
                onClick={() => setSellOpen(v => !v)}
              >
                {t('museum.sell')}
              </button>
            )}
          </div>

          {bidOpen && (
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white min-h-[44px]"
                placeholder={t('museum.bidPlaceholder')}
                value={bidAmt}
                onChange={e => setBidAmt(e.target.value)}
              />
              <button type="button" className="btn-primary text-xs min-h-[44px]" onClick={doBid}>
                OK
              </button>
            </div>
          )}

          {sellOpen && (
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white min-h-[44px]"
                placeholder={t('museum.sellPlaceholder')}
                value={sellPrice}
                onChange={e => setSellPrice(e.target.value)}
              />
              <button type="button" className="btn-primary text-xs min-h-[44px]" onClick={doSell}>
                OK
              </button>
            </div>
          )}

          {!live && (
            <p className="text-[10px] text-amber-200/80">{t('museum.scGated')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
