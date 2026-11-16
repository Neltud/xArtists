import { Link } from 'react-router-dom'

/** Lightweight public navigation. Operational audits are never exposed here. */
export default function EntityFooterStrip() {
  return (
    <nav aria-label="Explorer xArtists" className="mt-10 mb-6 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-[color:var(--xa-border)] px-4 py-3 text-xs text-[color:var(--xa-text-secondary)]">
      <span className="font-bold text-[color:var(--xa-text)]">xArtists</span>
      <Link to="/explore/museum" className="hover:underline">Musée</Link>
      <Link to="/create/studio" className="hover:underline">Créer</Link>
      <Link to="/create/gallery" className="hover:underline">Galerie 3D</Link>
      <Link to="/explore/market" className="hover:underline">Marketplace</Link>
      <Link to="/intelligence/xorus" className="hover:underline">xOrus</Link>
    </nav>
  )
}
