/**
 * Marketplace — catalogue propre, sans pub ni jargon SC.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import NFTDetailModal from '../components/NFTDetailModal'
import MarketplaceActivity from '../components/MarketplaceActivity'
import VirtualNftGrid from '../components/VirtualNftGrid'
import { canListBuyNft } from '../config/scStatus'
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

  const [searchParams] = useSearchParams()
  const initialCol = searchParams.get('collection') ?? 'all'
  const [activeCollection, setActiveCollection] = useState(initialCol !== 'all' ? initialCol : 'all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('collection')
  const [selected, setSelected] = useState<NFT | null>(null)
  const [action, setAction] = useState<MarketAction | null>(null)
  const [listingIdFromIndex, setListingIdFromIndex] = useState<number | null>(null)

  const marketLive = canListBuyNft()

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
    <div className="animate-fade-in space-y-6 pb-12 max-w-5xl mx-auto">
      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          MultiversX
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          Marketplace
        </h1>
        <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
          Catalogue d’œuvres. {!marketLive && 'Consultation pour l’instant — achats bientôt.'}
        </p>
        <button
          type="button"
          onClick={refreshLive}
          disabled={refreshing || loading}
          className="btn-secondary text-xs disabled:opacity-50"
        >
          {refreshing ? 'Actualisation…' : 'Actualiser'}
        </button>
      </header>

      <MarketplaceActivity onPickListingId={id => setListingIdFromIndex(id)} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher…"
          className="w-full sm:max-w-xs rounded-xl border border-white/10 bg-black/40 py-2.5 px-3 text-sm outline-none focus:border-white/25"
        />
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
        >
          <option value="collection">Collection</option>
          <option value="name">Nom</option>
          <option value="nonce">N°</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FilterPill
          active={activeCollection === 'all'}
          onClick={() => setActiveCollection('all')}
          label="Toutes"
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
        <div className="rounded-2xl border border-white/10 py-16 text-center text-zinc-500 text-sm">
          Aucun NFT
        </div>
      ) : (
        <VirtualNftGrid
          items={visibleNfts}
          threshold={48}
          estimateRowHeight={280}
          getKey={nft => nft.identifier}
          renderItem={nft => <NFTCard nft={nft} onOpen={openNft} marketLive={marketLive} />}
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

      <p className="text-[12px] text-zinc-600">
        <Link to="/museum" className="hover:text-zinc-300 transition-colors">
          Galerie
        </Link>
        {' · '}
        <Link to="/wallet" className="hover:text-zinc-300 transition-colors">
          Wallet
        </Link>
      </p>
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
        active
          ? 'border-white/25 bg-white/10 text-white'
          : 'border-white/10 text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {label}
      <span className="opacity-50">{count}</span>
    </button>
  )
}

function NFTCard({
  nft,
  onOpen,
  marketLive,
}: {
  nft: NFT
  onOpen: (n: NFT, a: MarketAction | null) => void
  marketLive: boolean
}) {
  const img = nftImageUrl(nft)
  return (
    <button
      type="button"
      onClick={() => onOpen(nft, marketLive ? 'buy' : null)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] text-left transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]"
    >
      <div className="relative aspect-square overflow-hidden bg-black/40">
        {img ? (
          <img
            src={img}
            alt={nft.name}
            className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl opacity-30">◈</div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-zinc-300">
          {typeLabel(nft.type)}
        </span>
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-semibold text-white">{nft.name || 'Untitled'}</p>
        <div className="mt-0.5 flex justify-between gap-2 text-[11px]">
          <span className="text-zinc-500 truncate">{nft.collection_name}</span>
          <span className="mono text-zinc-600 shrink-0">{nonceLabel(nft)}</span>
        </div>
      </div>
    </button>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="aspect-square animate-pulse rounded-2xl bg-white/5" />
      ))}
    </div>
  )
}
