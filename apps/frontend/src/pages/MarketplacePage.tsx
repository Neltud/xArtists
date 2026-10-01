/**
 * Marketplace Frameit-style — vitrine listings + vente multi-NFT (TX séquentielles).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { useMarketplaceTx } from '../hooks/useMarketplaceTx'
import { canListBuyNft } from '../config/scStatus'
import { requestOpenConnect } from '../lib/walletEvents'
import { useToast } from '../components/ui/Toast'
import type { ListingRow } from '../types/marketplace'

const PAGE = 16

function priceEgldOf(l: ListingRow): number {
  if (l.price_egld && Number(l.price_egld) > 0) return Number(l.price_egld)
  const raw = Number(l.price || 0)
  if (raw > 1e12) return raw / 1e18
  return raw
}

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

async function loadListings(): Promise<ListingRow[]> {
  const base = import.meta.env.BASE_URL || '/'
  const urls = [
    `${base}data/marketplace_listings.json`,
    `${base}data/listings_index.json`,
    '/xArtists/data/marketplace_listings.json',
    '/xArtists/data/listings_index.json',
  ]
  for (const u of urls) {
    try {
      const r = await fetch(u, { cache: 'no-store' })
      if (!r.ok) continue
      const j = (await r.json()) as { listings?: ListingRow[] }
      const rows = (j.listings || []).filter(x => x && x.active !== false)
      if (rows.length) return rows
    } catch {
      /* next */
    }
  }
  return []
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
  const { push } = useToast()
  const [params] = useSearchParams()
  const preselect = params.get('list')

  const [listings, setListings] = useState<ListingRow[]>([])
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Set<string>>(() => new Set(preselect ? [preselect] : []))
  const [price, setPrice] = useState('0.25')
  const [visible, setVisible] = useState(PAGE)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (preselect) setSelected(new Set([preselect]))
  }, [preselect])

  useEffect(() => {
    let c = false
    loadListings().then(rows => {
      if (!c) setListings(rows)
    })
    return () => {
      c = true
    }
  }, [lastTx])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return listings
    return listings.filter(l =>
      `${l.name || ''} ${l.token || ''} ${l.identifier || ''}`.toLowerCase().includes(s),
    )
  }, [listings, q])

  const shownInv = allNfts.slice(0, visible)

  const toggle = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const onListMany = useCallback(async () => {
    if (!connected) {
      requestOpenConnect()
      return
    }
    if (method === 'paste_readonly') {
      push('Lecture seule — xPortal requis', 'err')
      return
    }
    const priceEgld = Number(price)
    if (!(priceEgld > 0) || selected.size === 0) {
      push('Sélectionne au moins un NFT et un prix', 'err')
      return
    }
    let ok = 0
    let fail = 0
    for (const id of selected) {
      const nft = allNfts.find(n => n.identifier === id)
      if (!nft?.identifier) {
        fail += 1
        continue
      }
      const parts = id.split('-')
      const nonce = Number(nft.nonce ?? parts[parts.length - 1] ?? 0)
      const tokenId = nft.collection || parts.slice(0, -1).join('-')
      try {
        await listNft({ tokenId, nonce, priceEgld })
        ok += 1
      } catch {
        fail += 1
        break
      }
    }
    const t = fail ? `${ok} listé(s), ${fail} stoppé — signe chaque TX` : `${ok} listing(s) envoyés`
    setMsg(t)
    push(t, fail ? 'err' : 'ok')
  }, [connected, method, price, selected, allNfts, listNft, push])

  return (
    <div className="animate-fade-in space-y-8 pb-16 max-w-3xl mx-auto">
      <header className="space-y-2">
        <p className="section-label">Marché NFT · mainnet</p>
        <h1 className="section-title display text-2xl">Marketplace</h1>
        <p className="text-sm text-zinc-400">
          Vitrine on-chain. Achète une œuvre ou mets plusieurs NFT en vente (une signature par pièce).
        </p>
      </header>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">En vitrine ({filtered.length})</h2>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Filtrer nom / collection"
            className="w-44 rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-[12px] text-white"
          />
        </div>
        {filtered.length === 0 ? (
          <p className="text-[13px] text-zinc-500 card">Catalogue en chargement — hard refresh si vide.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((l, i) => {
              const p = priceEgldOf(l)
              const img = l.thumb || l.url
              return (
                <article
                  key={l.listing_id ?? i}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
                >
                  {img ? (
                    <img src={img} alt="" className="w-full aspect-square object-cover bg-zinc-900" loading="lazy" />
                  ) : (
                    <div className="w-full aspect-square bg-zinc-900" />
                  )}
                  <div className="p-2.5 space-y-1.5">
                    <p className="text-[13px] text-white truncate">{l.name || l.identifier || l.token}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{l.token}-{l.nonce}</p>
                    <p className="text-sm text-cyan-200 tabular-nums">{p} EGLD</p>
                    <button
                      type="button"
                      className="btn-primary text-xs w-full"
                      disabled={pending || !live || l.listing_id == null}
                      onClick={async () => {
                        if (!connected) return requestOpenConnect()
                        if (l.listing_id == null) return
                        try {
                          await buyNft({ listingId: l.listing_id, priceEgld: p })
                          push('Achat envoyé — signe dans xPortal', 'ok')
                        } catch (e) {
                          push(e instanceof Error ? e.message : 'Échec', 'err')
                        }
                      }}
                    >
                      {pending ? 'Signature…' : 'Buy'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">Vendre — multi sélection</h2>
        <p className="text-[12px] text-zinc-500">
          Coche plusieurs NFT, un prix commun. MultiversX = une TX list par pièce (comme Frameit).
        </p>
        {!connected ? (
          <button type="button" className="btn-primary text-sm" onClick={requestOpenConnect}>
            Connecter wallet
          </button>
        ) : account.loading ? (
          <p className="text-[13px] text-zinc-500">Chargement inventaire…</p>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {shownInv.map(n => {
                const id = n.identifier as string
                const on = selected.has(id)
                const thumb = nftThumb(n)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
                    className={`rounded-xl border p-1.5 text-left ${
                      on ? 'border-violet-400/50 bg-violet-500/10' : 'border-white/10'
                    }`}
                  >
                    {thumb ? (
                      <img src={thumb} alt="" loading="lazy" className="w-full aspect-square object-cover rounded-lg bg-zinc-900" />
                    ) : (
                      <div className="w-full aspect-square rounded-lg bg-zinc-900" />
                    )}
                    <p className="text-[10px] text-zinc-300 truncate mt-1">{n.name || id}</p>
                  </button>
                )
              })}
            </div>
            {visible < allNfts.length && (
              <button type="button" className="btn-secondary text-xs" onClick={() => setVisible(v => v + PAGE)}>
                Voir plus
              </button>
            )}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[12px] text-zinc-500">{selected.size} sélectionné(s)</span>
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
                disabled={pending || !live || selected.size === 0}
                onClick={() => void onListMany()}
              >
                {pending ? 'Signature…' : `List ${selected.size || ''}`}
              </button>
            </div>
          </>
        )}
        {(msg || error) && <p className="text-[12px] text-amber-200/90">{msg || error}</p>}
        <Link to="/studio" className="text-[12px] text-cyan-400 underline">
          Studio →
        </Link>
      </section>
    </div>
  )
}
