import { Link } from 'react-router-dom'

export default function VenuePage() {
  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">Salles</p>
        <h1 className="section-title display text-2xl">Venue</h1>
        <p className="text-sm text-zinc-400">Location / partage de salles on-chain (activation progressive).</p>
      </header>
      <div className="card text-sm text-zinc-400 space-y-2">
        <p>Les salles pack (1 NFT = 1 salle) restent sur My Packs.</p>
        <Link to="/my-packs" className="btn-primary text-sm inline-block">
          My Packs
        </Link>
      </div>
    </div>
  )
}
