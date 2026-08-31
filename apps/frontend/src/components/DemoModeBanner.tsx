import { DEMO_LABEL, DEMO_MODE } from '../config/demoMode'

/** Bandeau discret soft launch — pas de jargon SC. */
export default function DemoModeBanner() {
  if (!DEMO_MODE) return null

  return (
    <div
      className="border-b border-white/[0.06] bg-black/30 px-3 py-1.5"
      role="status"
      aria-label="Mode démonstration"
    >
      <div className="page-wrap flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-300">
          {DEMO_LABEL}
        </span>
        <span className="leading-snug">
          Démo · paper · lectures chaîne · packs Pulse · Yield · Sentinel
        </span>
      </div>
    </div>
  )
}
