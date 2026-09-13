/**
 * THE PULSE — demo sensory strip on Home (static cycle; optional live API later).
 */
import { useEffect, useState } from 'react'
import { PULSE_DEMO_CYCLE, type PulseEnvironment } from '../lib/pulseDemo'

export default function PulseStrip() {
  const [i, setI] = useState(0)
  const env: PulseEnvironment = PULSE_DEMO_CYCLE[i % PULSE_DEMO_CYCLE.length]

  useEffect(() => {
    const t = window.setInterval(() => setI(v => v + 1), 7000)
    return () => window.clearInterval(t)
  }, [])

  const sentPct = Math.round(((env.sentiment + 1) / 2) * 100)

  return (
    <div
      className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 space-y-2 transition-colors duration-700"
      style={{ boxShadow: `inset 0 0 0 1px ${env.color_target}22` }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          The Pulse
        </p>
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/10"
          style={{ color: env.color_target }}
        >
          {env.category.replace('_', ' ')}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div
          className="h-2.5 w-2.5 rounded-full shrink-0 animate-pulse"
          style={{ background: env.color_target }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-zinc-200 truncate">
            {env.vibe.replace('_', ' ')}
            {env.asset ? (
              <span className="text-zinc-500"> · {env.asset}</span>
            ) : null}
          </p>
          <p className="text-[11px] text-zinc-500 truncate">{env.context}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[12px] mono text-zinc-400">{env.sentiment.toFixed(2)}</p>
          <p className="text-[10px] text-zinc-600">{env.intensity}</p>
        </div>
      </div>
      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${sentPct}%`,
            background: env.color_target,
            opacity: 0.85,
          }}
        />
      </div>
      <p className="text-[10px] text-zinc-600">
        ENVIRONMENT_UPDATE · demo cycle (live X API on host pulse-layer)
      </p>
    </div>
  )
}
