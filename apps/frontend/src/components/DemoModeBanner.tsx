import { DEMO_BULLETS, DEMO_LABEL, DEMO_MODE } from '../config/demoMode'
import { MARKETPLACE_LIVE, AGENTS_LIVE } from '../config/scStatus'

export default function DemoModeBanner() {
  if (!DEMO_MODE) return null

  const scOk = MARKETPLACE_LIVE && AGENTS_LIVE

  return (
    <div
      className="border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-transparent to-violet-950/30 px-3 py-2"
      role="status"
      aria-label="Mode démonstration"
    >
      <div className="page-wrap flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/35 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-cyan-200">
          <span className="live-dot !bg-cyan-400" />
          {DEMO_LABEL}
        </span>
        <p className="text-[11px] text-zinc-500 leading-snug flex-1">
          Démo · board paper · lectures on-chain · trading LIA off · SC market/agents{' '}
          <span className={scOk ? 'text-emerald-400' : 'text-amber-300'}>
            {scOk ? 'live' : 'pending'}
          </span>
        </p>
      </div>
      <details className="page-wrap mt-1 text-[10px] text-zinc-600">
        <summary className="cursor-pointer hover:text-zinc-400">Détail démo</summary>
        <ul className="mt-1 list-disc pl-4 space-y-0.5">
          {DEMO_BULLETS.map(b => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </details>
    </div>
  )
}
