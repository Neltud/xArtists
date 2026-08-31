/**
 * Réseau de musées — xArtists 1er, puis musées-ville (Met Open Access).
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'
import MuseumCorridor, {
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
import InfoTip from '../components/InfoTip'

type Tab = 'visit' | 'mydee' | 'world_tour'

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
  const [tab, setTab] = useState<Tab>('visit')
  const [museumId, setMuseumId] = useState<string>('xartists')
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
    const params = new URLSearchParams(
      q || (typeof window !== 'undefined' ? window.location.search : '')
    )
    const cityQ = params.get('city')
    const travel = consumeTravelDestination()
    if (travel?.city || cityQ) {
      const city = travel?.city || cityQ || ''
      const mid = museumIdForCity(city)
      setTravelBanner(
        mid
          ? `Voyage LIA : ${city} → ${mid}. Œuvres iconiques prêtes.`
          : `Voyage LIA : ${city}. Choisis une ville du réseau ou xArtists.`
      )
      setMuseumId(mid || 'xartists')
      setTab('visit')
    }
  }, [])

  const xartistsFrames = useMemo(() => {
    const withImg = allNfts.filter(n => preferImage(n))
    return framesFromNfts((withImg.length ? withImg : allNfts).slice(0, 48))
  }, [allNfts])

  const visitFrames = museum.source === 'onchain' ? xartistsFrames : museum.works

  const myNftFrames = useMemo(
    () => framesFromUserNfts(account.nfts || []),
    [account.nfts]
  )

  return (
    <div className="animate-fade-in space-y-4 pb-12 max-w-4xl mx-auto">
      <PageGuide page="gallery" />

      <header className="space-y-1">
        <p className="section-label text-fuchsia-400/80">Réseau de musées</p>
        <h1 className="page-title">
          Musée <span className="gradient-text">xArtists</span>
        </h1>
        <p className="page-sub inline-flex flex-wrap items-center gap-1">
          Visite libre · Mes NFTs · musées-ville
          <InfoTip>
            <strong className="text-white block mb-1">Onglets</strong>
            <span className="text-zinc-400">
              Visite = galerie publique + Louvre/Rijks… · Mes NFTs = wallet · Guide = villes carte.
            </span>
          </InfoTip>
        </p>
      </header>

      {travelBanner && (
        <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
          {travelBanner}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ['visit', 'Visite'],
            ['mydee', 'Mes NFTs'],
            ['world_tour', 'Guide mondial'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              tab === id
                ? 'border-fuchsia-400/45 bg-fuchsia-500/15 text-fuchsia-100'
                : 'border-white/10 text-zinc-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'visit' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
            {museums.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMuseumId(m.id)}
                className={`snap-start shrink-0 rounded-xl border px-3 py-2 text-left min-w-[8.5rem] transition-colors ${
                  museumId === m.id
                    ? 'border-cyan-400/45 bg-cyan-500/10'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                <p className="text-[11px] font-semibold text-white truncate">{m.name}</p>
                <p className="text-[10px] text-zinc-500 truncate">
                  {m.city}
                  {m.id === 'xartists' && <span className="text-cyan-300/90"> · 1er</span>}
                  {m.source === 'public_domain' && m.works?.length
                    ? ` · ${m.works.length}`
                    : ''}
                </p>
              </button>
            ))}
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-200">{museum.name}</p>
            <p className="text-[11px] text-zinc-500">{museum.tagline}</p>
          </div>

          {museum.source === 'onchain' && catalogLoading ? (
            <p className="text-sm text-zinc-500">Chargement catalogue MultiversX…</p>
          ) : (
            <MuseumGameHall
              key={museumId}
              frames={visitFrames}
              room={museum.room}
              allowBuy={museum.source === 'onchain'}
              emptyLabel={
                museum.source === 'onchain'
                  ? 'Aucune œuvre catalogue pour l’instant.'
                  : 'Aucune œuvre pour ce musée.'
              }
            />
          )}
        </div>
      )}

      {tab === 'mydee' && (
        <div className="space-y-3">
          {!connected ? (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-6 text-center space-y-3">
              <p className="text-sm text-amber-100/90">
                Connecte ton wallet pour afficher tes NFTs dans la salle.
              </p>
              <button type="button" className="btn-primary text-sm" onClick={() => requestOpenConnect()}>
                Connect
              </button>
            </div>
          ) : account.loading && !myNftFrames.length ? (
            <p className="text-sm text-zinc-500">Lecture NFTs…</p>
          ) : (
            <MuseumCorridor
              frames={myNftFrames}
              theme="sanctuary"
              emptyLabel="Aucun NFT sur cette adresse."
            />
          )}
        </div>
      )}

      {tab === 'world_tour' && <GuidedWorldTour />}

      <p className="text-[11px] text-zinc-600">
        <Link to="/gallery" className="text-violet-300/90 hover:underline">
          Galerie 2D
        </Link>
        {' · '}
        <Link to="/tours" className="text-violet-300/90 hover:underline">
          Carte Tours
        </Link>
      </p>
    </div>
  )
}
