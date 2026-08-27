import { Link } from 'react-router-dom'

/** Persistent entity identity under main content (not the app chrome footer). */
export default function EntityFooterStrip() {
  return (
    <div className="mt-10 mb-6 rounded-2xl border border-white/5 bg-black/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-500">
      <div className="flex flex-wrap gap-3 items-center">
        <span className="font-bold text-zinc-300">xArtists</span>
        <span>·</span>
        <Link to="/entity" className="text-purple-300 hover:underline">
          Entité
        </Link>
        <Link to="/trading" className="hover:text-zinc-300">
          LIA Board
        </Link>
        <Link to="/agents" className="hover:text-zinc-300">
          Agents
        </Link>
        <Link to="/agents/voyage" className="hover:text-zinc-300">
          Voyage
        </Link>
        <Link to="/tro" className="hover:text-zinc-300">
          $TRO
        </Link>
      </div>
      <span className="text-zinc-600">Demo · MultiversX · Vellum paper</span>
    </div>
  )
}
