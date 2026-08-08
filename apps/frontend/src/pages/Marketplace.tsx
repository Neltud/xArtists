import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import NFTDetailModal from '../components/NFTDetailModal'
import MoonpayButton from '../components/MoonpayButton'
import MarketplaceActivity from '../components/MarketplaceActivity'
import AdSlot from '../components/AdSlot'
import TreasuryBanner from '../components/TreasuryBanner'
import ScStatusBanner from '../components/ScStatusBanner'
import VirtualNftGrid from '../components/VirtualNftGrid'
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
type MarketAction = 'buy' | 'sell' | 'offer' | 'bid'

export default function Marketplace() {
  const [collections, setCollections] = useState<CollectionData[]>([])
  const [allNfts, setAllNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('')
  const [listingIdFromIndex, setListingIdFromIndex] = useState<number | null>(null)

  const [searchParams] = useSearchParams()
  const initialCol = searchParams.get('collection') ?? 'all'
  const [activeCollection, setActiveCollection] = useState(initialCol !== 'all' ? initialCol : 'all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('collection')
  const [selected, setSelected] = useState<NFT | null>(null)
  const [action, setAction] = useState<MarketAction | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(DATA_URL, { cache: 'force-cache' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: CollectionsFile = await res.json()
        if (cancelled) return
        setCollections(data.collections)
        setAllNfts(data.collections.flatMap(c => c.nfts))
        setLastUpdated(data.timestamp || new Date().toISOString())
      } catch (err) {
        console.warn('[Marketplace] data fetch failed', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const openNft = (nft: NFT, act: MarketAction | null = null) => {
    setAction(act)
    setSelected(nft)
  }

  const refreshLive = useCallback(async () => {
    setRefreshing(true)
    try {
      const target =
        activeCollection === 'all' ? collections.map(c => c.identifier) : [activeCollection]
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
        if (activeCollection === 'all') setAllNfts(fetched)
        else
          setAllNfts(prev => {
            const rest = prev.filter(n => n.collection !== activeCollection)
            return [...rest, ...fetched]
          })
        setLastUpdated(new Date().toISOString())
      }
    } finally {
      setRefreshing(false)
    }
  }, [activeCollection, collections])

  const collectionPills = useMemo(() => {
    const counts = new Map<string, number>()
    for (const n of allNfts) counts.set(n.collection, (counts.get(n.collection) ?? 0) + 1)
    const byId = new Map(collections.map(c => [c.identifier, c.name]))
    return [...counts.entries()]
      .map(([id, count]) => ({ id, name: byId.get(id) ?? id.split('-')[0], count }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allNfts, collections])

  const visibleNfts = useMemo(() => {
    let list = allNfts
    if (activeCollection !== 'all') list = list.filter(n => n.collection === activeCollection)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        n =>
          n.name?.toLowerCase().includes(q) ||
          n.collection_name?.toLowerCase().includes(q) ||
          n.collection?.toLowerCase().includes(q)
      )
    }
    const sorted = [...list]
    sorted.sort((a, b) => {
      if (sort === 'name') return (a.name || '').localeCompare(b.name || '')
      if (sort === 'nonce') return a.nonce - b.nonce
      const c = (a.collection_name || '').localeCompare(b.collection_name || '')
      return c !== 0 ? c : a.nonce - b.nonce
    })
    return sorted
  }, [allNfts, activeCollection, query, sort])

  return (
    <div className="animate-fade-in">
      <section className="relative mb-6 overflow-hidden rounded-3xl border border-[#2a2a3a] bg-gradient-to-br from-[#15151f] via-[#12121a] to-[#0a0a0f] p-6 sm:p-10">
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#2a2a3a] bg-white/5 px-3 py-1 text-xs text-gray-300">
            <span className="live-dot" /> MultiversX Mainnet
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight">
            <span className="gradient-text">xArtists Marketplace</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base text-gray-400">
            Buy · Sell · Bid — on-chain après deploy SC · grille virtualisée si volume élevé
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <MoonpayButton label="Acheter EGLD (MoonPay)" className="text-sm!" />
            <button
              type="button"
              onClick={refreshLive}
              disabled={refreshing || loading}
              className="btn-secondary text-xs disabled:opacity-50"
            >
              {refreshing ? 'Refreshing…' : '↻ Refresh MultiversX'}
            </button>
            {lastUpdated && (
              <span className="text-[11px] text-gray-500">
                Updated {new Date(lastUpdated).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </section>

      <ScStatusBanner />

      <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
        <strong>P0 — SC marketplace non déployé</strong> (adresse actuelle = compte vide, codeHash null).
        List / Buy / Bid on-chain resteront en échec jusqu’au deploy +{' '}
        <code className="text-xs">verify_marketplace_codehash</code>.
      </div>

      <div className="mb-6">
        <TreasuryBanner compact />
      </div>

      <div className="mb-6 grid lg:grid-cols-[1fr_280px] gap-4">
        <div>
          <MarketplaceActivity
            onPickListingId={id => {
              setListingIdFromIndex(id)
            }}
          />
          {listingIdFromIndex != null && (
            <p className="text-xs text-purple-300 mt-2">
              Listing ID indexé : <strong>{listingIdFromIndex}</strong>
            </p>
          )}
        </div>
        <div className="space-y-3">
          <AdSlot id="market_sidebar" />
          <Link to="/ads" className="text-[10px] text-gray-500 underline block text-center">
            Louer cet espace (enchère)
          </Link>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search NFTs…"
          className="w-full lg:max-w-xs rounded-xl border border-[#2a2a3a] bg-[#15151f] py-2.5 px-3 text-sm outline-none focus:border-purple-500"
        />
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-[#2a2a3a] bg-[#15151f] px-3 py-2 text-sm"
        >
          <option value="collection">Collection</option>
          <option value="name">Name</option>
          <option value="nonce">Nonce</option>
        </select>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <FilterPill
          active={activeCollection === 'all'}
          onClick={() => setActiveCollection('all')}
          label="All"
          count={allNfts.length}
        />
        {collectionPills.map(c => (
          <FilterPill
            key={c.id}
            active={activeCollection === c.id}
            onClick={() => setActiveCollection(c.id)}
            label={c.name}
            count={c.count}
          />
        ))}
      </div>

      {loading ? (
        <SkeletonGrid />
      ) : visibleNfts.length === 0 ? (
        <div className="rounded-2xl border border-[#2a2a3a] py-20 text-center text-gray-400">No NFTs</div>
      ) : (
        <VirtualNftGrid
          items={visibleNfts}
          threshold={48}
          estimateRowHeight={280}
          getKey={nft => nft.identifier}
          renderItem={nft => <NFTCard nft={nft} onOpen={openNft} />}
        />
      )}

      <NFTDetailModal
        nft={selected}
        initialAction={action}
        initialListingId={listingIdFromIndex}
        onClose={() => {
          setSelected(null)
          setAction(null)
        }}
      />
    </div>
  )
}

function FilterPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm ${
        active
          ? 'border-purple-500 bg-purple-500/15 text-white'
          : 'border-[#2a2a3a] bg-[#15151f] text-gray-400'
      }`}
    >
      {label}
      <span className="text-[10px] opacity-70">{count}</span>
    </button>
  )
}

function NFTCard({
  nft,
  onOpen,
}: {
  nft: NFT
  onOpen: (n: NFT, a: MarketAction | null) => void
}) {
  const img = nftImageUrl(nft)
  const stop = (e: React.MouseEvent, a: MarketAction) => {
    e.stopPropagation()
    onOpen(nft, a)
  }
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-[#2a2a3a] bg-[#15151f] transition-all hover:border-purple-500/60">
      <button type="button" onClick={() => onOpen(nft, null)} className="text-left">
        <div className="relative aspect-square overflow-hidden bg-[#0a0a0f]">
          {img ? (
            <img
              src={img}
              alt={nft.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl opacity-60">🎨</div>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px]">
            {typeLabel(nft.type)}
          </span>
        </div>
        <div className="p-3 pb-1">
          <p className="truncate text-sm font-semibold">{nft.name || 'Untitled'}</p>
          <div className="flex justify-between text-xs">
            <span className="text-purple-300/90 truncate">{nft.collection_name}</span>
            <span className="mono text-gray-500">{nonceLabel(nft)}</span>
          </div>
        </div>
      </button>
      <div className="grid grid-cols-4 gap-1 p-2 pt-0">
        {(['buy', 'sell', 'offer', 'bid'] as MarketAction[]).map(a => (
          <button
            key={a}
            type="button"
            onClick={e => stop(e, a)}
            className="rounded-lg bg-[#0a0a0f] border border-[#2a2a3a] py-1.5 text-[10px] font-semibold uppercase text-gray-300 hover:border-purple-500 hover:text-white"
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="aspect-square animate-pulse rounded-2xl bg-[#1a1a2e]" />
      ))}
    </div>
  )
}
