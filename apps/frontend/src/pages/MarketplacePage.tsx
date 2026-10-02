/**
 * Marketplace — vitrine + multi-list + post-buy index overlay.
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
import {
  fetchMarketplaceListings,
  markListingSold,
  rememberLocalListing,
} from '../lib/marketplaceIndex'

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

  const reload = useCallback(() => {
    fetchMarketplaceListings().then(setListings)
  }, [])

  useEffect(() => {
    if (preselect) setSelected(new Set([preselect]))
  }, [preselect])

  useEffect(() => {
    reload()
  }, [reload, lastTx])

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
      push('Lecture seule \u2014 xPortal requis', 'err')
      return
    }
    const priceEgld = Number(price)
    if (!(priceEgld > 0) || selected.size === 0) {
      push('S\u00e9lectionne au moins un NFT et un prix', 'err')
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
        rememberLocalListing({
          listing_id: Date.now() % 100000,
          identifier: id,
          token: tokenId,
          nonce,
          name: String(nft.name || id),
          price_egld: String(priceEgld),
          price: String(Math.round(priceEgld * 1e18)),
          active: true,
          seller: address || undefined,
        })
        ok += 1
      } catch {
        fail += 1
        break
      }
    }
    reload()
    const t = fail
      ? `${ok} list\u00e9(s), ${fail} stopp\u00e9 \u2014 signe chaque TX (session xPortal)`
      : `${ok} listing(s) envoy\u00e9s`
    setMsg(t)
    push(t, fail ? 'err' : 'ok')
  }, [connected, method, price, selected, allNfts, listNft, push, address, reload])

  return (
    <div className="animate-fade-in space-y-8 pb-16 max-w-3xl mx-auto">
      <header className="space-y-2">
        <p className="section-label">March\u00e9 NFT \u00b7 mainnet</p>
        <h1 className="section-title display text-2xl">Marketplace</h1>
        <p className="text-sm text-zinc-400">
          Vitrine on-chain. Multi-list = une signature par pi\u00e8ce (session xPortal conserv\u00e9e).
        </p>
      </header>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">En vitrine ({filtered.length})</h2>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Filtrer"
            className="w-40 rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-[12px] text-white"
          />
        </div>
        {filtered.length === 0 ? (
          <p className="text-[13px] text-zinc-500 card">
            Aucun listing actif \u2014 liste depuis ton inventaire ci-dessous.
          </p>
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
                    <p className="text-sm text-cyan-200 tabular-nums">{p} EGLD</p>
                    <button
                      type="button"
                      className="btn-primary text-xs w-full"
                      disabled={pending || !live || l.listing_id == null}
                      onClick={async () => {
                        if (!connected) return requestOpenConnect()
                        if (l.listing_id == null) return
                        try {
                          const res = await buyNft({ listingId: l.listing_id, priceEgld: p })
                          markListingSold(l.listing_id, res?.sessionId || undefined)
                          reload()
                          push('Achat envoy\u00e9 \u2014 vitrine mise \u00e0 jour', 'ok')
                        } catch (e) {
                          push(e instanceof Error ? e.message : '\u00c9chec', 'err')
                        }
                      }}
                    >
                      {pending ? 'Signature\u2026' : 'Buy'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">Vendre</h2>
        {!connected ? (
          <button type="button" className="btn-primary text-sm" onClick={requestOpenConnect}>
            Connecter wallet
          </button>
        ) : account.loading ? (
          <p className="text-[13px] text-zinc-500">Chargement inventaire\u2026</p>
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
              <span className="text-[12px] text-zinc-500">{selected.size} s\u00e9lectionn\u00e9(s)</span>
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
                {pending ? 'Signature\u2026' : `List ${selected.size || ''}`}
              </button>
            </div>
          </>
        )}
        {(msg || error) && <p className="text-[12px] text-amber-200/90">{msg || error}</p>}
        <Link to="/studio" className="text-[12px] text-cyan-400 underline">
          Studio \u2192
        </Link>
      </section>
    </div>
  )
}
