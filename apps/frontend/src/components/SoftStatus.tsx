/**
 * Statut produit paper — zéro promesse fonds mainnet.
 */
import { Link } from 'react-router-dom'
import { isSupernovaLive } from '../config/supernova'

export default function SoftStatus() {
  const sn = isSupernovaLive()
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-[12px] text-zinc-500 space-y-1.5">
      <p className="flex flex-wrap gap-x-3 gap-y-1">
        <span className="text-amber-400/90">Paper</span>
        <span>·</span>
        <span>Trading live OFF</span>
        <span>·</span>
        <span>SC produit non déployés</span>
        {sn && (
          <>
            <span>·</span>
            <span className="text-cyan-500/80">Supernova live</span>
          </>
        )}
      </p>
      <p>
        Exploration libre.{' '}
        <Link to="/museum" className="text-zinc-400 hover:text-white underline-offset-2 hover:underline">
          Galerie
        </Link>
        {' · '}
        <Link to="/agents" className="text-zinc-400 hover:text-white underline-offset-2 hover:underline">
          Packs
        </Link>
      </p>
    </div>
  )
}
