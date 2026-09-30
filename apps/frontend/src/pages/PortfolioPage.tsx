import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'

export default function PortfolioPage() {
  const { connected, address } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const nfts = account.nfts || []
  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">Actifs</p>
        <h1 className="section-title display text-2xl">Portfolio</h1>
      </header>
      <div className="card text-sm text-zinc-300 space-y-2">
        {!connected && <p className="text-zinc-500">Connectez un wallet pour voir NFT et soldes.</p>}
        {connected && (
          <>
            <p>
              NFT visibles : <strong className="text-white">{nfts.length}</strong>
            </p>
            <p className="text-zinc-500 text-[12px]">
              Les packs IA ouvrent une salle (jusqu’à 4 murs × 4 œuvres).
            </p>
          </>
        )}
        <div className="flex flex-wrap gap-2 pt-2">
          <Link to="/museum" className="btn-secondary text-sm">
            Musée
          </Link>
          <Link to="/my-packs" className="btn-secondary text-sm">
            My Packs
          </Link>
        </div>
      </div>
    </div>
  )
}
