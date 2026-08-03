import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import NFTDetailModal from '../components/NFTDetailModal'
import {
  type NFT,
  type CollectionData,
  type CollectionsFile,
  nftImageUrl,
  nonceLabel,
  typeLabel,
  DATA_URL,
} from '../types/nft'

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
        console.warn('[Gallery] bundled data fetch failed', err)
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
      <section className="relative mb-12 overflow-hidden rounded-3xl border border-[#2a2a3a] bg-gradient-to-br from-[#15151f] via-[#12121a] to-[#0a0a0f] p-6 sm:p-12">
        <div className="pointer-events-none absolute -top-32 right-0 h-80 w-80 rounded-full bg-fuchsia-600/15 blur-3xl" />
        <div className="relative grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
          <div className="flex items-center justify-center">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 p-[3px] sm:h-40 sm:w-40">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0a0a0f] text-5xl sm:text-6xl">
                🎨
              </div>
            </div>
          </div>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#2a2a3a] bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">
              <span className="live-dot" /> Galerie officielle
            </span>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              <span className="gradient-text">xArtists</span>
            </h1>
            <p className="mt-1 text-sm font-medium text-purple-300/80">
              Collection phygital & generative · MultiversX Mainnet
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base">
              Œuvres tokenisées on-chain — certificat d&apos;authenticité et provenance. Artiste fondateur :{' '}
              Nelson Tuduri. Explorez {collections.length} collections et {totalNfts}+ œuvres.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="badge-purple">{collections.length} collections</span>
              <span className="badge-green">✅ Mainnet</span>
              <span className="badge-gray">RWA · Phygital</span>
              <Link to="/marketplace" className="badge-gray hover:border-purple-500 hover:text-white">
                Marketplace →
              </Link>
              <Link to="/studio" className="badge-gray hover:border-purple-500 hover:text-white">
                Studio artiste →
              </Link>
            </div>
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
  const nfts = collection.nfts
  const accent = ACCENTS[index % ACCENTS.length]
  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className={`h-7 w-1.5 rounded-full bg-gradient-to-b ${accent}`} aria-hidden />
            <h2 className="text-2xl font-black sm:text-3xl">{collection.name}</h2>
          </div>
          <p className="mono mt-1.5 pl-4 text-xs text-gray-500">
            {collection.identifier} · {nfts.length} works · {typeLabel(collection.type)}
          </p>
        </div>
        <Link
          to={`/marketplace?collection=${encodeURIComponent(collection.identifier)}`}
          className="btn-secondary shrink-0 text-xs"
        >
          View Collection →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {nfts.map(nft => (
          <GalleryTile key={nft.identifier} nft={nft} accent={accent} onClick={() => onSelect(nft)} />
        ))}
      </div>
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
      onClick={onClick}
      className="group relative flex aspect-[4/5] flex-col overflow-hidden rounded-2xl border border-[#2a2a3a] bg-[#15151f] text-left transition-all hover:-translate-y-1 hover:border-purple-500/60"
    >
      <div className="absolute inset-0 overflow-hidden">
        {img ? (
          <img src={img} alt={nft.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${accent} opacity-40`}>
            <span className="text-5xl">🎨</span>
          </div>
        )}
      </div>
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/20 to-transparent p-3">
        <p className="truncate text-sm font-bold text-white">{nft.name || 'Untitled'}</p>
        <div className="mt-0.5 flex justify-between">
          <span className="mono text-[10px] text-gray-300">{nonceLabel(nft)}</span>
          <span className="text-[9px] bg-white/10 px-1.5 rounded">{typeLabel(nft.type)}</span>
        </div>
      </div>
    </button>
  )
}

function GallerySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
