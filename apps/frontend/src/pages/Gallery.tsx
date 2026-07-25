import { useState, useEffect } from 'react';
import LIAChatWidget from '../components/LIAChatWidget';

const MVX_API = 'https://api.multiversx.com'

const FEATURED_COLLECTIONS = [
  { id: 'NFTUDURI-2990b6', name: 'NFTuduri', emoji: '💫', artist: '@tudurioriginal' },
  { id: 'XAR-cee2e0', name: 'XAR', emoji: '🌈', artist: '@tudurioriginal' },
  { id: 'AGR-9bd53e', name: 'Agreste', emoji: '🌿', artist: '@tudurioriginal' },
  { id: 'ALISTOR-a646bc', name: 'Alistor', emoji: '✨', artist: '@tudurioriginal' },
]

interface NftItem {
  identifier: string
  name: string
  url?: string
  collection: string
  collectionName: string
  collectionEmoji: string
  aiScore: number
}

export default function Gallery() {
  const [nfts, setNfts] = useState<NftItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const results: NftItem[] = []
      for (const col of FEATURED_COLLECTIONS) {
        try {
          const res = await fetch(`${MVX_API}/collections/${col.id}/nfts?size=4&withOwner=false`)
          const data: Array<{ identifier: string; name?: string; url?: string; media?: Array<{ url?: string }> }> = await res.json()
          for (const nft of data) {
            results.push({
              identifier: nft.identifier,
              name: nft.name ?? nft.identifier,
              url: nft.url ?? nft.media?.[0]?.url,
              collection: col.id,
              collectionName: col.name,
              collectionEmoji: col.emoji,
              // Deterministic pseudo-score based on identifier hash for demo
              aiScore: 70 + (nft.identifier.charCodeAt(nft.identifier.length - 2) % 30),
            })
          }
        } catch {
          // Collection may be empty or unreachable
        }
      }
      setNfts(results)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black">🖼️ Galerie xArtists</h1>
        <p className="text-gray-500 mt-1">Art Phygital tokenisé — Scores LIA IA • 11 collections MultiversX Mainnet</p>
      </div>

      {/* Artist spotlight */}
      <div className="card mb-8 flex items-start gap-5">
        <span className="text-5xl">🎨</span>
        <div>
          <h2 className="text-xl font-bold">Tuduri Original</h2>
          <p className="text-sm text-gray-400 mt-1">
            Artiste plasticien & développeur Web3 basé à Saint-Maur-des-Fossés. Ses œuvres physiques sont tokenisées
            on-chain via $TRO, chaque NFT représentant un certificat d'authenticité immuable.
          </p>
          <div className="flex gap-3 mt-3">
            <span className="badge-purple">11 collections</span>
            <span className="badge-green">✅ Mainnet</span>
            <span className="badge-gray">RWA Phygital</span>
          </div>
        </div>
      </div>

      {/* NFT Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card h-64 animate-pulse bg-[#16161f]" />
          ))}
        </div>
      ) : nfts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {nfts.map(nft => (
            <div
              key={nft.identifier}
              className="card flex flex-col gap-3 hover:border-purple-500/60 transition-all"
            >
              {/* Artwork image or placeholder */}
              <div className="aspect-square rounded-xl bg-[#111118] flex items-center justify-center overflow-hidden">
                {nft.url ? (
                  <img src={nft.url} alt={nft.name} className="w-full h-full object-cover rounded-xl" loading="lazy" />
                ) : (
                  <span className="text-5xl">{nft.collectionEmoji}</span>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">{nft.collectionEmoji} {nft.collectionName}</p>
                <p className="font-semibold text-sm mt-0.5 truncate">{nft.name}</p>
              </div>
              {/* AI Score */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Score IA</span>
                <span className={`text-xs font-bold ${nft.aiScore >= 90 ? 'text-green-400' : nft.aiScore >= 75 ? 'text-yellow-400' : 'text-orange-400'}`}>
                  {nft.aiScore}/100
                </span>
              </div>
              <div className="h-1 rounded-full bg-[#111118]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${nft.aiScore}%`,
                    background: nft.aiScore >= 90
                      ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                      : 'linear-gradient(90deg, #7c3aed, #2563eb)',
                  }}
                />
              </div>
              <a
                href={`https://xoxno.com/nft/${nft.identifier}`}
                target="_blank"
                rel="noreferrer"
                className="btn-primary text-center text-xs py-2"
              >
                Voir sur XOXNO
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16 mb-8">
          <p className="text-4xl mb-3">🖼️</p>
          <p className="text-gray-400">Aucun NFT chargé pour le moment.</p>
          <p className="text-xs text-gray-500 mt-1">Les collections sont disponibles sur XOXNO.</p>
        </div>
      )}

      {/* Browse all collections CTA */}
      <div className="card text-center">
        <p className="text-gray-400 text-sm mb-4">Explorez toutes les 11 collections xArtists sur les marketplaces MultiversX</p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="https://xoxno.com/creator/erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6" target="_blank" rel="noreferrer" className="btn-primary text-sm">🖼️ XOXNO</a>
          <a href="https://deadrare.io" target="_blank" rel="noreferrer" className="btn-secondary text-sm">💀 DeadRare</a>
          <a href="https://frameit.gg" target="_blank" rel="noreferrer" className="btn-secondary text-sm">🖼 FrameIt</a>
        </div>
      </div>

      <LIAChatWidget />
    </div>
  );
}