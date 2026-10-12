/** DAO — gouvernance + voting power. */
import { Link } from 'react-router-dom'
import DaoGovernance from '../components/DaoGovernance'

export default function DaoPage() {
  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">Gouvernance</p>
        <h1 className="section-title display text-2xl">DAO</h1>
        <p className="text-sm text-zinc-400">
          Pouvoir de vote = $TRO staké + SFT staké. Pas un fonds d’investissement.
        </p>
      </header>
      <DaoGovernance />
      <div className="flex flex-wrap gap-2 text-sm">
        <Link to="/staking" className="btn-secondary text-sm">
          Staking & Yield
        </Link>
        <Link to="/tro" className="btn-secondary text-sm">
          Tokenomics $TRO
        </Link>
      </div>
    </div>
  )
}
