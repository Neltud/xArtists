/**
 * Mes NFT (wallet) → clic « Mettre en vente » → ListNftSheet.
 * Miniatures via ImageWithFallback (pas de carré blanc).
 */
import { useMemo, useState } from 'react'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import ListNftSheet, { type ListTarget } from './ListNftSheet'
import { requestOpenConnect } from '../lib/walletEvents'
import { OWNED_GLOW } from '../lib/ownershipMap'
import { canListBuyNft } from '../config/scStatus'
import { ImageWithFallback } from './ui/ImageWithFallback'

export default function MyOwnedNftsPanel() {
  const { connected, address } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const [listTarget, setListTarget] = useState<ListTarget | null>(null)
  const live = canListBuyNft()

  const items = useMemo(() => account.nfts.slice(0, 48), [account.nfts])

  if (!connected) {
    return (
      <div className="card space-y-3">
        <h2 className="font-semibold">Mes NFT · mise en vente</h2>
        <p className="text-sm text-zinc-500">Connecte ton wallet pour lister tes actifs.</p>
        <button type="button" className="btn-primary text-sm min-h-[44px]" onClick={requestOpenConnect}>
          Connecter
        </button>
      </div>
    )
  }

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">Mes NFT</h2>
          <p className="text-[12px] text-zinc-500">
            Jusqu’à 48 actifs affichés · mise en vente {live ? 'SC live' : 'gates'}
          </p>
        </div>
      </div>

      {account.loading ? (
        <p className="text-sm text-zinc-500">Chargement des NFT…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun NFT détecté sur ce wallet.</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map(n => {
            const img = n.url || n.media?.[0]?.url
            return (
              <li
                key={n.identifier}
                className={`rounded-xl border border-white/10 overflow-hidden bg-black/40 ${OWNED_GLOW}`}
              >
                <div className="aspect-square bg-zinc-950">
                  <ImageWithFallback
                    src={img}
                    alt={n.name || n.identifier || 'NFT'}
                    className="h-full w-full object-cover"
                    wrapperClassName="h-full w-full"
                  />
                </div>
                <div className="p-2 space-y-1">
                  <p className="text-[11px] font-medium text-zinc-200 truncate">{n.name || n.identifier}</p>
                  <button
                    type="button"
                    className="btn-secondary text-[10px] w-full min-h-[36px]"
                    onClick={() =>
                      setListTarget({
                        identifier: n.identifier,
                        name: n.name,
                        imageUrl: img,
                        collection: n.collection,
                      })
                    }
                  >
                    Mettre en vente
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {listTarget ? (
        <ListNftSheet target={listTarget} onClose={() => setListTarget(null)} />
      ) : null}
    </div>
  )
}
