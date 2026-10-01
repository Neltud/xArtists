/** Desk trading — paper LIA + accès salles pack. */
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useAgentAccess } from '../store/empireStore'
import { requestOpenConnect } from '../lib/walletEvents'

export default function TradingPage() {
  const { connected } = useWallet()
  const access = useAgentAccess()

  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">Desk</p>
        <h1 className="section-title display text-2xl">Trading</h1>
        <p className="text-sm text-zinc-400">
          Signaux LIA en simulation. Pas de mandat, pas de promesse de performance.
        </p>
      </header>

      <div className="card space-y-3 text-sm text-zinc-300">
        <p>
          Accès packs :{' '}
          {access.packs.length ? access.packs.join(' · ') : 'aucun — ouvre un pack'}
        </p>
        {!connected && (
          <button type="button" className="btn-primary text-sm" onClick={requestOpenConnect}>
            Connecter wallet
          </button>
        )}
        <div className="flex flex-wrap gap-2">
          <Link to="/my-packs" className="btn-primary text-sm">
            Mes salles
          </Link>
          <Link to="/command-center" className="btn-secondary text-sm">
            Command Center
          </Link>
          <Link to="/lia" className="btn-secondary text-sm">
            LIA
          </Link>
        </div>
      </div>
    </div>
  )
}
