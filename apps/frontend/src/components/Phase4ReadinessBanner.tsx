/**
 * Phase 4 readiness — MultiversX Agent Economy (First 100 / MX-8004).
 * Honest: not registered yet; plan + links only.
 */
import { Link } from 'react-router-dom'

const CRITERIA = [
  { id: 'mx8004', label: 'MX-8004 registration', status: 'pending' as const },
  { id: 'jobs', label: '≥ 5 verified jobs', status: 'pending' as const },
  { id: 'trust', label: 'Trust score > 90', status: 'pending' as const },
] as const

type Variant = 'full' | 'compact'

export default function Phase4ReadinessBanner({
  variant = 'full',
  className = '',
}: {
  variant?: Variant
  className?: string
}) {
  if (variant === 'compact') {
    return (
      <div
        className={`rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-4 py-3 text-[12px] ${className}`}
        role="status"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5 font-semibold text-cyan-200">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/90" aria-hidden />
            Phase 4 · First 100
          </span>
          <span className="text-zinc-500">LIA → MX-8004 · paper path</span>
          <Link
            to="/demo"
            className="text-cyan-400/90 hover:text-cyan-300 underline-offset-2 hover:underline"
          >
            Détail →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <section
      className={`rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/30 to-zinc-950/40 p-5 space-y-4 ${className}`}
      aria-labelledby="phase4-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-400/80">
            MultiversX Agent Economy
          </p>
          <h2 id="phase4-heading" className="mt-1 text-lg font-semibold text-white">
            Phase 4 readiness — First 100
          </h2>
          <p className="mt-1.5 text-[13px] text-zinc-400 leading-relaxed max-w-xl">
            Objectif : 1 EGLD bounty pour les 100 premiers agents qualifiés. LIA + Pulse · Yield ·
            Sentinel suivent le plan MX-8004 (Identity → Validation → Reputation).
          </p>
        </div>
        <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-200/90">
          Not registered yet
        </span>
      </div>

      <ul className="grid sm:grid-cols-3 gap-2">
        {CRITERIA.map(c => (
          <li
            key={c.id}
            className="rounded-xl border border-white/8 bg-black/30 px-3 py-2.5 text-[12px]"
          >
            <span className="text-zinc-500">○</span>{' '}
            <span className="text-zinc-300">{c.label}</span>
            <span className="ml-1.5 text-[10px] uppercase tracking-wide text-amber-400/80">
              {c.status}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
        <a
          href="https://github.com/Neltud/xArtists/blob/main/docs/MX8004_FIRST100_ALIGNMENT.md"
          target="_blank"
          rel="noreferrer"
          className="text-cyan-400/90 hover:text-cyan-300"
        >
          Plan alignment →
        </a>
        <a
          href="https://github.com/Neltud/xArtists/blob/main/docs/MOLTBOT_MX8004_MAP.md"
          target="_blank"
          rel="noreferrer"
          className="text-zinc-400 hover:text-white"
        >
          Moltbot skills map
        </a>
        <a
          href="https://agents.multiversx.com"
          target="_blank"
          rel="noreferrer"
          className="text-zinc-400 hover:text-white"
        >
          Agent Explorer
        </a>
        <Link to="/go-live" className="text-zinc-400 hover:text-white">
          GO_LIVE checklist
        </Link>
      </div>

      <p className="text-[11px] text-zinc-600 leading-relaxed">
        Script skeleton : <code className="text-zinc-500">scripts/register_mx8004_lia.py</code> — PEM
        uniquement via secrets Vellum. Paper-first jusqu’à Mainnet Push + 5 jobs vérifiés.
      </p>
    </section>
  )
}
