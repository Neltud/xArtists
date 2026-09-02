/**
 * @deprecated Removed travel-agent-as-pack UI.
 * Use ArtToursPage / ToursScopeBanner — cultural service only.
 */
import { Link } from 'react-router-dom'

export default function VoyageAgentPanel(_props?: { compact?: boolean }) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm">
      <p className="font-semibold text-rose-100">Tours artistiques ≠ pack agent IA</p>
      <p className="text-[12px] text-zinc-400 mt-1">
        Le service culturel (expos, visites) est séparé. Les packs IA sont uniquement Pulse · Yield ·
        Sentinel.
      </p>
      <Link to="/tours" className="text-cyan-300 underline text-xs mt-2 inline-block">
        Aller aux Tours artistiques →
      </Link>
    </div>
  )
}
