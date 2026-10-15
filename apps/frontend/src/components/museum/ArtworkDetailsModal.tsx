/**
 * Fiche inspection œuvre + dock RWA Buy / Bid / Cert / Sell (i18n).
 * Option Agrandir l'image plein écran.
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
  const [enlarged, setEnlarged] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const priceLabel =
    frame.priceLabel ||
    (frame.priceEur != null ? `${frame.priceEur} ${frame.currency || '€'}` : null) ||
    '—'

  const forSale = frame.onSale === true
  const sha = (frame as { sha256?: string }).sha256 || (frame as { hash?: string }).hash
  const nfc = (frame as { nfcId?: string }).nfcId || (frame as { chipId?: string }).chipId

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
          <button
            type="button"
            className="relative w-full block group"
            onClick={() => setEnlarged(true)}
            aria-label="Agrandir l image"
          >
            <img
              src={frame.image}
              alt={frame.title}
              className="w-full max-h-56 object-cover bg-zinc-950"
            />
            <span className="absolute bottom-2 right-2 rounded-full border border-white/20 bg-black/70 px-2.5 py-1 text-[10px] font-semibold text-white opacity-90 group-hover:opacity-100">
              Agrandir l image
            </span>
          </button>
        ) : (
          <div className="h-32 bg-zinc-900 flex items-center justify-center text-4xl">🎨</div>
        )}

        {enlarged && frame.image ? (
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/95 p-3"
            role="dialog"
            aria-modal
            onClick={() => setEnlarged(false)}
          >
            <img
              src={frame.image}
              alt={frame.title}
              className="max-h-[92vh] max-w-[96vw] object-contain"
              onClick={e => e.stopPropagation()}
            />
            <button
              type="button"
              className="absolute top-4 right-4 min-h-[44px] min-w-[44px] rounded-xl border border-white/20 bg-black/60 text-white"
              onClick={() => setEnlarged(false)}
            >
              ✕
            </button>
          </div>
        ) : null}

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

          <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
            <p>
              Prix · <span className="text-zinc-200">{priceLabel}</span>
            </p>
            <p>
              {forSale ? 'En vente' : 'Exposition'}
            </p>
            {nfc ? (
              <p className="col-span-2 mono">
                NFC / chip · <span className="text-amber-200/90">{nfc}</span>
              </p>
            ) : null}
            {sha ? (
              <p className="col-span-2 mono truncate">
                Certificat · <span className="text-zinc-300">{String(sha).slice(0, 18)}…</span>
              </p>
            ) : (
              <p className="col-span-2 text-zinc-500">Certificat RWA · provenance on-chain</p>
            )}
          </div>

          {msg && <p className="text-[12px] text-amber-100/90">{msg}</p>}

          <div className="flex flex-wrap gap-2">
            {frame.image && (
              <button type="button" className="btn-secondary text-xs min-h-[44px]" onClick={() => setEnlarged(true)}>
                Agrandir l image
              </button>
            )}
            <button type="button" className="btn-primary text-xs min-h-[44px]" onClick={doBuy}>
              {t('museum.buy') || 'Buy'}
            </button>
            <button type="button" className="btn-secondary text-xs min-h-[44px]" onClick={() => setBidOpen(v => !v)}>
              Bid
            </button>
            {isOwner && (
              <button type="button" className="btn-secondary text-xs min-h-[44px]" onClick={() => setSellOpen(v => !v)}>
                Sell
              </button>
            )}
            <Link to="/studio" className="btn-secondary text-xs min-h-[44px] inline-flex items-center">
              Studio RWA
            </Link>
          </div>

          {bidOpen && (
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
                placeholder="EGLD"
                value={bidAmt}
                onChange={e => setBidAmt(e.target.value)}
              />
              <button type="button" className="btn-primary text-xs" onClick={doBid}>
                OK
              </button>
            </div>
          )}
          {sellOpen && (
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white"
                placeholder="Prix"
                value={sellPrice}
                onChange={e => setSellPrice(e.target.value)}
              />
              <button type="button" className="btn-primary text-xs" onClick={doSell}>
                OK
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
