import { useState, useEffect } from 'react'
import { useMultiversX } from '../hooks/useMultiversX'

const MVX_API = 'https://api.multiversx.com'
const COLLECTIONS = [
  { id: 'AGR-9bd53e', name: 'Agreste', emoji: '🌿' },
  { id: 'ALISTOR-a646bc', name: 'Alistor', emoji: '✨' },
  { id: 'ASFT-a6273a', name: 'xArtists SFT', emoji: '🎨' },
  { id: 'BGG-2b627c', name: 'Bgg', emoji: '🔵' },
  { id: 'HP47X2-b71543', name: 'HP47X2', emoji: '🔥' },
  { id: 'MAS-5189b6', name: 'Mas', emoji: '🌊' },
  { id: 'NFTUDURI-2990b6', name: 'NFTuduri', emoji: '💫' },
  { id: 'XTR-e5072b', name: 'XTR', emoji: '⚡' },
  { id: 'XAUS-d9cf1f', name: 'XAUS', emoji: '🌟' },
  { id: 'XAR-cee2e0', name: 'XAR', emoji: '🌈' },
  { id: 'TRO-652d6d', name: 'TRO NFT', emoji: '🎨' },
]

const CONTRACTS = [
  { name: 'NFT Staking', addr: 'erd1qqqqqqqqqqqqqpgqmhtx5cctwwtatyaluycjfucre9y5vq2xyj7sqxr8cl', icon: '🔒' },
  { name: 'TRO Governance', addr: 'erd1qqqqqqqqqqqqqpgqrscvsxseyw04l0urzgnm2er5mxd2z64nyj7s6e0ca8', icon: '🗳️' },
  { name: 'Marketplace', addr: 'erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t', icon: '🛒' },
  { name: 'NFT Minter', addr: 'erd1qqqqqqqqqqqqqpgq00a2jzre64akaw4jx257gwwyfxxd8fzfyj7snyztkn', icon: '🎨' },
]

export default function Marketplace() {
  const { prices, xartists } = useMultiversX()
  const [listings, setListings] = useState<any[]>([])

  useEffect(() => {
    // Fetch a few listings from the first collections
    const fetchListings = async () => {
      const results: any[] = []
      for (const col of COLLECTIONS.slice(0, 4)) {
        try {
          const res = await fetch(`${MVX_API}/collections/${col.id}/nfts?size=3&sort=price&order=asc`)
          const nfts = await res.json()
          for (const nft of nfts.slice(0, 2)) {
            results.push({ ...nft, collectionName: col.name, collectionEmoji: col.emoji })
          }
        } catch {}
      }
      setListings(results)
    }
    fetchListings()
  }, [])

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black">🎨 Marketplace xArtists</h1>
        <p className="text-gray-500 mt-1">NFTs, Arts Physiques, Escrow RWA — 11 collections mainnet</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Collections</p>
          <p className="text-2xl font-black">11</p>
          <p className="text-xs text-gray-500">Mainnet MultiversX</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">NFTs Wallet</p>
          <p className="text-2xl font-black">{xartists?.collections?.nfts_in_wallet ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">$TRO Balance</p>
          <p className="text-2xl font-black mono">{(xartists?.tro_token?.balance_wallet ?? 0).toFixed(2)}</p>
          <p className="text-xs text-gray-500">TRO-94c925</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">NFT Staking</p>
          <p className="text-2xl font-black">{xartists?.staking?.nft_staking_active ? '✅ Actif' : '⏳ Pending'}</p>
        </div>
      </div>

      {/* Collections grid */}
      <div className="card mb-8">
        <h2 className="text-lg font-bold mb-4">🖼️ Collections Mainnet</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {COLLECTIONS.map(col => (
            <a
              key={col.id}
              href={`https://xoxno.com/collection/${col.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 p-3 rounded-xl bg-[#111118] border border-[#2a2a3a] hover:border-purple-500 transition-all"
            >
              <span className="text-xl">{col.emoji}</span>
              <div>
                <p className="text-sm font-semibold">{col.name}</p>
                <p className="text-[10px] text-gray-500 mono">{col.id.split('-')[0]}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* NFT Listings */}
      {listings.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-lg font-bold mb-4">🛒 Listings en vente</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((nft, i) => (
              <div key={i} className="bg-[#111118] rounded-xl p-4 border border-[#2a2a3a] hover:border-purple-500 transition-all">
                <p className="text-xs text-gray-500">{nft.collectionEmoji} {nft.collectionName}</p>
                <p className="font-semibold text-sm mt-1 truncate">{nft.name || 'NFT'}</p>
                <p className="text-purple-400 font-bold mt-2">{nft.identifier?.split('-').slice(-1)[0] || '—'}</p>
                <a
                  href={`https://xoxno.com/nft/${nft.identifier}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary block text-center text-xs mt-3 py-2"
                >
                  Voir sur XOXNO
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Escrow RWA */}
      <div className="card mb-8">
        <h2 className="text-lg font-bold mb-4">🏗️ Escrow RWA — Arts Physiques</h2>
        <div className="bg-[#111118] rounded-xl p-6">
          <div className="flex items-start gap-4">
            <span className="text-4xl">🎨</span>
            <div>
              <h3 className="font-bold text-lg">Tuduri Original — Galerie xArtists 2026</h3>
              <p className="text-sm text-gray-400 mt-1 mb-4">
                Tokenisation d’œuvres physiques via $TRO. Chaque NFT représente un certificat d’authenticité on-chain.
                Galerie physique à Saint-Maur-des-Fossés.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Token $TRO</p>
                  <p className="mono font-semibold">TRO-94c925</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Prix $TRO</p>
                  <p className="font-semibold text-purple-400">${prices.tro.toFixed(8)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Artiste</p>
                  <p className="font-semibold">@tudurioriginal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Contracts */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4">🔗 Smart Contracts Mainnet</h2>
        <div className="space-y-3">
          {CONTRACTS.map(c => (
            <div key={c.addr} className="flex items-center justify-between p-3 rounded-xl bg-[#111118] border border-[#2a2a3a]">
              <div className="flex items-center gap-3">
                <span className="text-xl">{c.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className="text-xs mono text-gray-500">{c.addr.slice(0, 20)}...{c.addr.slice(-6)}</p>
                </div>
              </div>
              <a
                href={`https://explorer.multiversx.com/accounts/${c.addr}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Explorer
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
