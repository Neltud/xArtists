import { Link } from 'react-router-dom'

export default function LiaPage() {
  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">Intelligence</p>
        <h1 className="section-title display text-2xl">LIA</h1>
        <p className="text-sm text-zinc-400">
          Agent d’ambiance et de signaux — mode simulation par défaut sur la démo publique.
        </p>
      </header>
      <div className="card text-sm text-zinc-300 space-y-2">
        <p>Pas un fond d’investissement. Pas de mandat de gestion.</p>
        <p>Les packs Pulse / Yield / Sentinel ouvrent une salle et un moniteur dédiés.</p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link to="/agents" className="btn-primary text-sm">
            Packs
          </Link>
          <Link to="/my-packs" className="btn-secondary text-sm">
            Mes salles
          </Link>
          <Link to="/trading" className="btn-secondary text-sm">
            Desk
          </Link>
        </div>
      </div>
    </div>
  )
}
