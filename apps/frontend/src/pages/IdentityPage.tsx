import { Link } from 'react-router-dom'

export default function IdentityPage() {
  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">Identité</p>
        <h1 className="section-title display text-2xl">MX Identity</h1>
        <p className="text-sm text-zinc-400">
          Registre d’identité (paper en priorité jusqu’au registre mainnet public).
        </p>
      </header>
      <div className="card text-sm text-zinc-400">
        <p>Connectez votre wallet pour afficher les credentials liés à l’adresse.</p>
        <Link to="/wallet" className="btn-secondary text-sm inline-block mt-3">
          Wallet
        </Link>
      </div>
    </div>
  )
}
