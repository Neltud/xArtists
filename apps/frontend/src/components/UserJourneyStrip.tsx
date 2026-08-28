import { Link } from 'react-router-dom'

const STEPS = [
  { n: '1', label: 'Connecter', to: '/wallet', hint: 'xPortal / WC' },
  { n: '2', label: 'Explorer', to: '/gallery', hint: 'Art & tours' },
  { n: '3', label: 'Pack ou tip', to: '/agents', hint: 'Stripe / EGLD' },
  { n: '4', label: 'Suivre LIA', to: '/trading', hint: 'Paper only' },
] as const

/** Bandeau étapes linéaires — parcours débutant. */
export default function UserJourneyStrip() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 px-1">
        Première visite · 4 étapes
      </p>
      <div className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <Link
            key={s.n}
            to={s.to}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 hover:border-purple-400/40 transition-colors min-w-[7.5rem]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/20 text-xs font-black text-purple-200">
              {s.n}
            </span>
            <span>
              <span className="block text-xs font-semibold text-white">{s.label}</span>
              <span className="block text-[10px] text-zinc-500">{s.hint}</span>
            </span>
            {i < STEPS.length - 1 && (
              <span className="hidden sm:inline text-zinc-600 ml-1" aria-hidden>
                →
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
