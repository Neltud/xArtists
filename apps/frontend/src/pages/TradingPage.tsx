import { Link } from 'react-router-dom'

export default function TradingPage() {
  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">Desk</p>
        <h1 className="section-title display text-2xl">Trading desk</h1>
        <p className="text-sm text-zinc-400">
          Vue signaux LIA — simulation tant que le mode live n’est pas activé pour votre session.
        </p>
      </header>
      <div className="card space-y-2 text-sm text-zinc-300">
        <p>Ouvrez une salle pack pour le moniteur complet.</p>
        <div className="flex flex-wrap gap-2">
          <Link to="/my-packs" className="btn-primary text-sm">
            Mes packs
          </Link>
          <Link to="/command-center" className="btn-secondary text-sm">
            Command Center
          </Link>
        </div>
      </div>
    </div>
  )
}
