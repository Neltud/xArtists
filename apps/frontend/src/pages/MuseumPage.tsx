import {localizeChild as xaLocalize, renderChild as xaRender, usePhraseLocale as xaUsePhraseLocale} from '../i18n/phraseRuntime'
/**
 * Galerie — salles 3D + grille · venue wallId → slots NFT.
 * Capacité : max 4 œuvres/mur · 24 public · pack room 4×4.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  framesFromUserNfts,
  type FrameItem,
} from '../components/museum/MuseumCorridor'
import MuseumHall from '../components/museum/MuseumHall'
import AdSlot from '../components/AdSlot'
import {useCopy} from '../experience/state'
import Icon from '../experience/Icon'
import HolderPulseTab from '../components/museum/HolderPulseTab'
import GuidedWorldTour from '../components/museum/GuidedWorldTour'
import VenueWallAssign from '../components/museum/VenueWallAssign'
import { useWallet } from '../context/WalletContext'
import { MUSEUM_CAPACITY, formatWallOccupancy } from '../lib/museumCapacity'
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
import { mergeVenueFrames } from '../lib/venueWallSlots'

type Mode = 'explore' | 'mine' | 'map' | 'pulse' | 'venue'

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
    image: w.thumb,
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

function ArtworkGrid({
  frames,
  title,
  wallCount,
}: {
  frames: FrameItem[]
  title: string
  wallCount?: number
}) {
  if (!frames.length) return null
  const cap =
    wallCount != null && wallCount > 0
      ? formatWallOccupancy(frames.length, wallCount)
      : `${frames.length} œuvre${frames.length > 1 ? 's' : ''} · max ${MUSEUM_CAPACITY.maxArtworksPublic}`
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">{xaRender(title)}</h3>
        <p className="text-[11px] text-zinc-500 tabular-nums">{xaRender(cap)}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {xaRender(frames.map(f => (
          <a
            key={f.id}
            href={f.href || '#'}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/10 overflow-hidden bg-black/30"
          >
            {xaRender(f.image ? (
              <img src={f.image} alt="" className="w-full aspect-square object-cover" loading="lazy" />
            ) : (
              <div className="w-full aspect-square bg-zinc-900" />
            ))}
            <p className="text-[11px] text-zinc-300 truncate px-2 py-1">{xaRender(f.title)}</p>
          </a>
        )))}
      </div>
    </section>
  )
}

export default function MuseumPage() {
  xaUsePhraseLocale()

  const c=useCopy()
  const [params,setParams] = useSearchParams()
  const { connected, address } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const [mode, setMode] = useState<Mode>('explore')
  const [venueRevision, setVenueRevision] = useState(0)
  const [museumId, setMuseumId] = useState('xartists')
  const [museums, setMuseums] = useState<VirtualMuseum[]>(() => VIRTUAL_MUSEUMS)
  const [blueprint, setBlueprint] = useState<RoomBlueprint>(() =>
    builtinBlueprintForMuseum('xartists'),
  )
  const [allNfts, setAllNfts] = useState<NFT[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [travelBanner, setTravelBanner] = useState<string | null>(null)

  const museum = museums.find(m => m.id === museumId) || museums[0] || VIRTUAL_MUSEUMS[0]
  const wallCount = blueprint?.walls?.length ?? 0

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
          if (m.id !== 'xartists') return m
          const sc = (m.works || []).filter(f => f.kind === 'sculpture')
          const existing = frames
          const rest = (m.works || []).filter(f => f.kind !== 'sculpture')
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
    const cityQ = sp.get('city') || params.get('city')
    const museumQ = sp.get('museum') || params.get('museum')
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
  }, [params])

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
    const list = (withImg.length ? withImg : ranked).slice(0, MUSEUM_CAPACITY.maxArtworksPublic)
    const frames = framesFromNfts(list)
    if (frames.filter(f => f.image).length >= 4) return frames
    const seen = new Set(frames.map(f => f.id))
    const extra = tuduriFallbackFrames().filter(f => !seen.has(f.id))
    return [...frames, ...extra].slice(0, MUSEUM_CAPACITY.maxArtworksPublic)
  }, [allNfts])

  const visitFrames =
    museum?.source === 'onchain'
      ? xartistsFrames
      : museum?.works?.length
        ? museum.works
        : xartistsFrames

  useEffect(() => {
    preloadImages(
      visitFrames.map(f => f.image),
      12,
    )
  }, [museumId, visitFrames])

  const myFrames = useMemo(() => framesFromUserNfts(account.nfts || []), [account.nfts])

  const hallFrames = useMemo(
    () => mergeVenueFrames(visitFrames, myFrames),
    // venueRevision forces re-merge after assign
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visitFrames, myFrames, venueRevision],
  )

  return (
    <div className="xa-museum-page space-y-5">
      <header className="space-y-2 pt-2">
        <p className="section-label">{xaRender("Galerie 3D")}</p>
        <h1 className="section-title display">{xaRender(museum?.name || 'Musée')}</h1>
        <div className="atelier-title-rule" aria-hidden />
        <p className="section-lead">
          {xaRender(museum?.tagline || 'Salles immersives · catalogue quotidien Open Access')}
          {xaRender(catalogLoading ? ' · catalogue…' : '')}
        </p>
        {xaRender(wallCount > 0 && (
          <p className="text-[11px] text-zinc-500">
            {xaRender("Capacité salle : ")}{xaRender(wallCount)} {xaRender(" murs · jusqu&apos;à ")}{xaRender(MUSEUM_CAPACITY.maxArtworksPerWall)}{xaRender(' ')}
            {xaRender("œuvres/mur (")}{xaRender(wallCount * MUSEUM_CAPACITY.maxArtworksPerWall)} {xaRender(" slots) · affichage max")}{xaRender(' ')}
            {xaRender(MUSEUM_CAPACITY.maxArtworksPublic)}
          </p>
        ))}
        {xaRender(travelBanner && (
          <p className="text-[12px] text-cyan-200/90 bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-3 py-2">
            {xaRender(travelBanner)}
          </p>
        ))}
      </header>

      <div className="flex flex-wrap gap-2">
        {xaRender((['explore', 'venue', 'map', 'mine', 'pulse'] as Mode[]).map(m => (
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
            {c({explore:'museumVisit',venue:'museumWalls',map:'tours',mine:'museumCollection',pulse:'intelligence'}[m])}
          </button>
        )))}
      </div>

      {xaRender(mode === 'explore' && (
        <>
          <div className="xa-museum-select-row"><label><Icon name="museum" size={20}/><span className="sr-only">{c('museumChoose')}</span><select value={museumId} aria-label={c('museumChoose')} onChange={e=>{const id=e.target.value;setMuseumId(id);setParams(p=>{const next=new URLSearchParams(p);next.set('museum',id);next.delete('city');return next},{replace:true})}}>{museums.map(m=><option key={m.id} value={m.id}>{m.name} · {m.city}</option>)}</select></label><span>{c('museumTouchHelp')}</span></div>
          <MuseumHall
            blueprint={blueprint}
            roomTitle={museum?.name||'xArtists'}
            frames={hallFrames}
            room={museum?.room || 'stone'}
            allowBuy
          />
          <ArtworkGrid frames={hallFrames} title={xaLocalize("Œuvres de la salle")} wallCount={wallCount} />
          <AdSlot id="drop_feature" />
        </>
      ))}

      {xaRender(mode === 'venue' && (
        <>
          <VenueWallAssign onChanged={() => setVenueRevision(v => v + 1)} />
          <MuseumHall
            blueprint={blueprint}
            roomTitle={museum?.name||'xArtists'}
            frames={hallFrames}
            room={museum?.room || 'cyber'}
            allowBuy={false}
            emptyLabel="Assigne des NFT à un mur loué"
          />
          <ArtworkGrid frames={hallFrames} title={xaLocalize("Vue mur / venue")} wallCount={wallCount} />
        </>
      ))}

      {xaRender(mode === 'map' && <GuidedWorldTour />)}

      {xaRender(mode === 'mine' && (
        <>
          {xaRender(!connected ? (
            <button type="button" className="btn-primary" onClick={requestOpenConnect}>
              {xaRender("Connecter pour voir ma collection ")}</button>
          ) : (
            <>
              {xaRender(myFrames.length > 0 && (
                <MuseumHall
                  blueprint={blueprint}
                  roomTitle={c('museumCollection')}
                  frames={myFrames}
                  room="cyber"
                  allowBuy={false}
                />
              ))}
              <ArtworkGrid frames={myFrames} title={xaLocalize("Ma collection")} wallCount={wallCount} />
            </>
          ))}
        </>
      ))}

      {xaRender(mode === 'pulse' && (
        <HolderPulseTab nfts={account.nfts || []} frames={hallFrames} connected={connected} />
      ))}

      <p className="text-[11px] text-zinc-600">
        <button
          type="button"
          className="underline-offset-2 hover:underline"
          onClick={() => setMode('venue')}
        >
          {xaRender("Louer un mur / assigner NFT ")}</button>
        {xaRender(' · ')}
        {xaRender("Pack IA = 1 salle privée (")}{xaRender(MUSEUM_CAPACITY.wallsPerPackRoom)} {xaRender(" murs ×")}{xaRender(' ')}
        {xaRender(MUSEUM_CAPACITY.maxArtworksPerWall)} {xaRender(" œuvres) ")}{xaRender(' · ')}
        {xaRender("Catalogue Met refresh quotidien (Open Access) ")}</p>
    </div>
  )
}
