import { useState } from 'react'
import { Link } from 'react-router-dom'
import FiatOnRampModal from './onramp/FiatOnRampModal'

/** Home strip — Voyage + on-ramp + core paths */
export default function HomeQuickActions() {
  const [onRamp, setOnRamp] = useState(false)

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Link
          to="/agents/voyage"
          className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-4 hover:border-amber-400/40 transition-colors"
        >
          <p className="text-2xl mb-1">✈️</p>
          <p className="text-sm font-bold text-amber-100">Agent Voyage</p>
          <p className="text-[10px] text-zinc-500">Travel signals paper</p>
        </Link>
        <button
          type="button"
          onClick={() => setOnRamp(true)}
          className="rounded-2xl border border-cyan-500/25 bg-cyan-950/20 p-4 text-left hover:border-cyan-400/40 transition-colors"
        >
          <p className="text-2xl mb-1">💳</p>
          <p className="text-sm font-bold text-cyan-100">On-Ramp Fiat</p>
          <p className="text-[10px] text-zinc-500">MoonPay / demo</p>
        </button>
        <Link
          to="/trading"
          className="rounded-2xl border border-purple-500/25 bg-purple-950/20 p-4 hover:border-purple-400/40 transition-colors"
        >
          <p className="text-2xl mb-1">⚡</p>
          <p className="text-sm font-bold text-purple-100">Board LIA</p>
          <p className="text-[10px] text-zinc-500">Paper trading</p>
        </Link>
        <Link
          to="/agents"
          className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4 hover:border-emerald-400/40 transition-colors"
        >
          <p className="text-2xl mb-1">🧠</p>
          <p className="text-sm font-bold text-emerald-100">Packs Agents</p>
          <p className="text-[10px] text-zinc-500">Pulse · Yield · Voyage</p>
        </Link>
      </div>
      <FiatOnRampModal isOpen={onRamp} onClose={() => setOnRamp(false)} amount="50" asset="EGLD" />
    </>
  )
}
