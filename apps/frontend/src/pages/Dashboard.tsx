import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'
import { useI18n } from '../i18n/I18nContext'

const TILES = [
  { to: '/museum', title: 'Musée 3D', body: 'Visite immersive · œuvres sur les murs', tone: 'from-cyan-500/15' },
  { to: '/marketplace', title: 'Marketplace', body: 'Lister · acheter · collection ASFT', tone: 'from-violet-500/15' },
  { to: '/agents', title: 'Packs IA', body: 'Pulse · Yield · Sentinel', tone: 'from-emerald-500/15' },
  { to: '/my-packs', title: 'Mes salles', body: '1 pack = 1 salle holder', tone: 'from-amber-500/15' },
  { to: '/staking', title: 'Staking $TRO', body: 'Lock on-chain MultiversX', tone: 'from-sky-500/15' },
  { to: '/slot', title: 'Slot', body: 'Simulation & mode réel', tone: 'from-rose-500/15' },
  { to: '/command-center', title: 'Command Center', body: 'Aura LIA · moniteur pack', tone: 'from-indigo-500/15' },
  { to: '/studio', title: 'Studio', body: 'Créer · mint · mettre en vente', tone: 'from-fuchsia-500/15' },
] as const

export default function Dashboard() {
  const { connected } = useWallet()
  const { t } = useI18n()

  return (
    <div className="animate-fade-in space-y-10 pb-20">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-950/40 via-[#0a0a12] to-cyan-950/30 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="relative max-w-xl space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">xArtists · mainnet</p>
          <h1 className="font-tech text-3xl font-bold tracking-tight text-white title-glow sm:text-4xl">
            Empire culturel on-chain
          </h1>
          <p className="text-sm leading-relaxed text-zinc-400">
            Galerie NFT, packs agents, marketplace et staking sur MultiversX. Signature xPortal.
            Produit numérique — pas un fond d&apos;investissement.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {!connected && (
              <button type="button" className="btn-primary" onClick={() => requestOpenConnect()}>
                {t('common.connect')}
              </button>
            )}
            <Link to="/museum" className="btn-secondary">
              Musée
            </Link>
            <Link to="/marketplace" className="btn-secondary">
              Marketplace
            </Link>
            <Link to="/agents" className="btn-secondary">
              Packs IA
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="section-label">Explorer</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {TILES.map(tile => (
            <Link
              key={tile.to}
              to={tile.to}
              className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${tile.tone} to-transparent p-4 transition hover:border-white/20`}
            >
              <h2 className="text-sm font-semibold text-white group-hover:text-cyan-100">{tile.title}</h2>
              <p className="mt-1 text-[12px] text-zinc-500">{tile.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <p className="text-center text-[11px] text-zinc-600">
        MultiversX mainnet · menu ☰ pour toutes les pages
      </p>
    </div>
  )
}
