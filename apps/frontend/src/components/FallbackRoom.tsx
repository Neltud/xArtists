/**
 * Global fallback for unknown routes / load failures → Home (SAMPLE mode).
 */
import { Link, useLocation } from 'react-router-dom'
import HomeMenuHall from './home/HomeMenuHall'

export default function FallbackRoom() {
  const loc = useLocation()
  return (
    <div className="animate-fade-in space-y-5 pb-10">
      <div className="rounded-2xl border border-amber-500/25 bg-amber-950/30 px-4 py-3 space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-amber-200/80 font-semibold">
          Salle introuvable
        </p>
        <p className="text-sm text-zinc-300">
          La route <span className="mono text-amber-100/90">{loc.pathname}</span> n&apos;est pas
          exposée. Retour à la salle d&apos;accueil (mode SAMPLE).
        </p>
        <Link to="/" className="inline-flex text-[12px] font-semibold text-amber-100 underline-offset-2 hover:underline">
          ← Accueil 3D
        </Link>
      </div>
      <HomeMenuHall />
    </div>
  )
}
