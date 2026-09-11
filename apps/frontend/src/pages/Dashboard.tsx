/**
 * Home paper — minimal, Supernova, zero fund claims.
 */
import { Link } from 'react-router-dom'
import SoftStatus from '../components/SoftStatus'
import { LINKS } from '../config/links'
import { isSupernovaLive } from '../config/supernova'

const LINKS_MAIN = [
  { to: '/museum', title: 'Galerie', body: 'Salles 3D · avatar · collection' },
  { to: '/agents', title: 'Packs', body: 'Pulse · Yield · Sentinel' },
  { to: '/tours', title: 'Tours', body: 'Carte culturelle' },
] as const

export default function Dashboard() {
  const supernova = isSupernovaLive()

  return (
    <div className="animate-fade-in space-y-10 pb-16 max-w-3xl mx-auto">
      <section className="space-y-5 pt-4 sm:pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
          xArtists{supernova ? ' · Supernova' : ''}
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.08]">
          Art on-chain,{' '}
          <span className="gradient-text">simple</span>
        </h1>
        <p className="text-zinc-400 text-[15px] leading-relaxed max-w-lg">
          Galerie et packs d’accès sur MultiversX. Mode paper — aucune gestion de fonds pour toi.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/museum" className="btn-primary !px-6 !py-3">
            Galerie
          </Link>
          <Link to="/agents" className="btn-secondary !px-6 !py-3">
            Packs
          </Link>
        </div>
      </section>

      <SoftStatus />

      <section className="grid gap-2">
        {LINKS_MAIN.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className="group flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-4 transition-colors hover:border-white/15 hover:bg-white/[0.04]"
          >
            <div>
              <p className="text-[15px] font-semibold text-white">{item.title}</p>
              <p className="text-[13px] text-zinc-500 mt-0.5">{item.body}</p>
            </div>
            <span className="text-zinc-600 group-hover:text-zinc-400 text-lg" aria-hidden>
              →
            </span>
          </Link>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-zinc-600">
        <Link to="/wallet" className="hover:text-zinc-300">
          Wallet
        </Link>
        <Link to="/my-packs" className="hover:text-zinc-300">
          My Packs
        </Link>
        <a href={LINKS.discord} target="_blank" rel="noreferrer" className="hover:text-indigo-300">
          Discord
        </a>
        <Link to="/legal" className="hover:text-zinc-300">
          Légal
        </Link>
      </div>
    </div>
  )
}
