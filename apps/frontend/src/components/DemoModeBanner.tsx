import { DEMO_BULLETS, DEMO_LABEL, DEMO_MODE } from '../config/demoMode'
import { MARKETPLACE_LIVE, AGENTS_LIVE } from '../config/scStatus'

export default function DemoModeBanner() {
  if (!DEMO_MODE) return null

  return (
    <div
      className="border-b border-cyan-500/30 bg-gradient-to-r from-cyan-950/80 via-[#0a0a12] to-purple-950/50 px-3 py-2"
      role="status"
      aria-label="Mode démonstration"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-cyan-200">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          {DEMO_LABEL}
        </span>
        <p className="text-[11px] text-zinc-400 leading-snug flex-1">
          Démo produit : données board/signaux en paper · lectures on-chain live · trading auto
          LIA off · market/agents SC{' '}
          <span className={MARKETPLACE_LIVE && AGENTS_LIVE ? 'text-green-400' : 'text-amber-300'}>
            {MARKETPLACE_LIVE && AGENTS_LIVE ? 'live' : 'pending'}
          </span>
          .
        </p>
      </div>
      <details className="max-w-7xl mx-auto mt-1 text-[10px] text-zinc-500">
        <summary className="cursor-pointer hover:text-zinc-400">Détail démo</summary>
        <ul className="mt-1 list-disc pl-4 space-y-0.5 text-zinc-500">
          {DEMO_BULLETS.map(b => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </details>
    </div>
  )
}
