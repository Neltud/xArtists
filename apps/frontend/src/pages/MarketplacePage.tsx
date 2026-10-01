/**
 * Marketplace — list / buy NFT on-chain.
 * Phase 8: list flow + index refresh after TX.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { useMarketplaceTx } from '../hooks/useMarketplaceTx'
import { canListBuyNft, MARKETPLACE_ADDRESS } from '../config/scStatus'
import { requestOpenConnect } from '../lib/walletEvents'

type ListingRow = {
  listing_id?: number
  token?: string
  nonce?: number
  price?: string
  seller?: string
  active?: boolean
}

export default function MarketplacePage() {
  const { connected, address } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const nfts = (account.nfts || []).filter(n => n?.identifier)
  const live = canListBuyNft()
  const { listNft, buyNft, pending, error, lastTx } = useMarketplaceTx()
  const [params, setParams] = useSearchParams()
  const preselect = params.get('list')

  const [selected, setSelected] = useState<string | null>(preselect)
  const [price, setPrice] = useState('0.1')
  const [msg, setMsg] = useState<string | null>(null)
  const [listings, setListings] = useState<ListingRow[]>([])

  useEffect(() => {
    if (preselect && preselect !== selected) setSelected(preselect)
  }, [preselect]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let c = false
    ;(async () => {
      try {
        const base = import.meta.env.BASE_URL || '/'
        const urls = [
          `${base}data/marketplace_listings.json`,
          '/xArtists/data/marketplace_listings.json',
        ]
        for (const u of urls) {
          try {
            const r = await fetch(u, { cache: 'no-store' })
            if (!r.ok) continue
            const j = (await r.json()) as { listings?: ListingRow[] }
            if (!c) setListings((j.listings || []).filter(x => x && x.active !== false))
            return
          } catch {
            /* next */
          }
        }
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
    if (!nft?.identifier) {
      setMsg('NFT introuvable dans le wallet')
      return
    }
    const parts = selected.split('-')
    const nonce = Number(nft.nonce ?? parts[parts.length - 1] ?? 0)
    const tokenId = nft.collection || parts.slice(0, -1).join('-')
    if (!tokenId || !Number.isFinite(nonce)) {
      setMsg('Collection / nonce invalides')
      return
    }
    const priceEgld = Number(price)
    if (!(priceEgld > 0)) {
      setMsg('Prix invalide')
      return
    }
    setMsg(null)
    try {
      await listNft({ tokenId, nonce, priceEgld })
      setMsg('Listing envoyé — confirme dans xPortal')
      try {
        params.delete('list')
        setParams(params, { replace: true })
      } catch {
        /* */
      }
    } catch (e) {
      const m = e instanceof Error ? e.message : 'Échec listing'
      setMsg(m)
    }
  }, [selected, connected, nfts, price, listNft, params, setParams])

  return (
    <div className="animate-fade-in space-y-6 pb-16 max-w-2xl mx-auto">
      <header className="space-y-1">
        <p className="section-label">Marché NFT</p>
        <h1 className="section-title display text-2xl">Marketplace</h1>
        <p className="text-sm text-zinc-400">
          {live
            ? 'On-chain ouvert — list & buy via ton wallet'
            : 'Simulation — ouverture progressive des ventes on-chain'}
        </p>
        <p className="text-[11px] text-zinc-600 truncate">
          SC {MARKETPLACE_ADDRESS?.slice(0, 18) || '—'}…
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
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 px-3 py-2"
              >
                <span className="text-[12px] text-zinc-300 mono truncate">
                  #{l.listing_id ?? i} · {l.token}-{l.nonce}
                </span>
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  disabled={pending || !live}
                  onClick={async () => {
                    if (l.listing_id == null) return
                    const p = Number(l.price || 0) / 1e18
                    try {
                      await buyNft({ listingId: l.listing_id, priceEgld: p || 0.1 })
                      setMsg('Achat envoyé — confirme dans xPortal')
                    } catch (e) {
                      setMsg(e instanceof Error ? e.message : 'Échec buy')
                    }
                  }}
                >
                  Buy
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">Mettre en vente</h2>
        {!connected ? (
          <button type="button" className="btn-primary text-sm" onClick={requestOpenConnect}>
            Connecter wallet
          </button>
        ) : nfts.length === 0 ? (
          <p className="text-[13px] text-zinc-500">
            Aucun NFT dans le wallet.{' '}
            <Link to="/studio" className="text-cyan-400 underline">
              Studio
            </Link>
          </p>
        ) : (
          <>
            <select
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
              value={selected || ''}
              onChange={e => setSelected(e.target.value || null)}
            >
              <option value="">Choisir un NFT…</option>
              {nfts.map(n => (
                <option key={n.identifier} value={n.identifier}>
                  {n.name || n.identifier}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2 items-center">
              <label className="text-[12px] text-zinc-500">Prix EGLD</label>
              <input
                type="number"
                min="0.001"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-28 rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-white"
              />
              <button
                type="button"
                className="btn-primary text-sm"
                disabled={pending || !selected || !live}
                onClick={() => void onList()}
              >
                {pending ? 'Signature…' : 'List NFT'}
              </button>
            </div>
            {!live && (
              <p className="text-[11px] text-amber-200/80">
                Marketplace SC pas encore LIVE (codehash / secret).
              </p>
            )}
          </>
        )}
        {(msg || error) && (
          <p className="text-[12px] text-amber-200/90">{msg || error}</p>
        )}
        {lastTx && (
          <a
            href={`https://explorer.multiversx.com/transactions/${lastTx}`}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-cyan-400 underline"
          >
            Voir TX →
          </a>
        )}
      </section>
    </div>
  )
}
