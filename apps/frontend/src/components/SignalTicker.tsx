import { useEffect, useState } from 'react'

const RAW = 'https://raw.githubusercontent.com/Neltud/xArtists/main'

type TickerPayload = {
  updated?: string
  lines?: string[]
  fused?: { decision?: string; confidence?: number; source?: string }
}

export default function SignalTicker() {
  const [lines, setLines] = useState<string[]>([
    'LIA · PAPER · GSN · feeds crypto / finance / culture',
  ])
  const [meta, setMeta] = useState<string>('PAPER')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const urls = [
        `${import.meta.env.BASE_URL}data/signal_ticker.json?t=${Date.now()}`,
        `${RAW}/data/signal_ticker.json?t=${Date.now()}`,
      ]
      for (const url of urls) {
        try {
          const r = await fetch(url, { cache: 'no-store' })
          if (!r.ok) continue
          const j = (await r.json()) as TickerPayload
          if (cancelled) return
          if (Array.isArray(j.lines) && j.lines.length) setLines(j.lines)
          const d = j.fused?.decision || 'WAIT'
          const c = j.fused?.confidence
          setMeta(`PAPER · ${d}${c != null ? ` ${c}` : ''}`)
          return
        } catch {
          /* next */
        }
      }
    }
    load()
    const id = setInterval(load, 60_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const text = lines.join('   ···   ')

  return (
    <div
      className="fixed bottom-14 md:bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] glass"
      role="marquee"
      aria-label="Signal ticker LIA"
    >
      <div className="flex items-center gap-2 max-w-full overflow-hidden h-8 px-2">
        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-violet-200 px-2 py-0.5 rounded-md bg-violet-500/15 border border-violet-500/25">
          {meta}
        </span>
        <div className="relative flex-1 overflow-hidden">
          <div
            className="whitespace-nowrap text-[11px] text-zinc-500 mono"
            style={{
              animation: 'ticker 40s linear infinite',
            }}
          >
            {text}&nbsp;&nbsp;&nbsp;{text}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
