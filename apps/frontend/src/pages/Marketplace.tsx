import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import NFTDetailModal from '../components/NFTDetailModal'
import {
  type NFT,
  type CollectionData,
  type CollectionsFile,
  nftImageUrl,
  typeLabel,
  nonceLabel,
  DATA_URL,
} from '../types/nft'

const MVX_API = 'https://api.multiversx.com'

type SortKey = 'name' | 'collection' | 'nonce'

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
  const [selected, setSelected] = useState<NFT | null>(null)

  // Load bundled data file (works on GitHub Pages under /xArtists/).
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

  /** Refresh a sample of NFTs from the live MultiversX API (best-effort). */
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
          /* ignore single collection errors */
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

  // Collection metadata + counts derived from current data.
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

  // Filter + sort.
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
    const sorted = [...list]
    sorted.sort((a, b) => {
      if (sort === 'name') return (a.name || '').localeCompare(b.name || '')
      if (sort === 'nonce') return a.nonce - b.nonce
      // collection (default): by collection name then nonce
      const c = (a.collection_name || '').localeCompare(b.collection_name || '')
      return c !== 0 ? c : a.nonce - b.nonce
    })
    return sorted
  }, [allNfts, activeCollection, query, sort])

  return (
    <div className="animate-fade-in">
      {/* ===== Hero ===== */}
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
            Discover, collect and trade curated phygital & generative art across
            the xArtists ecosystem — tokenised on-chain, verifiable forever.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-lg">
            <Stat value={totalCollections.toString()} label="Collections" />
            <Stat value={`${totalNfts}+`} label="NFTs" />
            <Stat value="Mainnet" label="MultiversX" />
          </div>

          <div className="mt-6 flex items-center gap-3">
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

      {/* ===== Controls ===== */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
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
            className="w-full rounded-xl border border-[#2a2a3a] bg-[#15151f] py-2.5 pl-9 pr-3 text-sm text-gray-200 placeholder:text-gray-500 outline-none transition-all duration-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-[#2a2a3a] bg-[#15151f] px-3 py-2 text-sm text-gray-200 outline-none transition-all duration-300 focus:border-purple-500"
          >
            <option value="collection">Collection</option>
            <option value="name">Name</option>
            <option value="nonce">Nonce</option>
          </select>
        </div>
      </div>

      {/* ===== Collection filter pills ===== */}
      <div className="mb-8 flex flex-wrap gap-2">
        <FilterPill
          active={activeCollection === 'all'}
          onClick={() => setActiveCollection('all')}
          label="All"
          count={totalNfts}
        />
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

      {/* ===== Grid ===== */}
      {loading ? (
        <SkeletonGrid />
      ) : visibleNfts.length === 0 ? (
        <div className="rounded-2xl border border-[#2a2a3a] bg-[#15151f] py-20 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-400">No NFTs match your search.</p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-xs text-gray-500">
            Showing {visibleNfts.length} NFT{visibleNfts.length !== 1 && 's'}
            {activeCollection !== 'all' && ` in ${collectionPills.find((c) => c.id === activeCollection)?.name ?? activeCollection}`}
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

/* ---------------- Sub-components ---------------- */

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
        'group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-300',
        active
          ? 'border-purple-500 bg-purple-500/15 text-white shadow-lg shadow-purple-900/20'
          : 'border-[#2a2a3a] bg-[#15151f] text-gray-400 hover:border-purple-500/50 hover:text-white',
      ].join(' ')}
    >
      <span>{label}</span>
      {sub && <span className="mono text-[10px] text-gray-500 group-hover:text-gray-400">{sub}</span>}
      <span
        className={[
          'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
          active ? 'bg-purple-500/30 text-purple-100' : 'bg-white/5 text-gray-500',
        ].join(' ')}
      >
        {count}
      </span>
    </button>
  )
}

function NFTCard({ nft, onClick }: { nft: NFT; onClick: () => void }) {
  const img = nftImageUrl(nft)
  return (
    <button
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#2a2a3a] bg-[#15151f] text-left transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/60 hover:shadow-xl hover:shadow-purple-900/30"
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#15151f] to-[#0a0a0f]">
        {img ? (
          <img
            src={img}
            alt={`NFT artwork: ${nft.name} (${nft.collection_name})`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-600/30 via-indigo-600/20 to-fuchsia-500/30">
            <span className="text-5xl opacity-60">🎨</span>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-gray-200 backdrop-blur">
          {typeLabel(nft.type)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="truncate text-sm font-semibold text-gray-100">{nft.name || 'Untitled'}</p>
        <div className="flex items-center justify-between">
          <span className="truncate text-xs font-medium text-purple-300/90">{nft.collection_name}</span>
          <span className="mono shrink-0 text-[10px] text-gray-500">{nonceLabel(nft)}</span>
        </div>
        <p className="mono truncate text-[10px] text-gray-600">{nft.identifier}</p>
      </div>
    </button>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-2xl border border-[#2a2a3a] bg-[#15151f]"
        >
          <div className="aspect-square animate-pulse bg-[#1a1a2e]" />
          <div className="space-y-2 p-3">
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-[#1a1a2e]" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-[#1a1a2e]" />
            <div className="h-2 w-2/3 animate-pulse rounded bg-[#1a1a2e]" />
          </div>
        </div>
      ))}
    </div>
  )
}
