/**
 * Marketplace — grille NFT progressive + list on-chain.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { useMarketplaceTx } from '../hooks/useMarketplaceTx'
import { canListBuyNft } from '../config/scStatus'
import { requestOpenConnect } from '../lib/walletEvents'

type ListingRow = {
  listing_id?: number
  token?: string
  nonce?: number
  price?: string
  seller?: string
  active?: boolean
}

const PAGE = 12

function nftThumb(n: {
  url?: string
  media?: { thumbnailUrl?: string; url?: string }[]
}): string | undefined {
  if (n.url && /^https?:\/\//i.test(n.url)) return n.url
  const m = n.media?.[0]
  if (m?.thumbnailUrl && /^https?:\/\//i.test(m.thumbnailUrl)) return m.thumbnailUrl
  if (m?.url && /^https?:\/\//i.test(m.url)) return m.url
  return undefined
}

export default function MarketplacePage() {
  const { connected, address, method } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const allNfts = useMemo(
    () => (account.nfts || []).filter(n => n?.identifier),
    [account.nfts],
  )
  const live = canListBuyNft()
  const { listNft, buyNft, pending, error, lastTx } = useMarketplaceTx()
  const [params, setParams] = useSearchParams()
  const preselect = params.get('list')

  const [selected, setSelected] = useState<string | null>(preselect)
  const [price, setPrice] = useState('0.1')
  const [msg, setMsg] = useState<string | null>(null)
  const [listings, setListings] = useState<ListingRow[]>([])
  const [visible, setVisible] = useState(PAGE)

  useEffect(() => {
    if (preselect) setSelected(preselect)
  }, [preselect])

  useEffect(() => {
    let c = false
    ;(async () => {
      try {
        const base = import.meta.env.BASE_URL || '/'
        for (const u of [`${base}data/marketplace_listings.json`, '/xArtists/data/marketplace_listings.json']) {
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

  const shown = allNfts.slice(0, visible)

  const onList = useCallback(async () => {
    if (!selected || !connected) {
      requestOpenConnect()
      return
    }
    if (method === 'paste_readonly') {
      setMsg('Lecture seule — reconnecte via xPortal pour signer.')
      return
    }
    const nft = allNfts.find(n => n.identifier === selected)
    if (!nft?.identifier) {
      setMsg('NFT introuvable')
      return
    }
    const parts = selected.split('-')
    const nonce = Number(nft.nonce ?? parts[parts.length - 1] ?? 0)
    const tokenId = nft.collection || parts.slice(0, -1).join('-')
    const priceEgld = Number(price)
    if (!tokenId || !(priceEgld > 0)) {
      setMsg('Prix ou collection invalide')
      return
    }
    setMsg(null)
    try {
      await listNft({ tokenId, nonce, priceEgld })
      setMsg('Listing envoyé — confirme dans xPortal')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Échec listing')
    }
  }, [selected, connected, method, allNfts, price, listNft])

  return (
    <div className="animate-fade-in space-y-6 pb-16 max-w-2xl mx-auto">
      <header className="space-y-1">
        <p className="section-label">Marché NFT</p>
        <h1 className="section-title display text-2xl">Marketplace</h1>
        <p className="text-sm text-zinc-400">
          {live ? 'List & buy via ton wallet' : 'Ouverture progressive des ventes'}
        </p>
      </header>

      <div className="flex flex-wrap gap-2 text-[12px]">
        <Link to="/studio" className="text-cyan-400 hover:underline">
          Studio →
        </Link>
        <Link to="/museum" className="text-cyan-400 hover:underline">
          Musée →
        </Link>
      </div>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">Annonces</h2>
        {listings.length === 0 ? (
          <p className="text-[13px] text-zinc-500">
            Aucune annonce active. Après un premier listing signé, l’index se remplira.
          </p>
        ) : (
          <ul className="space-y-2">
            {listings.map((l, i) => (
              <li
                key={l.listing_id ?? i}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 px-3 py-2"
              >
                <span className="text-[12px] text-zinc-300 truncate">
                  #{l.listing_id ?? i} · {l.token}-{l.nonce}
                </span>
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  disabled={pending || !live}
                  onClick={async () => {
                    if (l.listing_id == null) return
                    try {
                      await buyNft({
                        listingId: l.listing_id,
                        priceEgld: Number(l.price || 0) / 1e18 || 0.1,
                      })
                      setMsg('Achat envoyé')
                    } catch (e) {
                      setMsg(e instanceof Error ? e.message : 'Échec')
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
        ) : account.loading ? (
          <p className="text-[13px] text-zinc-500">Chargement des NFT…</p>
        ) : allNfts.length === 0 ? (
          <p className="text-[13px] text-zinc-500">
            Aucun NFT détecté.{' '}
            <Link to="/studio" className="text-cyan-400 underline">
              Studio
            </Link>
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {shown.map(n => {
                const id = n.identifier as string
                const on = selected === id
                const thumb = nftThumb(n)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelected(id)}
                    className={`rounded-xl border p-1.5 text-left transition ${
                      on
                        ? 'border-violet-400/50 bg-violet-500/10'
                        : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                    }`}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        loading="lazy"
                        className="w-full aspect-square object-cover rounded-lg bg-zinc-900"
                      />
                    ) : (
                      <div className="w-full aspect-square rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-600 text-xs">
                        NFT
                      </div>
                    )}
                    <p className="text-[10px] text-zinc-300 truncate mt-1">{n.name || id}</p>
                  </button>
                )
              })}
            </div>
            {visible < allNfts.length && (
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => setVisible(v => v + PAGE)}
              >
                Voir plus ({allNfts.length - visible} restants)
              </button>
            )}
            <div className="flex flex-wrap gap-2 items-center pt-1">
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
            {selected && (
              <p className="text-[11px] text-zinc-600 truncate mono">{selected}</p>
            )}
            {!live && (
              <p className="text-[11px] text-amber-200/80">Ventes on-chain bientôt disponibles.</p>
            )}
          </>
        )}
        {(msg || error) && <p className="text-[12px] text-amber-200/90">{msg || error}</p>}
        {lastTx && lastTx !== 'wallet-hook' && (
          <a
            href={`https://explorer.multiversx.com/transactions/${lastTx}`}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-cyan-400 underline"
          >
            Voir transaction →
          </a>
        )}
      </section>
    </div>
  )
}
