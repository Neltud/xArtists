/**
 * Home — fluid + LIA / GrokyversX agents.
 */
import { Link } from 'react-router-dom'
import SoftStatus from '../components/SoftStatus'
import AgentWalletsStrip from '../components/AgentWalletsStrip'
import { LINKS } from '../config/links'
import { isSupernovaLive } from '../config/supernova'

const LINKS_MAIN = [
  { to: '/museum', title: 'Galerie', body: 'Salles 3D · avatar · collection', delay: '0ms' },
  { to: '/agents', title: 'Packs', body: 'Pulse · Yield · Sentinel', delay: '60ms' },
  { to: '/tours', title: 'Tours', body: 'Carte & musées du monde', delay: '120ms' },
  { to: '/trading', title: 'Trading', body: 'Board paper · GrokyversX live micro', delay: '180ms' },
] as const

export default function Dashboard() {
  const supernova = isSupernovaLive()

  return (
    <div className="animate-fade-in relative pb-20 max-w-2xl mx-auto">
      <div className="orb w-64 h-64 -top-8 -left-16 bg-violet-600/30" aria-hidden />
      <div
        className="orb w-48 h-48 top-32 -right-10 bg-cyan-500/20"
        style={{ animationDelay: '2s' }}
        aria-hidden
      />

      <section className="relative space-y-6 pt-6 sm:pt-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-500">
          xArtists{supernova ? ' · Supernova' : ''}
        </p>
        <h1 className="display text-[2.75rem] sm:text-6xl text-white leading-[1.05]">
          L’art,
          <br />
          <span className="gradient-text">en mouvement</span>
        </h1>
        <p className="text-zinc-400 text-[15px] sm:text-base leading-relaxed max-w-md">
          Galerie immersive, packs d’accès, agents LIA + GrokyversX sur MultiversX.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link to="/museum" className="btn-primary">
            Entrer dans la galerie
          </Link>
          <Link to="/agents" className="btn-secondary">
            Voir les packs
          </Link>
        </div>
      </section>

      <div className="relative mt-10 space-y-3">
        <SoftStatus />
        <AgentWalletsStrip />

        <div className="grid gap-2.5 pt-2">
          {LINKS_MAIN.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className="flow-row"
              style={{ animation: `fadeIn 0.55s var(--ease-out) ${item.delay} both` }}
            >
              <div>
                <p className="text-[15px] font-semibold text-white tracking-tight">{item.title}</p>
                <p className="text-[13px] text-zinc-500 mt-0.5">{item.body}</p>
              </div>
              <span className="text-zinc-600 text-lg" aria-hidden>
                →
              </span>
            </Link>
          ))}
        </div>
      </div>

      <footer className="relative mt-12 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-zinc-600">
        <Link to="/wallet" className="hover:text-zinc-300 transition-colors">
          Wallet
        </Link>
        <a href={LINKS.liaExplorer} target="_blank" rel="noreferrer" className="hover:text-violet-300">
          LIA
        </a>
        <a href={LINKS.grokyversxExplorer} target="_blank" rel="noreferrer" className="hover:text-cyan-300">
          GrokyversX
        </a>
        <a href={LINKS.discord} target="_blank" rel="noreferrer" className="hover:text-indigo-300">
          Discord
        </a>
        <Link to="/legal" className="hover:text-zinc-300 transition-colors">
          Légal
        </Link>
      </footer>
    </div>
  )
}
