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
import { markPackOwned } from '../lib/nftPacks'
import LottieIcon from './LottieIcon'
import { availablePayMethods } from '../lib/payments'
import { requestOpenConnect } from '../lib/walletEvents'
import { useI18n } from '../i18n/I18nContext'

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
  const { connected, address } = useWallet()
  const methods = availablePayMethods()
  const hasPaidRail = methods.some(m => m === 'stripe' || m === 'paybox')
  const [selected, setSelected] = useState<PackId | null>(
    forcedId && ONLY.includes(forcedId) ? forcedId : null,
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'done'>('idle')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (forcedId && ONLY.includes(forcedId)) setSelected(forcedId)
    else if (forcedId === null) setSelected(null)
  }, [forcedId])

  const pack = PACKS.find(p => p.id === selected)
  const mintLive = canBuyAgent()
  const isGuest = !connected || !address?.startsWith('erd1')

  const roomKey = (id: PackId) =>
    id === 'pulse'
      ? t('packCheckout.room.pulse')
      : id === 'yield'
        ? t('packCheckout.room.yield')
        : t('packCheckout.room.sentinel')

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
    markPackOwned(id)
    setStatus('done')
    setMsg(t('packCheckout.previewDone', { id, room: roomKey(id) }))
    onPaperDone?.(id)
  }

  const onSelectPack = (id: PackId) => {
    setSelected(id)
    setMsg('')
    setStatus('idle')
    if (isGuest) {
      setMsg(t('packCheckout.guestSelect', { room: roomKey(id) }))
    }
  }

  return (
    <div className="space-y-4">
      {!selected && (
        <div className="flex flex-wrap gap-2">
          {PACKS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPack(p.id)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-sm hover:border-violet-400/40"
            >
              <span className="font-semibold text-white">
                {p.icon} {p.name}
              </span>
              <span className="block text-[11px] text-zinc-500">{p.priceEgld.list} EGLD</span>
            </button>
          ))}
        </div>
      )}

      {selected && pack && status !== 'done' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-zinc-300">
              {t('packCheckout.selected')} <strong className="text-white">{pack.name}</strong>
            </p>
            <button
              type="button"
              className="btn-primary text-sm"
              onClick={() => {
                if (isGuest) {
                  setMsg(t('packCheckout.connectFirst'))
                  requestOpenConnect()
                  return
                }
                setModalOpen(true)
              }}
            >
              {t('packCheckout.buy')}
            </button>
            {onClear && (
              <button type="button" className="text-xs text-zinc-500 underline" onClick={onClear}>
                {t('packCheckout.change')}
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] px-3 py-2">
              <p className="font-medium text-cyan-100/90">{t('packCheckout.crypto')}</p>
              <p className="text-zinc-400 mt-0.5">
                {t('packCheckout.cryptoLine', { amount: pack.priceEgld.list })}
                {' · '}
                {mintLive ? t('packCheckout.mintLive') : t('packCheckout.mintSoon')}
              </p>
            </div>
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] px-3 py-2">
              <p className="font-medium text-violet-100/90">{t('packCheckout.fiat')}</p>
              <p className="text-zinc-400 mt-0.5">
                {t('packCheckout.fiatLine', { amount: pack.priceEur.list })}
                {' · '}
                {hasPaidRail ? t('packCheckout.gatewayOn') : t('packCheckout.soon')}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500">{t('packCheckout.liaNote')}</p>
        </>
      )}

      {status === 'done' && (
        <div className="flex items-start gap-3 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-3">
          <LottieIcon preset="check" loop={false} size={36} />
          <div className="min-w-0">
            <p className="text-sm text-cyan-50 font-medium">{msg}</p>
            <p className="text-[12px] text-cyan-100/70 mt-0.5">
              <Link to="/my-packs" className="underline underline-offset-2 hover:text-white">
                {t('packCheckout.myRooms')}
              </Link>
            </p>
          </div>
        </div>
      )}

      {msg && status !== 'done' && (
        <p className="text-[12px] text-amber-200/90 leading-relaxed">{msg}</p>
      )}

      {selected && (
        <CheckoutModal
          open={modalOpen}
          packId={selected}
          onClose={() => setModalOpen(false)}
          onPreview={onPreview}
          onStarted={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
