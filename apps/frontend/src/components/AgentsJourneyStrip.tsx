import { Link } from 'react-router-dom'

const STEPS = [
  { to: '/', label: 'Home' },
  { to: '/agents', label: 'Packs', active: true },
  { to: '/my-packs', label: 'My Packs' },
  { to: '/trading', label: 'Board LIA' },
]

export default function AgentsJourneyStrip() {
  return (
    <nav
      className="mb-6 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500"
      aria-label="Fil d'Ariane agents"
    >
      {STEPS.map((s, i) => (
        <span key={s.to} className="inline-flex items-center gap-1.5">
          {i > 0 && <span className="text-zinc-600" aria-hidden>→</span>}
          <Link
            to={s.to}
            className={
              s.active
                ? 'text-purple-300 font-semibold'
                : 'hover:text-zinc-300 underline-offset-2 hover:underline'
            }
          >
            {s.label}
          </Link>
        </span>
      ))}
      <span className="ml-auto text-[10px] text-zinc-600 hidden sm:inline">
        GSN ≥80% = signal LIA · packs ≠ GSN
      </span>
    </nav>
  )
}
