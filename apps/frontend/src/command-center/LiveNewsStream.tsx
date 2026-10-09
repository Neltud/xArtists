/**
 * Live news stream — MultiversX ecosystem (static + optional fetch).
 * Auto vertical scroll. Paper labels — not financial advice.
 */
import { useEffect, useState } from 'react'

type NewsItem = { t: string; src: string; text: string }

const FALLBACK: NewsItem[] = [
  { t: '10:45', src: 'xExchange', text: 'Agrégation des frais activée sur les pools majeurs' },
  { t: '09:12', src: 'DEX', text: 'Volume en hausse sur les DEX MultiversX' },
  { t: '08:30', src: 'xPortal', text: 'Sessions wallet mobile stabilisées (multi-TX)' },
  { t: '07:55', src: 'Network', text: 'Finalité intra-shard ~600ms — rail agent-ready' },
  { t: '06:40', src: 'EGLD', text: 'Cotation publique relue via economics API' },
  { t: '05:18', src: 'Builders', text: 'Sovereign chains & dApp hub en expansion' },
  { t: '04:02', src: 'Staking', text: 'Validators 3200+ — recompute local, no screenshot trust' },
  { t: '02:50', src: 'xArtists', text: 'Command Center cyber deck · signaux paper LIA' },
]

export default function LiveNewsStream({ compact }: { compact?: boolean }) {
  const [items, setItems] = useState<NewsItem[]>(FALLBACK)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    let c = false
    ;(async () => {
      try {
        const base = import.meta.env.BASE_URL || '/'
        const r = await fetch(`${base}data/mvx_news.json`, { cache: 'no-store' })
        if (r.ok) {
          const j = await r.json()
          if (!c && Array.isArray(j?.items) && j.items.length) {
            setItems(
              j.items.map((x: Record<string, string>) => ({
                t: String(x.t || x.time || ''),
                src: String(x.src || x.source || 'MVX'),
                text: String(x.text || x.title || ''),
              })),
            )
          }
        }
      } catch {
        /* fallback */
      }
    })()
    return () => {
      c = true
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setOffset(o => o + 1), 3200)
    return () => window.clearInterval(id)
  }, [])

  const loop = [...items, ...items]
  const start = offset % items.length

  return (
    <div
      className={`glass-hud overflow-hidden ${compact ? 'h-36' : 'h-48'}`}
    >
      <div className="flex items-center justify-between px-3 pt-2 pb-1 border-b border-cyan-500/15">
        <p className="text-[10px] font-tech uppercase tracking-[0.2em] text-cyan-300/90">
          Live news · MVX
        </p>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
      </div>
      <div className="relative h-[calc(100%-28px)] overflow-hidden">
        <ul
          className="absolute inset-x-0 transition-transform duration-700 ease-linear"
          style={{ transform: `translateY(-${start * (compact ? 36 : 40)}px)` }}
        >
          {loop.map((n, i) => (
            <li
              key={`${n.t}-${i}`}
              className={`flex gap-2 px-3 ${compact ? 'h-9 py-1.5' : 'h-10 py-2'} border-b border-white/[0.04]`}
            >
              <span className="mono text-[10px] text-zinc-500 shrink-0 w-10">{n.t}</span>
              <span className="text-[10px] font-semibold text-violet-300/90 shrink-0 w-16 truncate">
                {n.src}
              </span>
              <span className="text-[11px] text-zinc-300 truncate">{n.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
