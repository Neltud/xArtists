/** Unknown route → salle d'accueil SAMPLE. */
import { Link, useLocation } from 'react-router-dom'

export default function FallbackRoom() {
  const loc = useLocation()
  return (
    <div className="animate-fade-in space-y-5 pb-10 max-w-lg mx-auto text-center px-4">
      <div className="rounded-2xl border border-amber-500/25 bg-amber-950/30 px-4 py-4 space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-amber-200/80 font-semibold">
          Salle introuvable
        </p>
        <p className="text-sm text-zinc-300">
          Route <span className="mono text-amber-100/90">{loc.pathname}</span> non exposée.
        </p>
        <Link to="/" className="inline-flex text-[13px] font-semibold text-amber-100 underline-offset-2 hover:underline">
          ← Retour accueil
        </Link>
      </div>
    </div>
  )
}
