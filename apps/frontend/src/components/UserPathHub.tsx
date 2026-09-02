import { Link } from 'react-router-dom'

/**
 * Parcours utilisateur clarifié — 4 chemins, zéro jargon.
 */
const PATHS = [
  {
    id: 'discover',
    title: 'Découvrir',
    emoji: '🖼️',
    blurb: 'Galerie, éditions, tours artistiques',
    steps: ['Galerie', 'Tours', 'Marketplace'],
    to: '/gallery',
    secondary: { to: '/tours', label: 'Tours art' },
    accent: 'from-rose-500/20 to-purple-500/10 border-rose-500/30',
  },
  {
    id: 'agents',
    title: 'Agents IA',
    emoji: '🧠',
    blurb: 'Packs Pulse · Yield · Sentinel (accès NFT)',
    steps: ['Choisir pack', 'Payer (Stripe)', 'My Packs'],
    to: '/agents',
    secondary: { to: '/my-packs', label: 'My Packs' },
    accent: 'from-violet-500/20 to-cyan-500/10 border-violet-500/30',
  },
  {
    id: 'lia',
    title: 'Suivre LIA',
    emoji: '⚡',
    blurb: 'Board paper, compound, signaux — pas ton argent',
    steps: ['Trading', 'Portfolio', 'Sim Lab'],
    to: '/trading',
    secondary: { to: '/portfolio', label: 'Book LIA' },
    accent: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
  },
  {
    id: 'wallet',
    title: 'Mon wallet',
    emoji: '👛',
    blurb: 'Connecter xPortal · tip · on-ramp EGLD',
    steps: ['Connect', 'Buy EGLD', 'Tip / Stake'],
    to: '/wallet',
    secondary: { to: '/tip', label: 'Tip' },
    accent: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
  },
] as const

export default function UserPathHub() {
  return (
    <section aria-labelledby="path-hub-title" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Parcours</p>
          <h2 id="path-hub-title" className="text-xl font-black text-white">
            Que veux-tu faire ?
          </h2>
        </div>
        <p className="text-[11px] text-zinc-500 max-w-xs text-right">
          Choisis un chemin. LIA (⌘K) comprend aussi le langage naturel.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {PATHS.map(p => (
          <article
            key={p.id}
            className={`rounded-2xl border bg-gradient-to-br p-4 flex flex-col min-h-[180px] ${p.accent}`}
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="text-2xl" aria-hidden>
                {p.emoji}
              </span>
              <div>
                <h3 className="font-bold text-white">{p.title}</h3>
                <p className="text-[11px] text-zinc-400 leading-snug">{p.blurb}</p>
              </div>
            </div>
            <ol className="text-[10px] text-zinc-500 space-y-0.5 mb-3 flex-1 list-decimal pl-4">
              {p.steps.map(s => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-2 mt-auto">
              <Link to={p.to} className="btn-primary text-[11px] py-1.5 px-3 flex-1 text-center">
                Ouvrir
              </Link>
              <Link to={p.secondary.to} className="btn-secondary text-[11px] py-1.5 px-3 text-center">
                {p.secondary.label}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
