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
    <div className="animate-fade-in space-y-6 pb-12 max-w-4xl mx-auto">
      <PageGuide page="gallery" />

      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.25em] text-fuchsia-400/90 font-semibold">
          Musée immersif · données MultiversX
        </p>
        <h1 className="display text-3xl sm:text-4xl">
          Musée <span className="gradient-text">xArtists</span>
        </h1>
        <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
          Catzligue = catalogue public réel · Mydee = tes NFTs on-chain · visite guidée mondiale.
          {allNfts.length > 0 && (
            <span className="text-zinc-500">
              {' '}
              · {allNfts.length} œuvres · {collections.length} collections
            </span>
          )}
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
      </div>

      {space === 'catzligue' && (
        <div className="relative space-y-3">
          {collections.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
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
                  {c.name || c.identifier} ({c.nft_count || c.nfts?.length || 0})
                </button>
              ))}
            </div>
          )}

          {catalogLoading ? (
            <p className="text-sm text-zinc-500">Chargement du catalogue MultiversX…</p>
          ) : catalogError && !catalogFrames.length ? (
            <p className="text-sm text-rose-300/90">{catalogError}</p>
          ) : (
            <MuseumCorridor
              frames={catalogFrames}
              theme="cyber"
              emptyLabel="Aucune œuvre avec média dans ce filtre."
            />
          )}
          <LiaHost
            space="catzligue"
            lineExtra={
              catalogFrames.length
                ? `${catalogFrames.length} cadres chargés depuis le catalogue xArtists (mainnet).`
                : null
            }
          />
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
              <button
                type="button"
                className="btn-primary text-sm"
                onClick={() => requestOpenConnect()}
              >
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
        <div className="relative rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/50 via-black to-[#0a0612] px-5 sm:px-6 py-8 sm:py-10 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-violet-300/80 font-semibold">
                Roadmap · WebXR
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">VR Core</h2>
            </div>
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[10px] text-amber-200 font-semibold">
              LIA Pass · mint SC pending
            </span>
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed max-w-xl">
            Stack cible : <strong className="text-zinc-100">React Three Fiber</strong> +{' '}
            <code className="text-violet-300 text-xs">@react-three/xr</code> (WebXR). Accès : NFT{' '}
            <strong className="text-zinc-100">LIA Pass</strong> (codeHash null — pas encore minté).
          </p>

          <ul className="grid sm:grid-cols-2 gap-2 text-[12px] text-zinc-400">
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <span className="text-emerald-300/90 font-medium">Gratuit</span>
              <br />
              Catzligue · visite guidée mondiale
            </li>
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <span className="text-cyan-300/90 font-medium">Wallet</span>
              <br />
              Mydee — tes NFTs on-chain
            </li>
            <li className="rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2 sm:col-span-2">
              <span className="text-violet-200 font-medium">LIA Pass</span>
              <br />
              Immersion casque — pas dans cette build. Corridor CSS + guide = fondation v1.
            </li>
          </ul>

          <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-[11px] text-zinc-500 leading-relaxed">
            <strong className="text-zinc-400">Sécurité</strong> — ce module n’émet aucune TX.
            Achats / mint passent par Guardian + signature wallet réelle (TransactionWatcher). Pas de
            setTimeout fake-success.
          </div>

          <div className="relative min-h-[80px]">
            <LiaHost space="vr_core" />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={() => setSpace('catzligue')}
            >
              ← Catzligue (gratuit)
            </button>
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={() => setSpace('world_tour')}
            >
              Visite guidée
            </button>
          </div>
        </div>
      )}

      <section className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-[11px] text-zinc-500 leading-relaxed">
        Catalogue : <code className="text-zinc-400">data/xartists_collections.json</code> · médias
        MultiversX CDN / IPFS · aucune TX simulée.
      </section>
    </div>
  )
}
