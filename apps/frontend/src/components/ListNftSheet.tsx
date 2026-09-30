/**
 * Overlay listing — prix → listNft → TxShell overlay.
 */
import { useState } from 'react'
import { useMarketplaceTx } from '../hooks/useMarketplaceTx'
import { canListBuyNft } from '../config/scStatus'
import { requestOpenConnect } from '../lib/walletEvents'
import { useWallet } from '../context/WalletContext'

export type ListTarget = {
  collection: string
  nonce: number
  name: string
  identifier: string
  imageUrl?: string
}

type Props = {
  target: ListTarget | null
  onClose: () => void
  onListed?: () => void
}

export default function ListNftSheet({ target, onClose, onListed }: Props) {
  const { connected, canAttemptSign } = useWallet()
  const { listNft, pending, error, lastTx, marketplaceLive } = useMarketplaceTx()
  const [price, setPrice] = useState('1')
  const [msg, setMsg] = useState<string | null>(null)
  const live = canListBuyNft() && marketplaceLive

  if (!target) return null

  const onSubmit = async () => {
    setMsg(null)
    const p = parseFloat(price)
    if (!(p > 0)) {
      setMsg('Prix invalide')
      return
    }
    if (!connected) {
      requestOpenConnect()
      return
    }
    if (!canAttemptSign) {
      setMsg('Reconnecte xPortal / Web Wallet pour signer')
      return
    }
    if (!live) {
      setMsg('Marketplace non live (CODEHASH)')
      return
    }
    try {
      await listNft({
        tokenId: target.collection,
        nonce: target.nonce,
        priceEgld: p,
      })
      setMsg('TX soumise — confirme dans le wallet')
      onListed?.()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Échec list')
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3">
      <button type="button" className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Fermer" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-violet-500/30 bg-[#12121a] p-5 space-y-4 shadow-2xl">
        <div className="flex gap-3">
          <div className="h-16 w-16 rounded-xl bg-black/40 overflow-hidden shrink-0">
            {target.imageUrl ? (
              <img src={target.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-2xl">🖼</div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-violet-300/80">Mettre en vente</p>
            <h3 className="font-bold text-white truncate">{target.name}</h3>
            <p className="text-[10px] mono text-zinc-500 truncate">{target.identifier}</p>
          </div>
        </div>

        <label className="block text-xs text-zinc-400">
          Prix (EGLD)
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={e => setPrice(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-white"
          />
        </label>

        {!live && (
          <p className="text-xs text-amber-200">Marketplace gated — secret CODEHASH requis.</p>
        )}

        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1 text-sm" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="btn-primary flex-1 text-sm"
            disabled={pending || !live}
            onClick={() => void onSubmit()}
          >
            {pending ? '…' : 'Signer listNft'}
          </button>
        </div>

        {(msg || error) && (
          <p className={`text-xs ${error ? 'text-rose-300' : 'text-emerald-300'}`}>{msg || error}</p>
        )}
        {lastTx && (
          <p className="text-[10px] mono text-zinc-500 break-all">TX {lastTx}</p>
        )}
      </div>
    </div>
  )
}
