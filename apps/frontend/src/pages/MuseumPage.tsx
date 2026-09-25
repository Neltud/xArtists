/**
 * Galerie — salles 3D + grille œuvres toujours visible.
 * Fallback NFTUDURI / TUDURI si catalogue vide.
 * Catalogue : VITE_CATALOG_API (Akash) puis JSON GitHub.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  framesFromUserNfts,
  type FrameItem,
} from '../components/museum/MuseumCorridor'
import MuseumHall from '../components/museum/MuseumHall'
import AdSlot from '../components/AdSlot'
import HolderPulseTab from '../components/museum/HolderPulseTab'
import GuidedWorldTour from '../components/museum/GuidedWorldTour'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { nftImageUrl, type NFT } from '../types/nft'
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
import { loadBlueprint } from '../lib/loadBlueprint'
import { builtinBlueprintForMuseum } from '../lib/builtinBlueprints'
import type { RoomBlueprint } from '../lib/roomBlueprint'
import { TUDURI_WORKS } from '../config/tuduriAtelier'
import { loadFullCatalog } from '../lib/loadFullCatalog'

type Mode = 'explore' | 'mine' | 'map' | 'pulse'

const PRIORITY_COLLECTIONS = ['NFTUDURI-2990b6', 'TRO-652d6d', 'XTR-e5072b', 'XAR-cee2e0']

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

function tuduriFallbackFrames(): FrameItem[] {
  return TUDURI_WORKS.map(w => ({
    id: w.id,
    title: w.name,
    subtitle: `Atelier Tuduri · ${w.year}`,
    collection: 'NFTUDURI-2990b6',
    description: 'Huile 1/1 · NFTUDURI',
    type: 'NonFungibleESDT',
    image: w.url || w.thumb,
    href: `https://explorer.multiversx.com/nfts/${w.id}`,
  }))
}

function prioritizeNfts(nfts: NFT[]): NFT[] {
  const rank = (c: string) => {
    const i = PRIORITY_COLLECTIONS.indexOf(c)
    return i >= 0 ? i : 100
  }
  return [...nfts].sort((a, b) => rank(a.collection) - rank(b.collection))
}

const MODES: { id: Mode; label: string }[] = [
  { id: 'explore', label: 'Explorer' },
  { id: 'mine', label: 'Ma collection' },
  { id: 'pulse', label: 'Salle Pulse' },
  { id: 'map', label: 'Carte' },
]

function ArtworkGrid({ frames, title }: { frames: FrameItem[]; title: string }) {
  if (!frames.length) return null
  return (
    <section className="mt-8 space-y-3 animate-fade-in">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight">{title}</h2>
          <div className="atelier-title-rule mt-1.5" aria-hidden />
        </div>
        <p className="text-[11px] text-zinc-500 tabular-nums">{frames.length} œuvres</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {frames.slice(0, 24).map(f => (
          <a
            key={f.id}
            href={f.href || '#'}
            target="_blank"
            rel="noreferrer"
            className="group card-play rounded-xl border border-white/10 bg-zinc-950/85 overflow-hidden hover:border-violet-500/35 transition-colors shadow-lg shadow-black/20"
          >
            <div className="aspect-gallery bg-zinc-900 relative">
              {f.image ? (
                <img
                  src={f.image}
                  alt={f.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  onError={e => {
                    const el = e.target as HTMLImageElement
                    const src = el.src || ''
                    if (src && !src.includes('weserv.nl') && !src.includes('wsrv.nl')) {
                      const bare = src.replace(/^https?:\/\//i, '')
                      el.src = `https://images.weserv.nl/?url=${encodeURIComponent(bare)}&w=480&output=jpg&q=80`
                      return
                    }
                    el.style.opacity = '0.25'
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">—</div>
              )}
            </div>
            <div className="p-2.5">
              <p className="text-[12px] font-medium text-zinc-100 truncate">{f.title}</p>
              <p className="text-[10px] text-zinc-500 truncate mt-0.5">{f.subtitle}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

export default function MuseumPage() {
  const [params] = useSearchParams()
  const initial = params.get('tab')
  const [mode, setMode] = useState<Mode>(
    initial === 'mine' || initial === 'map' || initial === 'pulse' ? initial : 'explore',
  )
  const [museumId, setMuseumId] = useState('xartists')
  const [museums, setMuseums] = useState<VirtualMuseum[]>(() =>
    buildMuseumNetwork(import.meta.env.BASE_URL || '/'),
  )
  const [allNfts, setAllNfts] = useState<NFT[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [travelBanner, setTravelBanner] = useState<string | null>(null)
  const [blueprint, setBlueprint] = useState<RoomBlueprint>(() =>
    builtinBlueprintForMuseum('xartists'),
  )
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
      q || (typeof window !== 'undefined' ? window.location.search : ''),
    )
    const cityQ = sp.get('city')
    const museumQ = sp.get('museum')
    const travel = consumeTravelDestination()
    const city = travel?.city || cityQ || ''
    const mid =
      travel?.museumId || museumQ || (city ? museumIdForCity(city) : null) || null
    if (city || mid) {
      setTravelBanner(
        city
          ? mid
            ? `Direction ${city} · ${mid}`
            : `Direction ${city}`
          : mid
            ? `Salle ${mid}`
            : null,
      )
      setMuseumId(mid || 'xartists')
      setMode('explore')
    }
  }, [])

  useEffect(() => {
    setBlueprint(builtinBlueprintForMuseum(museumId))
    let c = false
    loadBlueprint(museumId).then(bp => {
      if (!c && bp?.walls?.length) setBlueprint(bp)
    })
    return () => {
      c = true
    }
  }, [museumId])

  const xartistsFrames = useMemo(() => {
    const ranked = prioritizeNfts(allNfts)
    const withImg = ranked.filter(n => preferImage(n))
    const list = (withImg.length ? withImg : ranked).slice(0, 24)
    const frames = framesFromNfts(list)
    if (frames.filter(f => f.image).length >= 4) return frames
    const seen = new Set(frames.map(f => f.id))
    const extra = tuduriFallbackFrames().filter(f => !seen.has(f.id))
    return [...frames, ...extra].slice(0, 24)
  }, [allNfts])

  const visitFrames =
    museum.source === 'onchain'
      ? xartistsFrames
      : museum.works?.length
        ? museum.works
        : xartistsFrames

  useEffect(() => {
    preloadImages(
      visitFrames.map(f => f.image),
      12,
    )
  }, [museumId, visitFrames])

  const myFrames = useMemo(() => framesFromUserNfts(account.nfts || []), [account.nfts])
  const showHallLoader = museum.source === 'onchain' && catalogLoading && !visitFrames.length
  const mineBlueprint = useMemo(() => builtinBlueprintForMuseum('xartists'), [])

  return (
    <div className="animate-fade-in pb-12 max-w-5xl mx-auto">
      <header className="mb-6 space-y-3">
        <p className="section-label">xArtists</p>
        <h1 className="section-title display">Galerie</h1>
        <div className="atelier-title-rule" aria-hidden />
        <p className="section-lead">
          Musées en 3D — tableaux accrochés aux murs. NFTUDURI · TRO · collections MultiversX.
        </p>
      </header>

      <AdSlot id="drop_feature" className="mb-5" />

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
              <p className="text-[12px] text-zinc-500">
                {museum.tagline} · {blueprint.name} · {visitFrames.filter(f => f.image).length} œuvres
              </p>
            </div>
            <p className="text-[11px] text-zinc-600 hidden sm:block">Clic viser · WASD · E œuvre</p>
          </div>

          {showHallLoader ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-950/80 h-[min(70vh,520px)] flex items-center justify-center">
              <p className="text-sm text-zinc-500">Préparation de la salle…</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
              <MuseumHall
                key={museumId}
                blueprint={blueprint}
                frames={visitFrames}
                room={museum.room}
                allowBuy={museum.source === 'onchain'}
                emptyLabel="Chargement des œuvres…"
              />
            </div>
          )}

          <ArtworkGrid
            frames={visitFrames}
            title={
              museumId === 'xartists'
                ? 'Collection accrochée (NFTUDURI & co.)'
                : `Œuvres — ${museum.name}`
            }
          />
        </div>
      )}

      {mode === 'mine' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400 max-w-lg">
            Vos NFT MultiversX accrochés dans le hall 3D xArtists.
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
            <>
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
                <MuseumHall
                  blueprint={mineBlueprint}
                  frames={myFrames}
                  room="dark"
                  allowBuy={false}
                  emptyLabel="Aucun NFT sur cette adresse."
                />
              </div>
              <ArtworkGrid frames={myFrames} title="Ma collection" />
            </>
          )}
        </div>
      )}

      {mode === 'pulse' && (
        <HolderPulseTab nfts={account.nfts || []} frames={visitFrames} connected={connected} />
      )}

      {mode === 'map' && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">Ville → salle 3D dans Explorer.</p>
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
