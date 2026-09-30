import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'

export default function WalletPage() {
  const { connected, address, disconnect } = useWallet()
  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">Portefeuille</p>
        <h1 className="section-title display text-2xl">Wallet</h1>
      </header>
      <div className="card space-y-3 text-sm">
        {connected && address ? (
          <>
            <p className="text-zinc-400">Connecté</p>
            <p className="mono text-[12px] text-emerald-300/90 break-all">{address}</p>
            <button type="button" className="btn-secondary text-sm" onClick={() => disconnect?.()}>
              Déconnecter
            </button>
          </>
        ) : (
          <>
            <p className="text-zinc-400">xPortal, extension ou Web Wallet.</p>
            <button type="button" className="btn-primary text-sm" onClick={() => requestOpenConnect()}>
              Connecter
            </button>
          </>
        )}
        <Link to="/portfolio" className="text-cyan-400 text-xs hover:underline">
          Portfolio →
        </Link>
      </div>
    </div>
  )
}
