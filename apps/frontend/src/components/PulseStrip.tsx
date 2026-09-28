/**
 * THE PULSE — source unique via usePulse (WS / HTTP / démo).
 */
import { usePulse } from '../hooks/usePulse'

export default function PulseStrip() {
  const { env, source, connected } = usePulse()
  const sentPct = Math.round(((env.sentiment + 1) / 2) * 100)

  return (
    <div
      className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 space-y-2 transition-colors duration-700"
      style={{ boxShadow: `inset 0 0 0 1px ${env.color_target}22` }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">The Pulse</p>
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/10"
          style={{ color: env.color_target }}
        >
          {env.category.replace(/_/g, ' ')}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div
          className="h-2.5 w-2.5 rounded-full shrink-0 animate-pulse"
          style={{ background: env.color_target }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-zinc-200 truncate">{env.context || env.vibe}</p>
          <p className="text-[10px] text-zinc-500">
            sentiment {sentPct}% · {env.intensity} · source {source}
            {connected ? ' · live' : ''}
          </p>
        </div>
      </div>
      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${sentPct}%`, background: env.color_target }}
        />
      </div>
    </div>
  )
}
