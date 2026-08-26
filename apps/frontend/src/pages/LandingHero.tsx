/**
 * Hero d'accueil — inspiré tro-art-studio.lovable.app
 * Supply $TRO plafonné à 500 000 (max). Honesty: private / paper-first.
 */

import { Link } from 'react-router-dom'
import { requestOpenConnect } from '../lib/walletEvents'

type Props = {
  onConnect?: () => void
  connected?: boolean
}

export default function LandingHero({ onConnect, connected }: Props) {
  const handleConnect = () => {
    if (onConnect) onConnect()
    else requestOpenConnect()
  }

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#12121a] via-[#0a0a12] to-[#1a1030] p-6 sm:p-10 mb-6"
      aria-labelledby="hero-title"
    >
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="relative max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300 mb-4">
          Private · Paper LIA · market après codeHash
        </div>

        <h1 id="hero-title" className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] mb-4">
          AI Agents, RWA
          <span className="block gradient-text mt-1">Arts & NFTs</span>
        </h1>

        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl mb-6">
          xArtists réunit agents IA, NFTs d'art et œuvres tokenisées sur MultiversX — marketplace,
          $TRO (cap <strong className="text-white">500 000 max</strong>), Studio artiste et tableau de bord LIA.
          List/Buy on-chain uniquement après deploy SC vérifié.
        </p>

        <div className="flex flex-wrap gap-3 mb-8">
          {!connected ? (
            <button type="button" onClick={handleConnect} className="btn-primary text-sm sm:text-base">
              Connecter le wallet
            </button>
          ) : (
            <Link to="/wallet" className="btn-primary text-sm sm:text-base inline-flex items-center">
              Mon wallet
            </Link>
          )}
          <Link to="/studio" className="btn-secondary text-sm sm:text-base inline-flex items-center">
            Studio artiste
          </Link>
          <Link to="/gallery" className="btn-secondary text-sm sm:text-base inline-flex items-center">
            Galerie
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center" role="list">
          {[
            { label: 'Modules dApp', value: '13+' },
            { label: '$TRO supply max', value: '500 000' },
            { label: 'Quorum DAO', value: '60%' },
            { label: 'Réseau', value: 'Mainnet' },
          ].map(s => (
            <div
              key={s.label}
              role="listitem"
              className="rounded-xl border border-white/5 bg-black/20 px-3 py-3"
            >
              <p className="text-xs text-zinc-500 uppercase tracking-wider">{s.label}</p>
              <p className="text-sm font-semibold text-white mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid sm:grid-cols-3 gap-3 text-left">
          <div className="rounded-xl border border-white/5 p-3">
            <p className="text-xs font-semibold text-purple-300">Empower Artists</p>
            <p className="text-[11px] text-gray-500 mt-1">Studio, mint, royalties, phygital</p>
          </div>
          <div className="rounded-xl border border-white/5 p-3">
            <p className="text-xs font-semibold text-teal-300">Enable Collectors</p>
            <p className="text-[11px] text-gray-500 mt-1">Galerie, market, wallet ESDT</p>
          </div>
          <div className="rounded-xl border border-white/5 p-3">
            <p className="text-xs font-semibold text-amber-300">Educate & Engage</p>
            <p className="text-[11px] text-gray-500 mt-1">DAO, $TRO, agents LIA</p>
          </div>
        </div>
      </div>
    </section>
  )
}
