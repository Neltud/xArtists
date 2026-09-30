/**
 * Mes NFT (wallet) → clic « Mettre en vente » → ListNftSheet.
 */
import { useMemo, useState } from 'react'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import ListNftSheet, { type ListTarget } from './ListNftSheet'
import { requestOpenConnect } from '../lib/walletEvents'
import { OWNED_GLOW } from '../lib/ownershipMap'
import { canListBuyNft } from '../config/scStatus'

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
        <button type="button" className="btn-primary text-sm" onClick={requestOpenConnect}>
          Connect
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
              {account.loading ? 'Chargement…' : `${account.nftCount} NFT`} · list → SC marketplace
            </p>
          </div>
          <button type="button" className="btn-secondary text-xs" onClick={() => account.refresh()}>
            Refresh
          </button>
        </div>

        {items.length === 0 && !account.loading && (
          <p className="text-sm text-zinc-500">Aucun NFT sur ce wallet — mint Studio ou achète.</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map(n => {
            const img = n.url || n.media?.[0]?.url
            return (
              <div
                key={n.identifier}
                className={`rounded-xl border bg-black/30 overflow-hidden ${OWNED_GLOW.border} ${OWNED_GLOW.ring}`}
                style={{ boxShadow: OWNED_GLOW.shadow }}
              >
                <div className="aspect-square bg-[#0a0a0f]">
                  {img ? (
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-3xl">🎨</div>
                  )}
                </div>
                <div className="p-2 space-y-1.5">
                  <p className="text-xs font-semibold text-white truncate">{n.name || n.identifier}</p>
                  <p className="text-[9px] mono text-zinc-500 truncate">{n.collection}</p>
                  <button
                    type="button"
                    className="btn-primary w-full text-[11px] py-1.5"
                    disabled={!live}
                    onClick={() =>
                      setListTarget({
                        collection: n.collection,
                        nonce: n.nonce,
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

        {!live && (
          <p className="text-[11px] text-amber-200">
            List gated — VITE_MARKETPLACE_CODEHASH_OK sur Pages.
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
