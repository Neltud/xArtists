/**
 * Phase 4 readiness — First 100 (dynamic registration / jobs / trust).
 */
import { Link } from 'react-router-dom'
import useMx8004Registration from '../hooks/useMx8004Registration'

type Variant = 'full' | 'compact'

export default function Phase4ReadinessBanner({
  variant = 'full',
  className = '',
}: {
  variant?: Variant
  className?: string
}) {
  const { live, reg, jobs, trust, loaded, criteria } = useMx8004Registration()
  const nonce = reg?.agent_nonce
  const label = !loaded
    ? 'Checking…'
    : live
      ? nonce
        ? `MX-8004 #${nonce}`
        : 'Registered'
      : 'Not registered yet'

  if (variant === 'compact') {
    return (
      <div
        className={`rounded-xl border px-4 py-3 text-[12px] ${
          live ? 'border-emerald-500/35 bg-emerald-950/25' : 'border-amber-500/30 bg-amber-950/20'
        } ${className}`}
        role="status"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            className={`inline-flex items-center gap-1.5 font-semibold ${
              live ? 'text-emerald-200' : 'text-amber-100'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-400' : 'bg-amber-400/90'}`}
              aria-hidden
            />
            Phase 4 · First 100
          </span>
          <span className="text-zinc-500">{label}</span>
          {trust?.score != null && <span className="text-zinc-500">trust {trust.score}</span>}
          <Link
            to="/go-live"
            className="text-amber-300/90 hover:text-amber-200 underline-offset-2 hover:underline"
          >
            GO_LIVE →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border p-5 space-y-4 ${
        live ? 'border-emerald-500/30' : 'border-amber-500/25'
      } atelier-card ${className}`}
      aria-labelledby="phase4-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300/80">
            MultiversX Agent Economy
          </p>
          <h2 id="phase4-heading" className="mt-1 text-lg font-semibold text-white display">
            Phase 4 readiness — First 100
          </h2>
          <p className="mt-1.5 text-[13px] text-zinc-400 leading-relaxed max-w-xl">
            Objectif : 1 EGLD bounty. LIA (PEM ops) + GrokyversX (PEM séparé, propose) — Identity →
            Validation → Reputation.
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
            live
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-amber-500/40 bg-amber-500/10 text-amber-200/90'
          }`}
        >
          {label}
        </span>
      </div>

      <ul className="grid sm:grid-cols-3 gap-2">
        {criteria.map(c => (
          <li
            key={c.id}
            className="rounded-xl border border-white/8 bg-black/35 px-3 py-2.5 text-[12px]"
          >
            <span className={c.ok ? 'text-emerald-400' : 'text-zinc-500'}>{c.ok ? '●' : '○'}</span>{' '}
            <span className="text-zinc-300">{c.label}</span>
            {'detail' in c && c.detail && (
              <span className="block text-[10px] text-zinc-500 mt-0.5 pl-3">{c.detail}</span>
            )}
          </li>
        ))}
      </ul>

      {jobs?.jobs && jobs.jobs.length > 0 && (
        <div className="rounded-xl border border-white/8 bg-black/25 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">
            Jobs paper ({jobs.verified_count}/{jobs.target})
          </p>
          <ul className="space-y-1 text-[11px] text-zinc-400">
            {jobs.jobs.slice(0, 5).map(j => (
              <li key={j.id} className="flex gap-2">
                <span className="text-emerald-500/80">✓</span>
                <span className="text-zinc-300 truncate">{j.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {trust?.score != null && trust.score < (trust.target ?? 90) && (
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Trust paper {trust.score}/{trust.target} — prochain : registration on-chain Identity Registry.
        </p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
        <a
          href="https://github.com/Neltud/xArtists/blob/main/docs/MX8004_FIRST100_ALIGNMENT.md"
          target="_blank"
          rel="noreferrer"
          className="text-amber-300/90 hover:text-amber-200"
        >
          Plan alignment →
        </a>
        <a
          href="https://github.com/Neltud/xArtists/blob/main/docs/MOLTBOT_MX8004_MAP.md"
          target="_blank"
          rel="noreferrer"
          className="text-zinc-400 hover:text-white"
        >
          Moltbot skills
        </a>
        <Link to="/go-live" className="text-amber-300/90 hover:text-amber-200 font-medium">
          GO_LIVE
        </Link>
        <Link to="/museum" className="text-zinc-400 hover:text-white">
          Galerie Tuduri
        </Link>
        <Link to="/demo" className="text-zinc-400 hover:text-white">
          Tour démo
        </Link>
      </div>
    </section>
  )
}
