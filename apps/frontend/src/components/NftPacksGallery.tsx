/**
 * Galerie packs NFT — 3 séries limitées (Pulse · Yield · Sentinel).
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import {
  fetchNftPacksCatalog,
  loadOwnedPacks,
  type NftPackSeries,
} from '../lib/nftPacks'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'

const TIER_BG: Record<string, string> = {
  pulse: 'from-emerald-600/40 to-green-900/20 border-emerald-500/40',
  yield: 'from-teal-600/40 to-cyan-900/20 border-teal-500/40',
  sentinel: 'from-violet-600/40 to-indigo-900/20 border-violet-500/40',
}

export default function NftPacksGallery() {
  const { connected } = useWallet()
  const [series, setSeries] = useState<NftPackSeries[]>([])
  const [owned, setOwned] = useState<PackId[]>([])
  const [sc, setSc] = useState('pending_deploy')

  useEffect(() => {
    setOwned(loadOwnedPacks())
    fetchNftPacksCatalog().then(c => {
      if (c?.series?.length) {
        setSeries(c.series)
        setSc(c.mint?.sc_status || 'pending')
      } else {
        setSeries(
          AGENT_PACKS.map(p => ({
            id: p.id,
            name: p.name,
            tier: p.id === 'pulse' ? 'A' : p.id === 'yield' ? 'B' : 'C',
            max_supply: p.id === 'pulse' ? 333 : p.id === 'yield' ? 500 : 777,
            price_eur: p.priceEur.list,
            attributes: [],
            image: '',
            description: p.tagline,
          }))
        )
      }
    })
  }, [])

  return (
    <section className="space-y-3" aria-labelledby="nft-packs-title">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">NFT · 3 séries</p>
          <h2 id="nft-packs-title" className="text-lg font-black text-white">
            Packs Agents NFT
          </h2>
        </div>
        <span className="text-[10px] uppercase px-2 py-0.5 rounded-full border border-amber-500/40 text-amber-200">
          Mint SC: {sc}
        </span>
      </div>

      <p className="text-[12px] text-zinc-500">
        Chaque pack = NFT d’accès (badge + entitlements). Pas un fonds. Tours artistiques →{' '}
        <Link to="/tours" className="text-cyan-400 underline">
          /tours
        </Link>
        .
      </p>

      <div className="grid sm:grid-cols-3 gap-3">
        {series.map(s => {
          const pack = AGENT_PACKS.find(p => p.id === s.id)
          const isOwned = owned.includes(s.id)
          return (
            <article
              key={s.id}
              className={`rounded-2xl border bg-gradient-to-br p-4 flex flex-col min-h-[200px] ${TIER_BG[s.id] || 'border-white/10'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-3xl" aria-hidden>
                  {pack?.icon || '🎟'}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  Tier {s.tier} · max {s.max_supply}
                </span>
              </div>
              <h3 className="font-bold text-white text-lg">{s.name}</h3>
              <p className="text-[11px] text-zinc-400 flex-1 mt-1">{s.description}</p>
              <p className="text-sm font-semibold text-white mt-2">{s.price_eur} €</p>
              {isOwned && (
                <p className="text-[10px] text-emerald-300 mt-1">Détenu (local / paper)</p>
              )}
              <div className="mt-3 flex flex-col gap-1.5">
                {!connected ? (
                  <button type="button" className="btn-secondary text-[11px] py-1.5" onClick={requestOpenConnect}>
                    Connecter pour mint
                  </button>
                ) : (
                  <Link to="/agents" className="btn-primary text-[11px] py-1.5 text-center">
                    Acheter / checkout
                  </Link>
                )}
                <Link to="/my-packs" className="text-[10px] text-zinc-500 text-center underline">
                  My Packs
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
