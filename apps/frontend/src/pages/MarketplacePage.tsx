/**
 * Marketplace — vitrine + multi-list + post-buy index overlay.
 * All dynamic children forced to string (React #31 guard).
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
import { asText } from '../lib/safeRender'

const PAGE = 16

function priceEgldOf(l: ListingRow): number {
  if (l.price_egld && Number(l.price_egld) > 0) return Number(l.price_egld)
  const raw = Number(l.price || 0)
  if (raw > 1e12) return raw / 1e18
  return Number.isFinite(raw) ? raw : 0
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

/** Drop non-scalar fields that crash React if rendered. */
function sanitizeListing(raw: ListingRow): ListingRow | null {
  if (!raw || typeof raw !== 'object') return null
  const name = typeof raw.name === 'string' ? raw.name : undefined
  const token = typeof raw.token === 'string' ? raw.token : typeof raw.token_id === 'string' ? raw.token_id : undefined
  const identifier = typeof raw.identifier === 'string' ? raw.identifier : undefined
  const listing_id =
    typeof raw.listing_id === 'number'
      ? raw.listing_id
      : typeof raw.listing_id === 'string'
        ? Number(raw.listing_id)
        : undefined
  const price = raw.price != null ? String(raw.price) : undefined
  const price_egld = raw.price_egld != null ? String(raw.price_egld) : undefined
  const thumb = typeof raw.thumb === 'string' ? raw.thumb : undefined
  const url = typeof raw.url === 'string' ? raw.url : undefined
  return {
    ...raw,
    name,
    token,
    identifier,
    listing_id: Number.isFinite(listing_id as number) ? (listing_id as number) : undefined,
    price,
    price_egld,
    thumb,
    url,
    seller: typeof raw.seller === 'string' ? raw.seller : undefined,
  }
}

export default function MarketplacePage() {
  const { connected, address, method } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const allNfts = useMemo(
    () => (account.nfts || []).filter(n => n?.identifier && typeof n.identifier === 'string'),
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
    fetchMarketplaceListings()
      .then(rows => {
        const clean = rows.map(sanitizeListing).filter(Boolean) as ListingRow[]
        setListings(clean)
      })
      .catch(() => setListings([]))
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
      `${asText(l.name)} ${asText(l.token)} ${asText(l.identifier)}`.toLowerCase().includes(s),
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
    if (!connected) return requestOpenConnect()
    const priceEgld = Number(price)
    if (!(priceEgld > 0) || selected.size === 0) {
      setMsg('Prix > 0 et au moins un NFT')
      return
    }
    let ok = 0
    let fail = 0
    for (const id of selected) {
      const n = allNfts.find(x => x.identifier === id)
      if (!n) {
        fail++
        continue
      }
      const tokenId = n.collection || id.split('-').slice(0, -1).join('-')
      const nonce = n.nonce
      try {
        await listNft({ tokenId, nonce, priceEgld })
        rememberLocalListing({
          listing_id: Date.now() % 100000,
          token: tokenId,
          identifier: id,
          name: typeof n.name === 'string' ? n.name : id,
          price_egld: String(priceEgld),
          price: String(Math.round(priceEgld * 1e18)),
          seller: address || undefined,
          active: true,
          thumb: nftThumb(n),
        })
        ok++
      } catch {
        fail++
        break
      }
    }
    setMsg(
      fail
        ? `${ok} listé(s), ${fail} stoppé — signe chaque TX (session xPortal)`
        : `${ok} listing(s) envoyés`,
    )
    reload()
  }, [connected, method, price, selected, allNfts, listNft, address, reload])

  const errText = error != null ? asText(error) : null
  const msgText = msg != null ? asText(msg) : null

  return (
    <div className="animate-fade-in space-y-8 pb-16 max-w-3xl mx-auto">
      <header className="space-y-2">
        <p className="section-label">Marché NFT · mainnet</p>
        <h1 className="section-title display text-2xl">Marketplace</h1>
        <p className="text-sm text-zinc-400">
          Vitrine on-chain. Multi-list = une signature par pièce (session xPortal conservée).
        </p>
        {!live && (
          <p className="text-[12px] text-amber-200/90">
            List / buy en ouverture — vérif codehash / actualise après deploy.
          </p>
        )}
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
            Aucun listing actif — liste depuis ton inventaire ci-dessous.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((l, i) => {
              const p = priceEgldOf(l)
              const img = typeof l.thumb === 'string' ? l.thumb : typeof l.url === 'string' ? l.url : undefined
              const title = asText(l.name || l.identifier || l.token, 'NFT')
              return (
                <article
                  key={String(l.listing_id ?? l.identifier ?? i)}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
                >
                  {img ? (
                    <img src={img} alt="" className="w-full aspect-square object-cover bg-zinc-900" loading="lazy" />
                  ) : (
                    <div className="w-full aspect-square bg-zinc-900" />
                  )}
                  <div className="p-2.5 space-y-1.5">
                    <p className="text-[13px] text-white truncate">{title}</p>
                    <p className="text-sm text-cyan-200 tabular-nums">{asText(p)} EGLD</p>
                    <button
                      type="button"
                      className="btn-primary text-xs w-full"
                      disabled={pending || !live || l.listing_id == null}
                      onClick={async () => {
                        if (!connected) return requestOpenConnect()
                        if (l.listing_id == null) return
                        try {
                          const res = await buyNft({ listingId: Number(l.listing_id), priceEgld: p })
                          markListingSold(Number(l.listing_id), res?.sessionId || undefined)
                          reload()
                          push('Achat envoyé — vitrine mise à jour', 'ok')
                        } catch (e) {
                          push(e instanceof Error ? e.message : asText(e, 'Échec'), 'err')
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
        <h2 className="text-sm font-semibold text-white">Vendre</h2>
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
                const id = String(n.identifier)
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
                      <img
                        src={thumb}
                        alt=""
                        loading="lazy"
                        className="w-full aspect-square object-cover rounded-lg bg-zinc-900"
                      />
                    ) : (
                      <div className="w-full aspect-square rounded-lg bg-zinc-900" />
                    )}
                    <p className="text-[10px] text-zinc-300 truncate mt-1">
                      {asText(n.name || id)}
                    </p>
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
                min={0.001}
                step={0.01}
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
        {(msgText || errText) && (
          <p className="text-[12px] text-amber-200/90 break-words">{msgText || errText}</p>
        )}
        <Link to="/studio" className="text-[12px] text-cyan-400 underline">
          Studio →
        </Link>
      </section>
    </div>
  )
}
