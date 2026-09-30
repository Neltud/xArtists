import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'

const LINKS = [
  { to: '/museum', title: 'Musée 3D', body: 'Visite · œuvres sur les murs', delay: '0ms' },
  { to: '/my-packs', title: 'My Packs / Salles', body: '1 pack = 1 salle (4 murs · 4 œuvres/mur)', delay: '40ms' },
  { to: '/agents', title: 'Packs IA', body: 'Pulse · Yield · Sentinel', delay: '80ms' },
  { to: '/marketplace', title: 'Marketplace', body: 'Marketplace NFT', delay: '120ms' },
  { to: '/staking', title: 'Staking', body: 'Lock $TRO + farms DEX', delay: '160ms' },
  { to: '/slot', title: 'Slot', body: 'Casino · simulation & on-chain', delay: '200ms' },
  { to: '/command-center', title: 'Command Center', body: 'Salles pack + moniteur', delay: '240ms' },
  { to: '/go-live', title: 'Go Live', body: 'Checklist & caisse', delay: '280ms' },
] as const

export default function Dashboard() {
  const { connected } = useWallet()

  return (
    <div className="animate-fade-in space-y-8 pb-16">
      <header className="space-y-3 max-w-2xl">
        <p className="section-label">xArtists</p>
        <h1 className="section-title display text-3xl sm:text-4xl title-glow">
          Empire culturel on-chain
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Galerie, packs, LIA — MultiversX · signature xPortal · activation progressive.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {!connected && (
            <button type="button" className="btn-primary" onClick={() => requestOpenConnect()}>
              Connecter wallet
            </button>
          )}
          <Link to="/museum" className="btn-secondary">
            Entrer au musée
          </Link>
          <Link to="/my-packs" className="btn-secondary">
            Mes salles
          </Link>
          <Link to="/wallet" className="btn-secondary">
            Wallet
          </Link>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {LINKS.map(l => (
          <Link
            key={l.to}
            to={l.to}
            className="card hover:border-violet-500/30 transition-colors block"
            style={{ animationDelay: l.delay }}
          >
            <h2 className="text-sm font-semibold text-white">{l.title}</h2>
            <p className="text-[12px] text-zinc-500 mt-1">{l.body}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
