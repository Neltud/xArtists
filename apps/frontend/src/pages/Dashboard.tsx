/**
 * Home démo — parcours clair, zéro jargon ops.
 */
import { Link } from 'react-router-dom'
import { LINKS } from '../config/links'
import { DEMO_PATH } from '../config/demoMode'

const PILLARS = [
  {
    to: '/museum',
    label: 'Galerie',
    title: 'Visite immersive',
    body: 'Salles 3D, musées-ville, ta collection wallet.',
  },
  {
    to: '/agents',
    label: 'Packs',
    title: 'Pulse · Yield · Sentinel',
    body: 'Trois accès agents — un seul parcours d’achat.',
  },
  {
    to: '/tours',
    label: 'Tours',
    title: 'Carte culturelle',
    body: 'Destinations art — service culture, hors packs.',
  },
] as const

export default function Dashboard() {
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
            xArtists · démo
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.08]">
            L’art on-chain,{' '}
            <span className="gradient-text">sans le bruit</span>
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed">
            Galerie, packs d’accès et tours culturels sur MultiversX. Mode paper — votre wallet reste
            le vôtre.
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

      {/* Parcours démo en 4 étapes */}
      <section aria-label="Parcours démo">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 mb-3">Parcours</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DEMO_PATH.map((step, i) => (
            <Link
              key={step.to}
              to={step.to}
              className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-3 hover:border-white/15 hover:bg-white/[0.04] transition-colors"
            >
              <p className="text-[10px] text-zinc-600 tabular-nums">{i + 1}</p>
              <p className="text-[13px] font-semibold text-white mt-0.5">{step.label}</p>
              <p className="text-[11px] text-zinc-500">{step.hint}</p>
            </Link>
          ))}
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

      <a
        href={LINKS.discord}
        target="_blank"
        rel="noreferrer"
        className="block rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] px-5 py-4 transition-colors hover:border-indigo-400/35"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-300/80">
          Communauté
        </p>
        <p className="mt-1 text-[15px] font-semibold text-white">Discord xArtists</p>
        <p className="mt-1 text-[13px] text-zinc-500">Annonces · general FR/EN · support</p>
      </a>

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
        <a
          href={LINKS.discord}
          target="_blank"
          rel="noreferrer"
          className="hover:text-indigo-300 transition-colors"
        >
          Discord
        </a>
        <Link to="/legal" className="hover:text-zinc-300 transition-colors">
          Légal
        </Link>
      </footer>
    </div>
  )
}
