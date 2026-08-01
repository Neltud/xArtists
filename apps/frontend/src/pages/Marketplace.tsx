import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import NFTDetailModal from '../components/NFTDetailModal'
import MoonpayButton from '../components/MoonpayButton'
import { useMarketplaceTx } from '../hooks/useMarketplaceTx'
import {
  type NFT,
  type CollectionData,
  type CollectionsFile,
  nftImageUrl,
  nftRoyalties,
  typeLabel,
  nonceLabel,
  DATA_URL,
} from '../types/nft'

const MVX_API = 'https://api.multiversx.com'

type SortKey = 'name' | 'collection' | 'nonce'
type PriceFilter = 'all' | 'under1' | '1to5' | '5plus'
type AssetTypeFilter = 'all' | 'NFT' | 'SFT'

export default function Marketplace() {
  const [collections, setCollections] = useState<CollectionData[]>([])
  const [allNfts, setAllNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const [searchParams] = useSearchParams()
  const initialCol = searchParams.get('collection') ?? 'all'
  const [activeCollection, setActiveCollection] = useState<string>(
    initialCol !== 'all' ? initialCol : 'all',
  )
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('collection')
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all')
  const [typeFilter, setTypeFilter] = useState<AssetTypeFilter>('all')
  const [selected, setSelected] = useState<NFT | null>(null)
  const { marketplaceAddress } = useMarketplaceTx()
  const marketplaceReady = marketplaceAddress.startsWith('erd1')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(DATA_URL, { cache: 'force-cache' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: CollectionsFile = await res.json()
        if (cancelled) return
        const nfts = data.collections.flatMap((c) => c.nfts)
        setCollections(data.collections)
        setAllNfts(nfts)
        setLastUpdated(data.timestamp || new Date().toISOString())
      } catch (err) {
        console.warn('[Marketplace] bundled data fetch failed', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const refreshLive = useCallback(async () => {
    setRefreshing(true)
    try {
      const target =
        activeCollection === 'all'
          ? collections.map((c) => c.identifier)
          : [activeCollection]
      const fetched: NFT[] = []
      for (const colId of target) {
        try {
          const res = await fetch(`${MVX_API}/collections/${colId}/nfts?size=50`)
          if (!res.ok) continue
          const rows: any[] = await res.json()
          for (const r of rows) {
            fetched.push({
              collection: r.collection,
              collection_name: r.collectionName ?? colId,
              nonce: r.nonce,
              name: r.name ?? r.identifier,
              identifier: r.identifier,
              url: r.url,
              media: r.media,
              metadata: r.metadata,
              creator: r.creator,
              owner: r.owner,
              type: r.type,
              royalties: r.royalties,
            })
          }
        } catch {
          /* ignore */
        }
      }
      if (fetched.length) {
        if (activeCollection === 'all') {
          setAllNfts(fetched)
        } else {
          setAllNfts((prev) => {
            const rest = prev.filter((n) => n.collection !== activeCollection)
            return [...rest, ...fetched]
          })
        }
        setLastUpdated(new Date().toISOString())
      }
    } finally {
      setRefreshing(false)
    }
  }, [activeCollection, collections])

  const collectionPills = useMemo(() => {
    const counts = new Map<string, number>()
    for (const n of allNfts) {
      counts.set(n.collection, (counts.get(n.collection) ?? 0) + 1)
    }
    const byId = new Map(collections.map((c) => [c.identifier, c.name]))
    const out = [...counts.entries()].map(([id, count]) => ({
      id,
      name: byId.get(id) ?? id.split('-')[0],
      count,
    }))
    out.sort((a, b) => a.name.localeCompare(b.name))
    return out
  }, [allNfts, collections])

  const totalNfts = allNfts.length
  const totalCollections = collectionPills.length
  const hasFilters =
    activeCollection !== 'all' ||
    query.trim().length > 0 ||
    typeFilter !== 'all' ||
    priceFilter !== 'all'

  const visibleNfts = useMemo(() => {
    let list = allNfts
    if (activeCollection !== 'all') {
      list = list.filter((n) => n.collection === activeCollection)
    }
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (n) =>
          n.name?.toLowerCase().includes(q) ||
          n.collection_name?.toLowerCase().includes(q) ||
          n.collection?.toLowerCase().includes(q),
      )
    }
    if (typeFilter !== 'all') {
      list = list.filter((n) => typeLabel(n.type) === typeFilter)
    }
    if (priceFilter !== 'all') {
      list = list.filter((n) => matchesPriceFilter(n, priceFilter))
    }
    const sorted = [...list]
    sorted.sort((a, b) => {
      if (sort === 'name') return (a.name || '').localeCompare(b.name || '')
      if (sort === 'nonce') return a.nonce - b.nonce
      const c = (a.collection_name || '').localeCompare(b.collection_name || '')
      return c !== 0 ? c : a.nonce - b.nonce
    })
    return sorted
  }, [allNfts, activeCollection, priceFilter, query, sort, typeFilter])

  return (
    <div className="animate-fade-in">
      <section className="relative mb-10 overflow-hidden rounded-3xl border border-[#2a2a3a] bg-gradient-to-br from-[#15151f] via-[#12121a] to-[#0a0a0f] p-6 sm:p-10">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#2a2a3a] bg-white/5 px-3 py-1 text-xs font-medium text-gray-300 backdrop-blur">
            <span className="live-dot" /> MultiversX Mainnet
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight">
            <span className="gradient-text">xArtists Marketplace</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base text-gray-400 sm:text-lg">
            NFT phygital & generative — achat crypto on-chain ou fiat via MoonPay (EGLD) puis paiement wallet.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-lg">
            <Stat value={totalCollections.toString()} label="Collections" />
            <Stat value={`${totalNfts}+`} label="NFTs" />
            <Stat value="Mainnet" label="MultiversX" />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/publish" className="btn-primary text-sm">
              Publier mon œuvre
            </Link>
            <MoonpayButton label="Acheter en EUR (MoonPay → EGLD)" className="text-sm!" />
            <button
              onClick={refreshLive}
              disabled={refreshing || loading}
              className="btn-secondary text-xs disabled:opacity-50"
            >
              {refreshing ? 'Refreshing…' : '↻ Refresh from MultiversX'}
            </button>
            {lastUpdated && (
              <span className="text-[11px] text-gray-500">
                Updated {new Date(lastUpdated).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search NFTs or collections…"
            className="w-full rounded-xl border border-[#2a2a3a] bg-[#15151f] py-2.5 pl-9 pr-3 text-sm text-gray-200 placeholder:text-gray-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/publish" className="btn-primary text-sm lg:mr-2">
            Publier mon œuvre
          </Link>
          <label className="text-xs text-gray-500">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-[#2a2a3a] bg-[#15151f] px-3 py-2 text-sm text-gray-200 outline-none focus:border-purple-500"
          >
            <option value="collection">Collection</option>
            <option value="name">Name</option>
            <option value="nonce">Nonce</option>
          </select>
          <label className="ml-0 text-xs text-gray-500 sm:ml-2">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as AssetTypeFilter)}
            className="rounded-xl border border-[#2a2a3a] bg-[#15151f] px-3 py-2 text-sm text-gray-200 outline-none focus:border-purple-500"
          >
            <option value="all">All</option>
            <option value="NFT">NFT</option>
            <option value="SFT">SFT</option>
          </select>
          <label className="ml-0 text-xs text-gray-500 sm:ml-2">Price</label>
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
            className="rounded-xl border border-[#2a2a3a] bg-[#15151f] px-3 py-2 text-sm text-gray-200 outline-none focus:border-purple-500"
          >
            <option value="all">Any</option>
            <option value="under1">Under 1 EGLD</option>
            <option value="1to5">1–5 EGLD</option>
            <option value="5plus">5+ EGLD</option>
          </select>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <FilterPill active={activeCollection === 'all'} onClick={() => setActiveCollection('all')} label="All" count={totalNfts} />
        {collectionPills.map((c) => (
          <FilterPill
            key={c.id}
            active={activeCollection === c.id}
            onClick={() => setActiveCollection(c.id)}
            label={c.name}
            count={c.count}
            sub={c.id.split('-')[0]}
          />
        ))}
      </div>

      {loading ? (
        <SkeletonGrid />
      ) : visibleNfts.length === 0 ? (
        <div className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] px-6 py-20 text-center">
          <p className="text-4xl mb-3">{hasFilters ? '🔍' : '🖼️'}</p>
          <p className="text-lg font-semibold text-white">
            {hasFilters
              ? 'Aucune œuvre disponible pour cette sélection.'
              : 'La prochaine sélection arrive bientôt.'}
          </p>
          <p className="mt-2 text-sm text-gray-400">
            {hasFilters
              ? 'Essaie une autre collection, ou publie ton œuvre pour enrichir la galerie.'
              : 'Reviens bientôt pour découvrir de nouvelles œuvres, ou publie la tienne dès maintenant.'}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setPriceFilter('all')
                  setTypeFilter('all')
                  setActiveCollection('all')
                }}
                className="btn-secondary text-sm"
              >
                Réinitialiser
              </button>
            )}
            <Link to="/publish" className="btn-primary text-sm">
              Publier mon œuvre
            </Link>
            {!marketplaceReady && (
              <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs text-orange-200">
                Contrat en déploiement — l’achat on-chain arrive bientôt.
              </span>
            )}
          </div>
        </div>
      ) : (
        <>
          <p className="mb-4 text-xs text-gray-500">
            Showing {visibleNfts.length} NFT{visibleNfts.length !== 1 && 's'}
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visibleNfts.map((nft) => (
              <NFTCard key={nft.identifier} nft={nft} onClick={() => setSelected(nft)} />
            ))}
          </div>
        </>
      )}

      <NFTDetailModal nft={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#2a2a3a] bg-white/5 px-4 py-3 backdrop-blur">
      <p className="text-xl font-black sm:text-2xl">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-widest text-gray-500">{label}</p>
    </div>
  )
}

function FilterPill({
  active,
  onClick,
  label,
  count,
  sub,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  sub?: string
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all',
        active
          ? 'border-purple-500 bg-purple-500/15 text-white'
          : 'border-[#2a2a3a] bg-[#15151f] text-gray-400 hover:border-purple-500/50 hover:text-white',
      ].join(' ')}
    >
      <span>{label}</span>
      {sub && <span className="mono text-[10px] text-gray-500">{sub}</span>}
      <span className={['rounded-full px-1.5 py-0.5 text-[10px] font-bold', active ? 'bg-purple-500/30' : 'bg-white/5 text-gray-500'].join(' ')}>
        {count}
      </span>
    </button>
  )
}

function nftPriceEgld(nft: NFT): number | null {
  const price = (nft.metadata as Record<string, unknown> | undefined)?.priceEgld
  const value = typeof price === 'number' ? price : typeof price === 'string' ? parseFloat(price) : NaN
  return Number.isFinite(value) ? value : null
}

function matchesPriceFilter(nft: NFT, filter: PriceFilter): boolean {
  const price = nftPriceEgld(nft)
  if (price === null) return false
  if (filter === 'under1') return price < 1
  if (filter === '1to5') return price >= 1 && price <= 5
  if (filter === '5plus') return price > 5
  return true
}

function NFTCard({ nft, onClick }: { nft: NFT; onClick: () => void }) {
  const img = nftImageUrl(nft)
  const royalties = nftRoyalties(nft)
  const price = nftPriceEgld(nft)
  return (
    <button
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#2a2a3a] bg-[#15151f] text-left transition-all hover:-translate-y-1 hover:border-purple-500/60"
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#15151f] to-[#0a0a0f]">
        {img ? (
          <img src={img} alt={nft.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl opacity-60">🎨</div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-gray-200">{typeLabel(nft.type)}</span>
        {royalties !== null && (
          <span className="absolute right-2 top-2 rounded-full bg-purple-500/80 px-2 py-0.5 text-[10px] font-semibold text-white">
            {royalties}% royalty
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="truncate text-sm font-semibold">{nft.name || 'Untitled'}</p>
        <div className="flex items-center justify-between">
          <span className="truncate text-xs text-purple-300/90">{nft.collection_name}</span>
          <span className="mono text-[10px] text-gray-500">{nonceLabel(nft)}</span>
        </div>
        <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
          <span>{price !== null ? `${price} EGLD` : 'Prix sur demande'}</span>
          <span>{royalties !== null ? `${royalties}%` : '—'}</span>
        </div>
      </div>
    </button>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-[#2a2a3a] bg-[#15151f]">
          <div className="aspect-square animate-pulse bg-[#1a1a2e]" />
          <div className="space-y-2 p-3">
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-[#1a1a2e]" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-[#1a1a2e]" />
          </div>
        </div>
      ))}
    </div>
  )
}
