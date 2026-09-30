/**
 * NFT Marketplace — list / buy (SC) + catalogue listings_index.
 * Analyse F&G reste sur /market.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { requestOpenConnect } from '../lib/walletEvents'
import { useMarketplaceTx } from '../hooks/useMarketplaceTx'
import { canListBuyNft, MARKETPLACE_ADDRESS } from '../config/scStatus'
import { nftImageUrl, type NFT } from '../types/nft'

type ListingRow = {
  listing_id?: number
  token_id?: string
  nonce?: number
  price_egld?: string
  seller?: string
  active?: boolean
}

export default function MarketplacePage() {
  const live = canListBuyNft()
  const { connected, address } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const nfts = (account.nfts || []) as NFT[]
  const { listNft, buyNft, pending, error, lastTx } = useMarketplaceTx()
  const [listings, setListings] = useState<ListingRow[]>([])
  const [price, setPrice] = useState('1')
  const [selected, setSelected] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      try {
        const base = import.meta.env.BASE_URL || '/'
        const r = await fetch(`${base}data/listings_index.json`, { cache: 'no-store' })
        if (!r.ok) return
        const j = (await r.json()) as { listings?: ListingRow[] }
        if (!c) setListings((j.listings || []).filter(x => x.active !== false))
      } catch {
        /* */
      }
    })()
    return () => {
      c = true
    }
  }, [lastTx])

  const onList = useCallback(async () => {
    if (!selected || !connected) {
      requestOpenConnect()
      return
    }
    const nft = nfts.find(n => n.identifier === selected)
    if (!nft) return
    const parts = selected.split('-')
    const nonce = Number(nft.nonce ?? parts[parts.length - 1] ?? 0)
    const tokenId = nft.collection || parts.slice(0, -1).join('-')
    const priceEgld = Number(price)
    if (!(priceEgld > 0)) {
      setMsg('Prix invalide')
      return
    }
    setMsg(null)
    try {
      await listNft({ tokenId, nonce, priceEgld })
      setMsg('Listing envoyé — signature wallet')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Échec listing')
    }
  }, [selected, connected, nfts, price, listNft])

  return (
    <div className="animate-fade-in space-y-6 pb-16 max-w-2xl mx-auto">
      <header className="space-y-1">
        <p className="section-label">Marché NFT</p>
        <h1 className="section-title display text-2xl">Marketplace</h1>
        <p className="text-sm text-zinc-400">
          {live
            ? 'On-chain ouvert — list & buy via votre wallet'
            : 'Simulation — ouverture progressive des ventes on-chain'}
        </p>
        <p className="text-[11px] text-zinc-600 truncate">
          SC {MARKETPLACE_ADDRESS.slice(0, 18)}…
        </p>
      </header>

      <div className="flex flex-wrap gap-2 text-[12px]">
        <Link to="/market" className="text-cyan-400 hover:underline">
          Analyse F&G / TRO →
        </Link>
        <Link to="/museum" className="text-cyan-400 hover:underline">
          Musée →
        </Link>
        <Link to="/studio" className="text-cyan-400 hover:underline">
          Studio →
        </Link>
      </div>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">Annonces on-chain</h2>
        {listings.length === 0 ? (
          <p className="text-[13px] text-zinc-500">
            Aucune annonce active pour l’instant. Après un premier listing signé, l’index se
            remplira.
          </p>
        ) : (
          <ul className="space-y-2">
            {listings.map((l, i) => (
              <li
                key={l.listing_id ?? i}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 px-3 py-2 text-[13px]"
              >
                <span className="text-zinc-300">
                  {l.token_id}-{l.nonce} · {l.price_egld} EGLD
                </span>
                {live && (
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    disabled={pending}
                    onClick={() =>
                      void buyNft({
                        listingId: Number(l.listing_id),
                        priceEgld: Number(l.price_egld),
                      })
                    }
                  >
                    Acheter
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">Mettre en vente</h2>
        {!connected ? (
          <button type="button" className="btn-primary text-sm" onClick={() => requestOpenConnect()}>
            Connecter wallet
          </button>
        ) : nfts.length === 0 ? (
          <p className="text-[13px] text-zinc-500">Aucun NFT détecté sur cette adresse.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {nfts.slice(0, 24).map(n => {
                const id = n.identifier
                const img = nftImageUrl(n)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelected(id)}
                    className={`rounded-lg border overflow-hidden text-left ${
                      selected === id ? 'border-violet-400' : 'border-white/10'
                    }`}
                  >
                    {img ? (
                      <img src={img} alt="" className="w-full aspect-square object-cover" />
                    ) : (
                      <div className="aspect-square bg-zinc-900" />
                    )}
                    <p className="text-[9px] truncate px-1 py-0.5 text-zinc-400">{n.name || id}</p>
                  </button>
                )
              })}
            </div>
            <label className="block text-[12px] text-zinc-400">
              Prix EGLD
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
                value={price}
                onChange={e => setPrice(e.target.value)}
                inputMode="decimal"
              />
            </label>
            <button
              type="button"
              className="btn-primary text-sm"
              disabled={pending || !selected || !live}
              onClick={() => void onList()}
            >
              {live ? (pending ? 'Signature…' : 'Lister on-chain') : 'Bientôt disponible'}
            </button>
          </>
        )}
        {(msg || error) && (
          <p className="text-[12px] text-amber-200/90">{msg || error}</p>
        )}
        {lastTx && (
          <a
            className="text-[11px] text-cyan-400 hover:underline break-all"
            href={`https://explorer.multiversx.com/transactions/${lastTx}`}
            target="_blank"
            rel="noreferrer"
          >
            TX {lastTx.slice(0, 16)}…
          </a>
        )}
      </section>
    </div>
  )
}
