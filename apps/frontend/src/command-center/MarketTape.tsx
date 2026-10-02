/**
 * Market tape — flux paper discret (pas de promesse de profit).
 */
import { useEffect, useState } from 'react'
import { paperTapeLine, type AmbientSnapshot, type TapeLine } from '../lib/ambientAura'

export default function MarketTape({ snap }: { snap: AmbientSnapshot }) {
  const [lines, setLines] = useState<TapeLine[]>([])
  const [seq, setSeq] = useState(0)

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

  return (
    <aside className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-tech">Tape</span>
        <span className="text-[9px] text-amber-200/70">paper only</span>
      </div>
      <ul className="max-h-28 overflow-y-auto px-3 py-2 space-y-1 font-mono text-[11px] text-zinc-400">
        {lines.length === 0 && <li className="text-zinc-600">waiting pulse…</li>}
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
