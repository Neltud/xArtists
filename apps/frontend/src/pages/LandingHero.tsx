/**
 * Hero d'accueil — parcours clair, paper-first, CTAs prioritaires.
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
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-teal-600/10 blur-3xl" />

      <div className="relative max-w-3xl">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
            Private · Paper LIA
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs text-amber-200/90">
            Market après codeHash
          </span>
        </div>

        <h1 id="hero-title" className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] mb-4">
          Marketplace autonome
          <span className="block gradient-text mt-1">Agents · NFT · Art</span>
        </h1>

        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl mb-6">
          Connecte <strong className="text-zinc-200">ton</strong> wallet, explore les packs agents, suis le
          board LIA (GSN ≥80 %, compounding paper), crée ou collectionne. $TRO plafonné à{' '}
          <strong className="text-white">500 000</strong>. Aucun ordre automatique sur tes fonds.
        </p>

        <div className="flex flex-wrap gap-3 mb-8">
          {!connected ? (
            <button type="button" onClick={handleConnect} className="btn-primary text-sm sm:text-base">
              1 · Connecter le wallet
            </button>
          ) : (
            <Link to="/wallet" className="btn-primary text-sm sm:text-base inline-flex items-center">
              Mon wallet
            </Link>
          )}
          <Link to="/agents" className="btn-secondary text-sm sm:text-base inline-flex items-center">
            2 · Voir les packs
          </Link>
          <Link to="/trading" className="btn-secondary text-sm sm:text-base inline-flex items-center">
            3 · Board LIA
          </Link>
          <Link to="/studio" className="text-sm sm:text-base inline-flex items-center px-3 py-2 rounded-lg border border-white/10 text-zinc-300 hover:border-purple-400/40 hover:text-white transition-colors">
            Studio
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center" role="list">
          {[
            { label: 'Parcours', value: '4 étapes' },
            { label: '$TRO max', value: '500 000' },
            { label: 'LIA mode', value: 'PAPER' },
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
          <div className="rounded-xl border border-white/5 p-3 hover:border-purple-500/30 transition-colors">
            <p className="text-xs font-semibold text-purple-300">Artistes</p>
            <p className="text-[11px] text-gray-500 mt-1">Studio · mint · royalties · phygital</p>
          </div>
          <div className="rounded-xl border border-white/5 p-3 hover:border-teal-500/30 transition-colors">
            <p className="text-xs font-semibold text-teal-300">Collectionneurs</p>
            <p className="text-[11px] text-gray-500 mt-1">Galerie · packs · wallet ESDT</p>
          </div>
          <div className="rounded-xl border border-white/5 p-3 hover:border-amber-500/30 transition-colors">
            <p className="text-xs font-semibold text-amber-300">Observateurs LIA</p>
            <p className="text-[11px] text-gray-500 mt-1">Trading paper · signaux · compounding</p>
          </div>
        </div>
      </div>
    </section>
  )
}
