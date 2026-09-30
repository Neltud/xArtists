import { Link } from 'react-router-dom'

/** Creator Studio — mint / list entry */
export default function StudioPage() {
  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">Création</p>
        <h1 className="section-title display text-2xl">Creator Studio</h1>
        <p className="text-sm text-zinc-400">
          Préparez un NFT, puis listez-le sur le marché. Signature uniquement via votre wallet.
        </p>
      </header>
      <div className="card space-y-3 text-sm text-zinc-300">
        <p>1. Connectez xPortal / extension</p>
        <p>2. Mint ou importez une collection MultiversX</p>
        <p>3. Mettez en vente depuis le Marketplace</p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link to="/marketplace" className="btn-primary text-sm">
            Marketplace
          </Link>
          <Link to="/museum" className="btn-secondary text-sm">
            Musée
          </Link>
          <Link to="/wallet" className="btn-secondary text-sm">
            Wallet
          </Link>
        </div>
      </div>
    </div>
  )
}
