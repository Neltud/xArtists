/**
 * Mes NFT (wallet) → « Mettre en vente » → ListNftSheet.
 * Miniatures via ImageWithFallback (pas de carré blanc si média offline).
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
    <>
      <div className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">Mes NFT · mise en vente</h2>
            <p className="text-[11px] text-zinc-500">
              {account.loading
                ? 'Chargement…'
                : `${account.nftCount ?? items.length} actif(s) · affichage max. 48`}
            </p>
          </div>
        </div>

        {account.loading && items.length === 0 ? (
          <p className="text-sm text-zinc-500">Chargement des NFT…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucun NFT détecté sur ce wallet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map(n => {
              const img = n.url || n.media?.[0]?.url
              const nonce =
                typeof n.nonce === 'number'
                  ? n.nonce
                  : Number(String(n.identifier || '').split('-').pop()) || 0
              return (
                <div
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
                  <div className="p-2 space-y-1.5">
                    <p className="text-xs font-semibold text-white truncate">
                      {n.name || n.identifier}
                    </p>
                    <p className="text-[9px] mono text-zinc-500 truncate">{n.collection}</p>
                    <button
                      type="button"
                      className="btn-primary w-full text-[11px] py-1.5 min-h-[36px]"
                      disabled={!live}
                      onClick={() =>
                        setListTarget({
                          collection: n.collection || '',
                          nonce,
                          name: n.name || n.identifier,
                          identifier: n.identifier,
                          imageUrl: img,
                        })
                      }
                    >
                      Mettre en vente
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!live && (
          <p className="text-[11px] text-amber-200">
            Listing gated — marketplace SC / codehash Pages.
          </p>
        )}
      </div>

      <ListNftSheet
        target={listTarget}
        onClose={() => setListTarget(null)}
        onListed={() => account.refresh()}
      />
    </>
  )
}
