/**
 * Home — haut de gamme, zéro redondance (pas de double CTA Galerie/Musée, pas de strips ops).
 */
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import PersonaWelcome from '../components/PersonaWelcome'

const PILLARS = [
  {
    to: '/museum',
    label: 'Galerie',
    title: 'Visite immersif',
    body: 'Salles 3D, collection wallet, musées-ville.',
  },
  {
    to: '/agents',
    label: 'Packs',
    title: 'Pulse · Yield · Sentinel',
    body: 'Accès agents — un parcours d’achat unique.',
  },
  {
    to: '/tours',
    label: 'Tours',
    title: 'Destinations art',
    body: 'Carte culturelle — hors packs agents.',
  },
] as const

export default function Dashboard() {
  const [persona, setPersona] = useState<string | null>(null)

  useEffect(() => {
    try {
      setPersona(localStorage.getItem('xartists_persona'))
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <div className="animate-fade-in space-y-10 pb-14 max-w-4xl mx-auto">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.07] px-6 py-10 sm:px-12 sm:py-14">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 90% at 0% 0%, rgba(139,92,246,0.28), transparent 55%), radial-gradient(ellipse 60% 70% at 100% 100%, rgba(34,211,238,0.12), transparent 50%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative z-[1] max-w-xl space-y-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
            xArtists
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.08]">
            L’art on-chain,{' '}
            <span className="gradient-text">sans le bruit</span>
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed">
            Galerie immersive, packs d’accès et tours culturels sur MultiversX. Démo paper — votre
            wallet reste le vôtre.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link to="/museum" className="btn-primary !px-6 !py-3">
              Entrer dans la galerie
            </Link>
            <Link to="/agents" className="btn-secondary !px-6 !py-3">
              Voir les packs
            </Link>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-3">
        {PILLARS.map(p => (
          <Link
            key={p.to}
            to={p.to}
            className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.04]"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 group-hover:text-zinc-400">
              {p.label}
            </p>
            <p className="mt-2 text-[15px] font-semibold text-white tracking-tight">{p.title}</p>
            <p className="mt-1.5 text-[13px] text-zinc-500 leading-relaxed">{p.body}</p>
          </Link>
        ))}
      </section>

      {!persona && <PersonaWelcome />}

      <footer className="flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-zinc-600">
        <Link to="/wallet" className="hover:text-zinc-300 transition-colors">
          Wallet
        </Link>
        <Link to="/marketplace" className="hover:text-zinc-300 transition-colors">
          Marketplace
        </Link>
        <Link to="/my-packs" className="hover:text-zinc-300 transition-colors">
          My Packs
        </Link>
        <Link to="/legal" className="hover:text-zinc-300 transition-colors">
          Mentions légales
        </Link>
      </footer>
    </div>
  )
}
