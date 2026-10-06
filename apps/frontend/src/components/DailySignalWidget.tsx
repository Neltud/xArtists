/** Daily patronage signal — read-only, no auto trade. */
import { useEffect, useState } from 'react'

type DailySignal = {
  date?: string
  headline?: string
  summary?: string
  regime?: string
  confidence?: number
  disclaimer?: string
  patronage?: { rebalance_hint?: string }
}

const LOCAL = `${import.meta.env.BASE_URL || '/'}data/signals/daily_signal.json`

function apiBase() {
  return ((import.meta.env.VITE_ACCESS_API_BASE as string) || '').replace(/\/$/, '')
}

export default function DailySignalWidget({ compact }: { compact?: boolean }) {
  const [sig, setSig] = useState<DailySignal | null>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      const base = apiBase()
      try {
        if (base) {
          const r = await fetch(`${base}/v1/signals/daily`, { cache: 'no-store' })
          if (r.ok) {
            const j = await r.json()
            if (!c && j.signal) {
              setSig(j.signal)
              return
            }
          }
        }
        const r2 = await fetch(LOCAL, { cache: 'no-store' })
        if (r2.ok && !c) setSig(await r2.json())
      } catch {
        /* */
      }
    })()
    return () => {
      c = true
    }
  }, [])

  if (!sig) return null

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md text-left ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Signal du jour</p>
      <p className="mt-1 text-[13px] font-medium text-amber-50/95">{sig.headline}</p>
      {!compact && sig.summary ? (
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">{sig.summary}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-zinc-500">
        {sig.regime ? <span className="rounded-full border border-white/10 px-2 py-0.5">{sig.regime}</span> : null}
        {sig.patronage?.rebalance_hint ? (
          <span className="rounded-full border border-white/10 px-2 py-0.5">
            {sig.patronage.rebalance_hint}
          </span>
        ) : null}
        {sig.date ? <span>{sig.date}</span> : null}
      </div>
      <p className="mt-2 text-[9px] text-zinc-600">{sig.disclaimer || 'Pas un conseil financier.'}</p>
    </div>
  )
}
