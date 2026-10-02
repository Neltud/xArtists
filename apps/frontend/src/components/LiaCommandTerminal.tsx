/**
 * LIA terminal — collapsible, secondary to ambient aura (default closed).
 */
import { useEffect, useRef, useState } from 'react'
import type { ShaderUniformsTarget } from '../lib/semanticCompiler'

type Props = {
  phrase: string | null
  mood: ShaderUniformsTarget['mood']
  confidence: number
  source: 'lia' | 'paper' | 'pulse'
  pending?: boolean
  fallback?: boolean
  onAsk?: (ctx: string) => void
  contextHint?: string
  /** default false = ambient first */
  defaultOpen?: boolean
}

export default function LiaCommandTerminal({
  phrase,
  mood,
  confidence,
  source,
  pending,
  fallback,
  onAsk,
  contextHint = 'command-center',
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [lines, setLines] = useState<string[]>(['LIA · ambient mode · terminal optional'])
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!phrase) return
    setLines(prev => [...prev.slice(-10), `> ${phrase}`])
  }, [phrase])

  useEffect(() => {
    const onLine = (e: Event) => {
      const p = (e as CustomEvent).detail?.phrase
      if (typeof p === 'string' && p.trim()) {
        setLines(prev => [...prev.slice(-10), `> ${p}`])
      }
    }
    window.addEventListener('xartists:lia-line', onLine)
    return () => window.removeEventListener('xartists:lia-line', onLine)
  }, [])

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines, open])

  const moodColor =
    mood === 'aggressive' ? 'text-cyan-300' : mood === 'nervous' ? 'text-amber-300' : 'text-sky-300'

  return (
    <div className="fixed bottom-20 md:bottom-8 left-3 right-3 md:left-auto md:right-4 md:w-[min(100%,360px)] z-[70]">
      <div className="rounded-xl border border-cyan-500/20 bg-black/85 backdrop-blur-md shadow-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-3 py-2 border-b border-white/10 text-left"
        >
          <span className="text-[10px] uppercase tracking-[0.18em] text-cyan-400/80 font-tech">
            LIA · {open ? 'terminal' : 'brief'}
          </span>
          <span className={`text-[10px] ${moodColor}`}>
            {pending ? '…' : source} · {(confidence * 100).toFixed(0)}%
          </span>
        </button>
        {open && (
          <div className="px-3 py-2 space-y-2">
            <div className="h-20 overflow-y-auto font-mono text-[11px] text-zinc-400 space-y-1">
              {lines.map((l, i) => (
                <p key={i} className="leading-snug">
                  {l}
                </p>
              ))}
              <div ref={endRef} />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-lg border border-cyan-500/25 bg-cyan-500/10 py-1.5 text-[11px] text-cyan-100"
                onClick={() => onAsk?.(contextHint)}
                disabled={pending}
              >
                {pending ? '…' : 'Brief'}
              </button>
              <button
                type="button"
                className="rounded-lg border border-white/10 px-2 py-1.5 text-[11px] text-zinc-500"
                onClick={() => setLines(['cleared'])}
              >
                clr
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
