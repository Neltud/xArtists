/**
 * LIA Immersive Museum — Catzligue · Mydee · World Tour · VR Core (gated).
 * Premium roadmap module · no fake TX success · real NFT frames when available.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'
import LiaHost from '../components/museum/LiaHost'
import MuseumCorridor, {
  framesFromUserNfts,
  type FrameItem,
} from '../components/museum/MuseumCorridor'
import GuidedWorldTour from '../components/museum/GuidedWorldTour'
import { MUSEUM_SPACES, type MuseumSpaceId } from '../lib/museumSpaces'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { loadCatalogIndex, indexToPartialCollections } from '../lib/catalogLoader'
import { nftImageUrl, type NFT } from '../types/nft'
import { requestOpenConnect } from '../lib/walletEvents'

function framesFromCatalog(nfts: NFT[]): FrameItem[] {
  return nfts.slice(0, 24).map(n => ({
    id: n.identifier,
    title: n.name || n.identifier,
    subtitle: n.collection || n.type,
    image: nftImageUrl(n),
    href: `https://explorer.multiversx.com/nfts/${n.identifier}`,
  }))
}

export default function MuseumPage() {
  const [space, setSpace] = useState<MuseumSpaceId>('catzligue')
  const [catalogFrames, setCatalogFrames] = useState<FrameItem[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const { connected, address } = useWallet()
  const account = useUserAccount(connected ? address : null)

  useEffect(() => {
    let c = false
    ;(async () => {
      const { index, full } = await loadCatalogIndex()
      if (c) return
      let nfts: NFT[] = []
      if (full?.collections?.length) {
        nfts = full.collections.flatMap(col => col.nfts || []).slice(0, 24)
      } else if (index?.collections?.length) {
        const partial = indexToPartialCollections(index.collections)
        nfts = partial.flatMap(col => col.nfts || []).slice(0, 24)
      }
      setCatalogFrames(framesFromCatalog(nfts))
      setCatalogLoading(false)
    })()
    return () => {
      c = true
    }
  }, [])

  const mydeeFrames = useMemo(() => framesFromUserNfts(account.nfts || []), [account.nfts])
  const current = MUSEUM_SPACES.find(s => s.id === space)!

  return (
    <div className="animate-fade-in space-y-6 pb-12 max-w-4xl mx-auto">
      <PageGuide page="gallery" />

      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.25em] text-fuchsia-400/90 font-semibold">
          Musée immersif · LIA host
        </p>
        <h1 className="display text-3xl sm:text-4xl">
          Musée <span className="gradient-text">xArtists</span>
        </h1>
        <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
          Galerie 3D (corridor CSS) · visite guidée mondiale · Mydee on-chain. VR Core / WebXR =
          premium roadmap (LIA Pass). Aucune TX simulée.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {MUSEUM_SPACES.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSpace(s.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              space === s.id
                ? 'border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-100'
                : 'border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            {s.name}
            {s.access === 'lia_pass' && (
              <span className="ml-1 text-[9px] text-amber-300/90">PASS</span>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-zinc-500 flex flex-wrap gap-x-4 gap-y-1">
        <span>
          Espace · <strong className="text-zinc-300">{current.name}</strong>
        </span>
        <span>{current.tagline}</span>
        <span className="text-zinc-600">
          accès{' '}
          {current.access === 'free' ? 'libre' : current.access === 'wallet' ? 'wallet' : 'LIA Pass'}
        </span>
      </div>

      {space === 'catzligue' && (
        <div className="relative space-y-3">
          {catalogLoading ? (
            <p className="text-sm text-zinc-500">Chargement catalogue…</p>
          ) : (
            <MuseumCorridor
              frames={catalogFrames}
              theme="cyber"
              emptyLabel="Catalogue vide — publier data/xartists_collections ou ouvrir le Studio."
            />
          )}
          <LiaHost space="catzligue" />
          <p className="text-[11px] text-zinc-600">
            <Link to="/gallery" className="text-violet-300 underline">
              Galerie 2D
            </Link>
            {' · '}
            <Link to="/studio" className="text-violet-300 underline">
              Studio
            </Link>
          </p>
        </div>
      )}

      {space === 'mydee' && (
        <div className="relative space-y-3">
          {!connected ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-6 text-center space-y-3">
              <p className="text-sm text-amber-100">
                Connecte ton wallet pour charger Mydee (NFTs on-chain).
              </p>
              <button type="button" className="btn-primary text-sm" onClick={() => requestOpenConnect()}>
                🔗 Connect
              </button>
            </div>
          ) : account.loading && !mydeeFrames.length ? (
            <p className="text-sm text-zinc-500">Lecture NFTs…</p>
          ) : (
            <MuseumCorridor
              frames={mydeeFrames}
              theme="sanctuary"
              emptyLabel="Aucun NFT NonFungible/SFT sur cette adresse."
            />
          )}
          <LiaHost space="mydee" />
          <p className="text-[11px] text-zinc-600">
            <Link to="/wallet" className="text-cyan-300 underline">
              Wallet · My NFTs
            </Link>
          </p>
        </div>
      )}

      {space === 'world_tour' && <GuidedWorldTour />}

      {space === 'vr_core' && (
        <div className="relative rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/40 to-black px-6 py-10 space-y-4">
          <h2 className="text-xl font-bold text-white">VR Core — roadmap</h2>
          <ul className="text-sm text-zinc-400 space-y-2 list-disc pl-5">
            <li>Stack cible : React Three Fiber + @react-three/xr (WebXR)</li>
            <li>Accès : NFT LIA Pass (mint SC pending — codeHash null)</li>
            <li>Freemium : Catzligue + visite guidée gratuits · Mydee = wallet</li>
          </ul>
          <p className="text-xs text-amber-200/90 border border-amber-500/30 rounded-lg px-3 py-2">
            Pas d’immersion casque dans cette build. Corridor CSS + guide mondial = fondation v1.
          </p>
          <LiaHost space="vr_core" />
        </div>
      )}

      <section className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-[11px] text-zinc-500 leading-relaxed">
        <strong className="text-zinc-400">Sécurité</strong> — ce module n’émet aucune TX. Achats /
        mint passent par Guardian + signature wallet réelle (TransactionWatcher). Pas de setTimeout
        fake-success.
      </section>
    </div>
  )
}
