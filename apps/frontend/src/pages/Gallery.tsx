import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import NFTDetailModal from '../components/NFTDetailModal'
import VirtualNftGrid from '../components/VirtualNftGrid'
import {
  type NFT,
  type CollectionData,
  type CollectionsFile,
  nftImageUrl,
  nonceLabel,
  typeLabel,
  DATA_URL,
} from '../types/nft'

const COLLECTION_BIOS: Record<string, { label: string; bio: string }> = {
  'NFTUDURI-2990b6': {
    label: 'Collection phygital',
    bio: 'Œuvres 1/1 et séries — sculpture, vidéo, provenance on-chain MultiversX.',
  },
  'TRO-652d6d': {
    label: 'Collection $TRO',
    bio: 'Pièces liées au token TRO-94c925 et aux artworks tokenisés.',
  },
  'XTR-e5072b': {
    label: 'xTuduri SFT',
    bio: 'Montages vidéo et éditions SFT du catalogue xArtists.',
  },
  'XAUS-d9cf1f': {
    label: 'xArtists',
    bio: 'Identité visuelle et drops écosystème xArtists.',
  },
  'XAR-cee2e0': {
    label: 'xArtists',
    bio: 'Série art génératif / éditions limitées.',
  },
}

const PREVIEW_PER_COLLECTION = 12

export default function Gallery() {
  const [collections, setCollections] = useState<CollectionData[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<NFT | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(DATA_URL, { cache: 'force-cache' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: CollectionsFile = await res.json()
        if (cancelled) return
        setCollections(data.collections)
      } catch (err) {
        console.warn('[Gallery] data fetch failed', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const ordered = useMemo(
    () => [...collections].sort((a, b) => b.nft_count - a.nft_count),
    [collections]
  )
  const totalNfts = collections.reduce((s, c) => s + c.nft_count, 0)

  return (
    <div className="animate-fade-in">
      <section className="relative mb-10 overflow-hidden rounded-3xl border border-[#2a2a3a] bg-gradient-to-br from-[#15151f] via-[#12121a] to-[#0a0a0f] p-6 sm:p-12">
        <div className="pointer-events-none absolute -top-32 right-0 h-80 w-80 rounded-full bg-fuchsia-600/15 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#2a2a3a] bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">
            <span className="live-dot" /> Galerie · MultiversX Mainnet
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            <span className="gradient-text">xArtists</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base">
            Collections NFT phygital & generative. {collections.length || '…'} collections ·{' '}
            {totalNfts || '…'}+ œuvres. Catalog slim · grille virtualisée si volume élevé.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/studio" className="btn-primary text-xs py-2 px-3">
              Mint / Studio
            </Link>
            <Link to="/marketplace" className="btn-secondary text-xs py-2 px-3">
              Buy NFT
            </Link>
            <Link to="/tro" className="btn-secondary text-xs py-2 px-3">
              Buy $TRO
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <GallerySkeleton />
      ) : (
        <div className="space-y-14">
          {ordered.map((col, idx) => (
            <CollectionSection key={col.identifier} collection={col} index={idx} onSelect={setSelected} />
          ))}
        </div>
      )}

      <NFTDetailModal nft={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function CollectionSection({
  collection,
  index,
  onSelect,
}: {
  collection: CollectionData
  index: number
  onSelect: (nft: NFT) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const nfts = collection.nfts
  const shown = expanded ? nfts : nfts.slice(0, PREVIEW_PER_COLLECTION)
  const accent = ACCENTS[index % ACCENTS.length]
  const meta = COLLECTION_BIOS[collection.identifier] || {
    label: 'xArtists',
    bio: 'Collection du catalogue xArtists sur MultiversX.',
  }
  return (
    <section aria-labelledby={`col-${collection.identifier}`} className="nft-grid-item">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className={`h-7 w-1.5 shrink-0 rounded-full bg-gradient-to-b ${accent}`} aria-hidden />
            <h2 id={`col-${collection.identifier}`} className="text-2xl font-black sm:text-3xl truncate">
              {collection.name}
            </h2>
          </div>
          <p className="mono mt-1.5 pl-4 text-xs text-gray-500">
            {collection.identifier} · {nfts.length} œuvres · {typeLabel(collection.type)}
          </p>
          <div className="mt-2 pl-4 max-w-2xl">
            <p className="text-xs font-semibold text-purple-300/90">{meta.label}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{meta.bio}</p>
          </div>
        </div>
        <Link
          to={`/marketplace?collection=${encodeURIComponent(collection.identifier)}`}
          className="btn-secondary shrink-0 text-xs self-start sm:self-auto"
        >
          Sell / Buy →
        </Link>
      </div>
      <VirtualNftGrid
        items={shown}
        threshold={48}
        estimateRowHeight={260}
        getKey={(nft) => nft.identifier}
        renderItem={(nft) => (
          <GalleryTile nft={nft} accent={accent} onClick={() => onSelect(nft)} />
        )}
      />
      {nfts.length > PREVIEW_PER_COLLECTION && (
        <div className="mt-4 text-center">
          <button type="button" className="btn-secondary text-xs" onClick={() => setExpanded(e => !e)}>
            {expanded ? 'Réduire' : `Voir les ${nfts.length} œuvres`}
          </button>
        </div>
      )}
    </section>
  )
}

function GalleryTile({
  nft,
  accent,
  onClick,
}: {
  nft: NFT
  accent: string
  onClick: () => void
}) {
  const img = nftImageUrl(nft)
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex aspect-[4/5] w-full flex-col overflow-hidden rounded-2xl border border-[#2a2a3a] bg-[#15151f] text-left transition-all hover:-translate-y-1 hover:border-purple-500/60 focus-visible:ring-2 focus-visible:ring-purple-500"
    >
      <div className="absolute inset-0 overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={nft.name || 'NFT'}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${accent} opacity-40`}>
            <span className="text-5xl">🎨</span>
          </div>
        )}
      </div>
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/20 to-transparent p-3">
        <p className="truncate text-sm font-bold text-white">{nft.name || 'Untitled'}</p>
        <div className="mt-0.5 flex justify-between gap-1">
          <span className="mono text-[10px] text-gray-300">{nonceLabel(nft)}</span>
          <span className="text-[9px] bg-white/10 px-1.5 rounded shrink-0">{typeLabel(nft.type)}</span>
        </div>
      </div>
    </button>
  )
}

function GallerySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-[#1a1a2e]" />
      ))}
    </div>
  )
}

const ACCENTS = [
  'from-purple-600 to-indigo-600',
  'from-violet-500 to-fuchsia-500',
  'from-fuchsia-500 to-pink-500',
  'from-indigo-500 to-cyan-500',
  'from-rose-500 to-orange-500',
  'from-emerald-500 to-teal-500',
]
