/**
 * Market tape — flux paper discret (pas de promesse de profit).
 * Empty state: ticker animé + métriques ambiantes en cache (pas "waiting pulse…" figé).
 */
import { useEffect, useState } from 'react'
import { paperTapeLine, type AmbientSnapshot, type TapeLine } from '../lib/ambientAura'

const LOADING_TICKS = [
  'sync pulse…',
  'cache métriques…',
  'sentiment · vol…',
  'lia shadow…',
]

export default function MarketTape({ snap }: { snap: AmbientSnapshot }) {
  const [lines, setLines] = useState<TapeLine[]>([])
  const [seq, setSeq] = useState(0)
  const [tickIdx, setTickIdx] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setSeq(s => {
        const n = s + 1
        const row = paperTapeLine(snap, n)
        setLines(prev => [row, ...prev].slice(0, 8))
        return n
      })
    }, 4200)
    return () => window.clearInterval(id)
  }, [snap])

  useEffect(() => {
    if (lines.length > 0) return
    const id = window.setInterval(() => setTickIdx(i => (i + 1) % LOADING_TICKS.length), 900)
    return () => window.clearInterval(id)
  }, [lines.length])

  const cacheHint = [
    snap.mode ? `mode ${snap.mode}` : null,
    snap.trend ? `trend ${snap.trend}` : null,
    Number.isFinite(snap.volatility) ? `vol ${(snap.volatility * 100).toFixed(0)}%` : null,
    Number.isFinite(snap.confidence) ? `conf ${(snap.confidence * 100).toFixed(0)}%` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <aside className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-tech">Tape</span>
        <span className="text-[9px] text-amber-200/70">paper only</span>
      </div>
      <ul className="max-h-28 overflow-y-auto px-3 py-2 space-y-1 font-mono text-[11px] text-zinc-400">
        {lines.length === 0 && (
          <li className="text-zinc-500 flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/80 animate-pulse" aria-hidden />
              {LOADING_TICKS[tickIdx]}
            </span>
            {cacheHint ? (
              <span className="text-[10px] text-zinc-600 truncate">cache · {cacheHint}</span>
            ) : null}
          </li>
        )}
        {lines.map(l => (
          <li key={l.id} className="flex gap-2">
            <span className="text-zinc-600 shrink-0">{l.kind}</span>
            <span className="truncate">{l.text}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
