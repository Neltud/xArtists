/**
 * Galerie — salles 3D + grille œuvres toujours visible.
 * Fallback NFTUDURI / TUDURI si catalogue vide.
 * Catalogue : VITE_CATALOG_API (Akash) puis JSON GitHub + refresh quotidien Met.
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
import { loadDailyMuseumCatalog, dailyWorksToFrames } from '../lib/loadDailyMuseumCatalog'

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

function ArtworkGrid({ frames, title }: { frames: FrameItem[]; title: string }) {
  if (!frames.length) return null
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-[11px] text-zinc-500 tabular-nums">{frames.length} œuvres</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {frames.slice(0, 24).map(f => (
          <div
            key={f.id}
            className="rounded-xl border border-white/10 bg-black/40 overflow-hidden"
          >
            {f.image ? (
              <img src={f.image} alt="" className="w-full aspect-[4/5] object-cover" loading="lazy" />
            ) : (
              <div className="aspect-[4/5] flex items-center justify-center text-zinc-600 text-xs">—</div>
            )}
            <p className="text-[11px] text-zinc-300 px-2 py-1.5 truncate">{f.title}</p>
          </div>
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
    ;(async () => {
      const list = await loadMuseumNetwork(import.meta.env.BASE_URL || '/')
      if (cxl) return
      if (list.length) setMuseums(list)
      const daily = await loadDailyMuseumCatalog()
      if (cxl || !daily?.works?.length) return
      const frames = dailyWorksToFrames(daily.works)
      setMuseums(prev =>
        prev.map(m => {
          if (m.id === 'xartists') return m
          const existing = m.works || []
          const ids = new Set(existing.map(w => w.id))
          const extra = frames.filter(f => !ids.has(f.id))
          if (!extra.length) return m
          const sc = extra.filter(f => f.kind === 'sculpture')
          const rest = extra.filter(f => f.kind !== 'sculpture')
          return {
            ...m,
            works: [...sc, ...existing, ...rest].slice(0, 28),
          }
        }),
      )
    })()
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

  return (
    <div className="animate-fade-in space-y-4 pb-16 max-w-3xl mx-auto">
      <header className="space-y-2 pt-2">
        <p className="section-label">Galerie 3D</p>
        <h1 className="section-title display">{museum?.name || 'Musée'}</h1>
        <div className="atelier-title-rule" aria-hidden />
        <p className="section-lead">
          {museum?.tagline || 'Salles immersives · catalogue quotidien Open Access'}
          {catalogLoading ? ' · catalogue…' : ''}
        </p>
        {travelBanner && (
          <p className="text-[12px] text-cyan-200/90 bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-3 py-2">
            {travelBanner}
          </p>
        )}
      </header>

      <div className="flex flex-wrap gap-2">
        {(['explore', 'map', 'mine', 'pulse'] as Mode[]).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-full px-3 py-1.5 text-[12px] border ${
              mode === m
                ? 'border-violet-400/50 bg-violet-500/20 text-white'
                : 'border-white/10 text-zinc-400'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === 'explore' && (
        <>
          <div className="flex flex-wrap gap-2">
            {museums.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMuseumId(m.id)}
                className={`rounded-xl px-3 py-1.5 text-[12px] border ${
                  museumId === m.id
                    ? 'border-amber-400/40 bg-amber-500/10 text-amber-50'
                    : 'border-white/10 text-zinc-400'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
          <MuseumHall
            blueprint={blueprint}
            frames={visitFrames}
            room={museum?.room || 'stone'}
            allowBuy
          />
          <ArtworkGrid frames={visitFrames} title="Œuvres de la salle" />
          <AdSlot id="drop_feature" />
        </>
      )}

      {mode === 'map' && <GuidedWorldTour />}

      {mode === 'mine' && (
        <>
          {!connected ? (
            <button type="button" className="btn-primary" onClick={requestOpenConnect}>
              Connecter pour voir ma collection
            </button>
          ) : (
            <>
              {myFrames.length > 0 && (
                <MuseumHall
                  blueprint={blueprint}
                  frames={myFrames}
                  room="cyber"
                  allowBuy={false}
                />
              )}
              <ArtworkGrid frames={myFrames} title="Ma collection" />
            </>
          )}
        </>
      )}

      {mode === 'pulse' && (
        <HolderPulseTab nfts={account.nfts || []} frames={visitFrames} connected={connected} />
      )}

      <p className="text-[11px] text-zinc-600">
        <Link to="/venues" className="underline-offset-2 hover:underline">
          Louer un mur
        </Link>
        {' · '}
        Catalogue Met refresh quotidien (Open Access)
      </p>
    </div>
  )
}
