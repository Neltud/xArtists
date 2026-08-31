/**
 * LIA Immersive Museum — real MultiversX catalog + user NFTs.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'
import LiaHost from '../components/museum/LiaHost'
import MuseumCorridor, {
  framesFromUserNfts,
  type FrameItem,
} from '../components/museum/MuseumCorridor'
import MuseumGameHall from '../components/museum/MuseumGameHall'
import GuidedWorldTour from '../components/museum/GuidedWorldTour'
import { MUSEUM_SPACES, type MuseumSpaceId } from '../lib/museumSpaces'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import {
  DATA_URL,
  nftImageUrl,
  type CollectionData,
  type CollectionsFile,
  type NFT,
} from '../types/nft'
import { requestOpenConnect } from '../lib/walletEvents'
import { consumeTravelDestination } from '../lib/travelBridge'

function preferImage(n: NFT): string | undefined {
  const thumb = n.media?.[0]?.thumbnailUrl
  const full = n.url || n.media?.[0]?.url
  if (thumb && /^https?:\/\//i.test(thumb)) return thumb
  if (full && /^https?:\/\//i.test(full)) return full
  return nftImageUrl(n)
}

function framesFromNfts(nfts: NFT[]): FrameItem[] {
  return nfts.map(n => ({
    id: n.identifier,
    title: n.name || n.identifier,
    subtitle: n.collection_name || n.collection,
    collection: n.collection,
    description: n.metadata?.description,
    type: n.type,
    image: preferImage(n),
    href: `https://explorer.multiversx.com/nfts/${n.identifier}`,
  }))
}

async function loadFullCatalog(): Promise<{ collections: CollectionData[]; nfts: NFT[] }> {
  const urls = [
    DATA_URL,
    'https://raw.githubusercontent.com/Neltud/xArtists/main/apps/frontend/public/data/xartists_collections.json',
    'https://raw.githubusercontent.com/Neltud/xArtists/main/data/xartists_collections.json',
  ]
  for (const u of urls) {
    try {
      const r = await fetch(`${u}${u.includes('?') ? '&' : '?'}t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (!r.ok) continue
      const j = (await r.json()) as CollectionsFile
      const cols = j.collections || []
      if (!cols.length) continue
      const nfts = cols.flatMap(c =>
        (c.nfts || []).map(n => ({
          ...n,
          collection: n.collection || c.identifier,
          collection_name: n.collection_name || c.name,
        }))
      )
      return { collections: cols, nfts }
    } catch {
      /* next */
    }
  }
  return { collections: [], nfts: [] }
}

export default function MuseumPage() {
  const [space, setSpace] = useState<MuseumSpaceId>('catzligue')
  const [allNfts, setAllNfts] = useState<NFT[]>([])
  const [collections, setCollections] = useState<CollectionData[]>([])
  const [colFilter, setColFilter] = useState<string>('all')
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [travelBanner, setTravelBanner] = useState<string | null>(null)
  const { connected, address } = useWallet()
  const account = useUserAccount(connected ? address : null)

  useEffect(() => {
    let c = false
    ;(async () => {
      setCatalogLoading(true)
      const { collections: cols, nfts } = await loadFullCatalog()
      if (c) return
      setCollections(cols)
      setAllNfts(nfts)
      setCatalogError(cols.length ? null : 'Catalogue indisponible')
      setCatalogLoading(false)
    })()
    return () => {
      c = true
    }
  }, [])

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    const q = hash.includes('?') ? hash.split('?')[1] : ''
    const params = new URLSearchParams(
      q || (typeof window !== 'undefined' ? window.location.search : '')
    )
    const spaceQ = params.get('space') as MuseumSpaceId | null
    const cityQ = params.get('city')
    const travel = consumeTravelDestination()
    if (spaceQ && ['catzligue', 'mydee', 'world_tour', 'vr_core'].includes(spaceQ)) {
      setSpace(spaceQ)
    } else if (travel?.space) {
      setSpace(travel.space)
    }
    if (travel?.city || cityQ) {
      const city = travel?.city || cityQ || ''
      setTravelBanner(
        `Voyage LIA : ${city}${travel?.focus ? ` — ${travel.focus}` : ''}. Galerie chargée.`
      )
      if (!spaceQ && !travel?.space) setSpace('catzligue')
    }
  }, [])

  const catalogFrames = useMemo(() => {
    let rows = allNfts
    if (colFilter !== 'all') {
      rows = rows.filter(n => n.collection === colFilter)
    }
    const withImg = rows.filter(n => preferImage(n))
    const ordered = (withImg.length ? withImg : rows).slice(0, 64)
    return framesFromNfts(ordered)
  }, [allNfts, colFilter])

  const mydeeFrames = useMemo(
    () => framesFromUserNfts(account.nfts || []),
    [account.nfts]
  )

  const current = MUSEUM_SPACES.find(s => s.id === space)!

  return (
    <div className="animate-fade-in space-y-5 pb-12 max-w-4xl mx-auto">
      <PageGuide page="gallery" />

      <header className="space-y-1.5">
        <p className="section-label text-fuchsia-400/80">Musée · MultiversX</p>
        <h1 className="page-title">
          Musée <span className="gradient-text">xArtists</span>
        </h1>
        <p className="page-sub">
          Explore (WASD) · Mydee = wallet · guide mondial
          {allNfts.length > 0 && <span className="text-zinc-600"> · {allNfts.length} œuvres</span>}
        </p>
      </header>

      {travelBanner && (
        <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
          {travelBanner}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {MUSEUM_SPACES.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSpace(s.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              space === s.id
                ? 'border-fuchsia-400/45 bg-fuchsia-500/15 text-fuchsia-100'
                : 'border-white/10 text-zinc-500 hover:text-white'
            }`}
          >
            {s.name}
            {s.access === 'lia_pass' && (
              <span className="ml-1 text-[9px] text-amber-300/80">PASS</span>
            )}
          </button>
        ))}
      </div>

      {space === 'catzligue' && (
        <div className="space-y-3">
          {collections.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              <button
                type="button"
                onClick={() => setColFilter('all')}
                className={`rounded-full border px-2.5 py-1 text-[10px] ${
                  colFilter === 'all'
                    ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100'
                    : 'border-white/10 text-zinc-500'
                }`}
              >
                Toutes ({allNfts.length})
              </button>
              {collections.map(c => (
                <button
                  key={c.identifier}
                  type="button"
                  onClick={() => setColFilter(c.identifier)}
                  className={`rounded-full border px-2.5 py-1 text-[10px] ${
                    colFilter === c.identifier
                      ? 'border-violet-400/40 bg-violet-500/15 text-violet-100'
                      : 'border-white/10 text-zinc-500'
                  }`}
                >
                  {c.name || c.identifier}
                </button>
              ))}
            </div>
          )}

          {catalogLoading ? (
            <p className="text-sm text-zinc-500">Chargement…</p>
          ) : catalogError && !catalogFrames.length ? (
            <p className="text-sm text-rose-300/90">{catalogError}</p>
          ) : (
            <MuseumGameHall
              frames={catalogFrames}
              emptyLabel="Aucune œuvre avec média dans ce filtre."
            />
          )}
          <p className="text-[11px] text-zinc-600">
            <Link to="/gallery" className="text-violet-300/90 hover:underline">
              Galerie 2D
            </Link>
            {' · '}
            <Link to="/studio" className="text-violet-300/90 hover:underline">
              Studio
            </Link>
          </p>
        </div>
      )}

      {space === 'mydee' && (
        <div className="space-y-3">
          {!connected ? (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-6 text-center space-y-3">
              <p className="text-sm text-amber-100/90">Connecte ton wallet pour Mydee.</p>
              <button
                type="button"
                className="btn-primary text-sm"
                onClick={() => requestOpenConnect()}
              >
                Connect
              </button>
            </div>
          ) : account.loading && !mydeeFrames.length ? (
            <p className="text-sm text-zinc-500">Lecture NFTs…</p>
          ) : (
            <MuseumCorridor
              frames={mydeeFrames}
              theme="sanctuary"
              emptyLabel="Aucun NFT sur cette adresse."
            />
          )}
        </div>
      )}

      {space === 'world_tour' && <GuidedWorldTour />}

      {space === 'vr_core' && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-950/20 px-5 py-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-white">VR Core</h2>
            <span className="text-[10px] text-amber-200/90 border border-amber-500/30 rounded-full px-2 py-0.5">
              LIA Pass pending
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            WebXR (R3F) — roadmap. Exploration WASD = fondation v1 gratuite.
          </p>
          <button type="button" className="btn-secondary text-xs" onClick={() => setSpace('catzligue')}>
            ← Catzligue
          </button>
        </div>
      )}
    </div>
  )
}
