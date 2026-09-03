/**
 * Galerie — chargement progressif (cache) + salles public_domain immédiates.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  framesFromUserNfts,
  type FrameItem,
} from '../components/museum/MuseumCorridor'
import MuseumGameHall from '../components/museum/MuseumGameHall'
import GuidedWorldTour from '../components/museum/GuidedWorldTour'
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
import {
  buildMuseumNetwork,
  loadMuseumNetwork,
  museumIdForCity,
  VIRTUAL_MUSEUMS,
  type VirtualMuseum,
} from '../lib/museumWorldCatalog'
import { preloadImages } from '../lib/imagePreload'

type Mode = 'explore' | 'mine' | 'map'

function preferImage(n: NFT): string | undefined {
  const thumb = n.media?.[0]?.thumbnailUrl as string | undefined
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

/** Cache session — un seul fetch catalogue, pas de cache-bust. */
let catalogPromise: Promise<{ collections: CollectionData[]; nfts: NFT[] }> | null = null

async function loadFullCatalog(): Promise<{ collections: CollectionData[]; nfts: NFT[] }> {
  if (catalogPromise) return catalogPromise
  catalogPromise = (async () => {
    const urls = [
      DATA_URL,
      `${import.meta.env.BASE_URL || '/'}data/xartists_collections.json`,
    ]
    for (const u of urls) {
      try {
        const r = await fetch(u, { cache: 'force-cache' })
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
  })()
  return catalogPromise
}

const MODES: { id: Mode; label: string }[] = [
  { id: 'explore', label: 'Explorer' },
  { id: 'mine', label: 'Ma collection' },
  { id: 'map', label: 'Carte' },
]

export default function MuseumPage() {
  const [params] = useSearchParams()
  const initial = params.get('tab')
  const [mode, setMode] = useState<Mode>(
    initial === 'mine' || initial === 'map' ? initial : 'explore'
  )
  const [museumId, setMuseumId] = useState('xartists')
  const [museums, setMuseums] = useState<VirtualMuseum[]>(() =>
    buildMuseumNetwork(import.meta.env.BASE_URL || '/')
  )
  const [allNfts, setAllNfts] = useState<NFT[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [travelBanner, setTravelBanner] = useState<string | null>(null)
  const { connected, address } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const museum = museums.find(m => m.id === museumId) || museums[0] || VIRTUAL_MUSEUMS[0]

  useEffect(() => {
    let cxl = false
    loadMuseumNetwork(import.meta.env.BASE_URL || '/').then(list => {
      if (!cxl && list.length) setMuseums(list)
    })
    return () => {
      cxl = true
    }
  }, [])

  useEffect(() => {
    let c = false
    ;(async () => {
      setCatalogLoading(true)
      const { nfts } = await loadFullCatalog()
      if (c) return
      setAllNfts(nfts)
      setCatalogLoading(false)
    })()
    return () => {
      c = true
    }
  }, [])

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    const q = hash.includes('?') ? hash.split('?')[1] : ''
    const sp = new URLSearchParams(
      q || (typeof window !== 'undefined' ? window.location.search : '')
    )
    const cityQ = sp.get('city')
    const travel = consumeTravelDestination()
    if (travel?.city || cityQ) {
      const city = travel?.city || cityQ || ''
      const mid = museumIdForCity(city)
      setTravelBanner(`Direction ${city}`)
      setMuseumId(mid || 'xartists')
      setMode('explore')
    }
  }, [])

  const xartistsFrames = useMemo(() => {
    const withImg = allNfts.filter(n => preferImage(n))
    const list = (withImg.length ? withImg : allNfts).slice(0, 24)
    return framesFromNfts(list)
  }, [allNfts])

  const visitFrames = museum.source === 'onchain' ? xartistsFrames : museum.works

  /** Précharge les 6 premières images de la salle active. */
  useEffect(() => {
    preloadImages(
      visitFrames.map(f => f.image),
      6
    )
  }, [museumId, visitFrames])

  const myFrames = useMemo(() => framesFromUserNfts(account.nfts || []), [account.nfts])

  const showHallLoader = museum.source === 'onchain' && catalogLoading && !visitFrames.length

  return (
    <div className="animate-fade-in pb-12 max-w-5xl mx-auto">
      <header className="mb-6 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          xArtists
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">Galerie</h1>
        <p className="text-zinc-400 text-[15px] leading-relaxed max-w-xl">
          Une seule expérience : salles immersives, votre collection, ou voyage de ville en ville.
        </p>
      </header>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {MODES.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              mode === m.id
                ? 'bg-white text-zinc-900'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {travelBanner && (
        <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-zinc-300">
          {travelBanner}
        </div>
      )}

      {mode === 'explore' && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
            {museums.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMuseumId(m.id)}
                className={`snap-start shrink-0 rounded-2xl border px-3.5 py-2.5 text-left min-w-[9rem] transition-colors ${
                  museumId === m.id
                    ? 'border-white/30 bg-white/10'
                    : 'border-white/10 bg-black/30 hover:border-white/15'
                }`}
              >
                <p className="text-[12px] font-semibold text-white truncate">{m.name}</p>
                <p className="text-[10px] text-zinc-500 truncate mt-0.5">{m.city}</p>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-base font-medium text-white">{museum.name}</p>
              <p className="text-[12px] text-zinc-500">{museum.tagline}</p>
            </div>
            <p className="text-[11px] text-zinc-600 hidden sm:block">
              Déplacez-vous · touchez une œuvre
            </p>
          </div>

          {showHallLoader ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-950/80 h-[min(70vh,520px)] flex items-center justify-center">
              <p className="text-sm text-zinc-500">Préparation de la salle…</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
              <MuseumGameHall
                key={museumId}
                frames={visitFrames}
                room={museum.room}
                allowBuy={museum.source === 'onchain'}
                emptyLabel="Aucune œuvre pour ce lieu pour l’instant."
              />
            </div>
          )}
        </div>
      )}

      {mode === 'mine' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400 max-w-lg">
            Vos NFT MultiversX dans le même espace immersif.
          </p>
          {!connected ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-950/60 px-6 py-12 text-center space-y-4">
              <p className="text-sm text-zinc-300">Connectez votre wallet pour voir votre collection.</p>
              <button type="button" className="btn-primary" onClick={() => requestOpenConnect()}>
                Connecter
              </button>
            </div>
          ) : account.loading && !myFrames.length ? (
            <p className="text-sm text-zinc-500">Lecture de la collection…</p>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
              <MuseumGameHall
                frames={myFrames}
                room="dark"
                allowBuy={false}
                emptyLabel="Aucun NFT sur cette adresse."
              />
            </div>
          )}
        </div>
      )}

      {mode === 'map' && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">
            Choisissez une ville — la salle s’ouvre dans Explorer.
          </p>
          <GuidedWorldTour />
          <p className="text-[11px] text-zinc-600">
            <Link
              to="/tours"
              className="text-zinc-400 hover:text-white underline-offset-2 hover:underline"
            >
              Carte monde détaillée
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
