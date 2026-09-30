import { Link } from 'react-router-dom'

export default function DaoPage() {
  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">Gouvernance</p>
        <h1 className="section-title display text-2xl">DAO</h1>
        <p className="text-sm text-zinc-400">Votes holders / LP — activation progressive.</p>
      </header>
      <div className="card text-sm text-zinc-400">
        <Link to="/staking" className="btn-secondary text-sm">
          Staking & Yield
        </Link>
      </div>
    </div>
  )
}
