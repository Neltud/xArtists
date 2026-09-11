/**
 * Statut paper — transparent, sans promesse fonds.
 */
import { Link } from 'react-router-dom'
import { isSupernovaLive } from '../config/supernova'
import { VIRTUAL_MUSEUMS } from '../lib/museumWorldCatalog'

export default function SoftStatus() {
  const sn = isSupernovaLive()
  const n = VIRTUAL_MUSEUMS?.length ?? 0

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-[12px] text-zinc-500 space-y-1.5">
      <p className="flex flex-wrap gap-x-2 gap-y-1">
        <span className="text-amber-400/90">Paper</span>
        <span className="text-zinc-700">·</span>
        <span>SC off</span>
        <span className="text-zinc-700">·</span>
        <span>Trading off</span>
        {sn && (
          <>
            <span className="text-zinc-700">·</span>
            <span className="text-cyan-500/80">Supernova</span>
          </>
        )}
        {n > 0 && (
          <>
            <span className="text-zinc-700">·</span>
            <span>{n} musées</span>
          </>
        )}
      </p>
      <p className="text-zinc-600">
        <Link to="/museum" className="text-zinc-400 hover:text-white">
          Galerie
        </Link>
        {' · '}
        <Link to="/agents" className="text-zinc-400 hover:text-white">
          Packs
        </Link>
        {' · '}
        <Link to="/my-packs" className="text-zinc-400 hover:text-white">
          My Packs
        </Link>
      </p>
    </div>
  )
}
