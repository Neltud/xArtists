/**
 * LIA host presence — floating core (no fake TX success).
 */
import { useEffect, useState } from 'react'
import type { MuseumSpaceId } from '../../lib/museumSpaces'
import { LIA_HOST_LINES } from '../../lib/museumSpaces'

export default function LiaHost({
  space,
  lineExtra,
}: {
  space: MuseumSpaceId
  lineExtra?: string | null
}) {
  const lines = LIA_HOST_LINES[space] || []
  const [i, setI] = useState(0)

  useEffect(() => {
    setI(0)
  }, [space])

  useEffect(() => {
    if (lines.length <= 1) return
    const id = window.setInterval(() => setI(x => (x + 1) % lines.length), 7000)
    return () => clearInterval(id)
  }, [lines.length, space])

  const text = lineExtra || lines[i] || 'LIA — hôte du musée.'

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-20">
      <div className="flex items-end gap-3">
        <div
          className="relative h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-cyan-400/80 via-violet-500/70 to-fuchsia-500/60 shadow-[0_0_40px_rgba(34,211,238,0.35)] animate-pulse"
          aria-hidden
        >
          <div className="absolute inset-1 rounded-full border border-white/30" />
          <div className="absolute inset-[30%] rounded-full bg-white/40 blur-[1px]" />
        </div>
        <div className="pointer-events-auto rounded-2xl border border-cyan-500/30 bg-black/70 backdrop-blur-md px-3 py-2 shadow-xl">
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/90 font-semibold mb-0.5">
            LIA · hôte
          </p>
          <p className="text-sm text-zinc-100 leading-snug">{text}</p>
        </div>
      </div>
    </div>
  )
}
