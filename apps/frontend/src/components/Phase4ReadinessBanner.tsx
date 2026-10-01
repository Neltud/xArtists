/** Public: no CODEHASH / SC addresses. */
import { Link } from 'react-router-dom'
import { canBuyAgent } from '../config/scStatus'

export default function Phase4ReadinessBanner() {
  const live = canBuyAgent()
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 space-y-2">
      <p className="text-[12px] text-zinc-400 leading-relaxed">
        {live
          ? 'Mint packs on-chain disponible.'
          : 'Checkout paper disponible. Mint on-chain en ouverture progressive.'}
      </p>
      <p className="text-[11px]">
        <Link to="/my-packs" className="text-cyan-400/90 hover:underline">
          My Packs
        </Link>
        {' · '}
        <Link to="/studio" className="text-zinc-400 hover:underline">
          Studio
        </Link>
      </p>
    </div>
  )
}
