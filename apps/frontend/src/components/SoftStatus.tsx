import { Link } from 'react-router-dom'
import { isSupernovaLive } from '../config/supernova'
import { VIRTUAL_MUSEUMS } from '../lib/museumWorldCatalog'

export default function SoftStatus() {
  const sn = isSupernovaLive()
  const n = VIRTUAL_MUSEUMS?.length ?? 0

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3.5 text-[12px] text-zinc-500 backdrop-blur-sm">
      <p className="flex flex-wrap gap-x-2 gap-y-1 items-center">
        <span className="text-amber-400/90 font-medium">Paper</span>
        <span className="text-zinc-700">·</span>
        <span>SC off</span>
        <span className="text-zinc-700">·</span>
        <span>Trading off</span>
        {sn && (
          <>
            <span className="text-zinc-700">·</span>
            <span className="text-cyan-400/85">Supernova</span>
          </>
        )}
        {n > 0 && (
          <>
            <span className="text-zinc-700">·</span>
            <span>{n} musées</span>
          </>
        )}
      </p>
      <p className="mt-1.5 text-zinc-600">
        <Link to="/museum" className="text-zinc-400 hover:text-white transition-colors">
          Galerie
        </Link>
        <span className="mx-1.5 text-zinc-700">·</span>
        <Link to="/agents" className="text-zinc-400 hover:text-white transition-colors">
          Packs
        </Link>
        <span className="mx-1.5 text-zinc-700">·</span>
        <Link to="/my-packs" className="text-zinc-400 hover:text-white transition-colors">
          My Packs
        </Link>
      </p>
    </div>
  )
}
