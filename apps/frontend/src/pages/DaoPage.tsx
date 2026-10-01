/** DAO — statut gouvernance + lien staking. Votes LP en ouverture. */
import { Link } from 'react-router-dom'
import { isDaoLive, TRO_GOVERNANCE_ADDRESS } from '../config/scStatus'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'

export default function DaoPage() {
  const live = isDaoLive()
  const { connected } = useWallet()

  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">Gouvernance</p>
        <h1 className="section-title display text-2xl">DAO</h1>
        <p className="text-sm text-zinc-400">
          Votes holders / LP. Pas un fonds. Activation progressive des propositions.
        </p>
      </header>

      <div className="card space-y-3 text-sm">
        <p className="text-zinc-400">{live ? 'Contrat gouvernance déployé' : 'Gouvernance en ouverture'}</p>
        {!connected && (
          <button type="button" className="btn-secondary text-sm" onClick={requestOpenConnect}>
            Connecter pour voter plus tard
          </button>
        )}
        <p className="text-[12px] text-zinc-500">
          Aucune proposition ouverte pour le moment. Le staking $TRO reste le premier levier.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to="/staking" className="btn-primary text-sm">
            Staking & Yield
          </Link>
          <Link to="/tro" className="btn-secondary text-sm">
            Tokenomics $TRO
          </Link>
        </div>
      </div>
    </div>
  )
}
