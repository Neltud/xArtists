import { Link } from 'react-router-dom'
import { requestOpenConnect } from '../lib/walletEvents'

const ACTIONS = [
  { to: '/agents', label: 'Packs IA', sub: 'Pulse · Yield · Sentinel', emoji: '🧠' },
  { to: '/tours', label: 'Tours art', sub: 'Visites & expos', emoji: '🗺️' },
  { to: '/marketplace', label: 'Market NFT', sub: 'SC soon', emoji: '🛒' },
  { to: '/trading', label: 'Board LIA', sub: 'Paper only', emoji: '⚡' },
] as const

export default function HomeQuickActions() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
      {ACTIONS.map(a => (
        <Link
          key={a.to}
          to={a.to}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 hover:border-purple-400/40 transition-colors"
        >
          <span className="text-lg" aria-hidden>
            {a.emoji}
          </span>
          <p className="text-sm font-bold text-white mt-1">{a.label}</p>
          <p className="text-[10px] text-zinc-500">{a.sub}</p>
        </Link>
      ))}
      <button
        type="button"
        onClick={() => requestOpenConnect()}
        className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-3 text-left hover:border-cyan-400/50 transition-colors"
      >
        <span className="text-lg" aria-hidden>
          🔗
        </span>
        <p className="text-sm font-bold text-cyan-100 mt-1">Connecter</p>
        <p className="text-[10px] text-zinc-500">Wallet MultiversX</p>
      </button>
    </div>
  )
}
