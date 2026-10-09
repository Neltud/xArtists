/**
 * Checkout packs — ouvre CheckoutModal (crypto | fiat FC rail).
 * Aperçu appareil = jamais présenté comme achat.
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

  const onPreview = (id: PackId) => {
    if (!address?.startsWith('erd1')) {
      setMsg('Connecte ton wallet pour lier l’aperçu (sans paiement).')
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
    setMsg(`Aperçu « ${id} » sur cet appareil — pas un achat, pas de NFT mint.`)
    onPaperDone?.(id)
  }

  return (
    <div className="space-y-4">
      {!selected && (
        <div className="flex flex-wrap gap-2">
          {PACKS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-200 hover:bg-white/[0.08] active:scale-[0.98]"
            >
              {p.icon} {p.name}
            </button>
          ))}
        </div>
      )}

      {selected && pack && (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              className="btn-primary text-sm active:scale-[0.98]"
              onClick={() => setModalOpen(true)}
            >
              Acheter / Checkout
            </button>
            {onClear && (
              <button type="button" className="text-xs text-zinc-500 underline" onClick={onClear}>
                Changer
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] px-3 py-2">
              <p className="font-medium text-cyan-100/90">Crypto</p>
              <p className="text-zinc-400 mt-0.5">
                {pack.priceEgld.list} EGLD · xPortal{mintLive ? ' · mint LIVE' : ' · mint bientôt'}
              </p>
            </div>
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] px-3 py-2">
              <p className="font-medium text-violet-100/90">Fiat / FC</p>
              <p className="text-zinc-400 mt-0.5">
                {pack.priceEur.list} € · carte / SEPA{hasPaidRail ? ' · gateway on' : ' · config ops'}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500">
            LIA = analyse & paper trading uniquement — pas de compte titres ni broker dans le
            checkout.
          </p>
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

      {selected && (
        <CheckoutModal
          open={modalOpen}
          packId={selected}
          onClose={() => setModalOpen(false)}
          onPreview={onPreview}
          onStarted={() => setModalOpen(false)}
        />
      )}

      {!connected && selected && (
        <p className="text-[11px] text-zinc-500">Connecte xPortal pour crypto ou fiat.</p>
      )}
    </div>
  )
}
