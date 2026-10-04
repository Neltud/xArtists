/** Shadow sprint performance — equity curve + KPIs (paper only). */
import { useEffect, useMemo, useRef, useState } from 'react'
import { asText } from '../../lib/safeRender'

type CurvePt = { ts?: string; equity?: number }
type ShadowExport = {
  fills?: number
  shadow_pnl_usd?: number
  win_rate?: number | null
  equity_now_usd?: number
  equity_curve?: CurvePt[]
  day_index?: number
  sprint_status?: string
  last_shadow?: { id?: string; side?: string; asset?: string; pnl_usd?: number; ts?: string }[]
  note?: string
}

async function loadExport(): Promise<ShadowExport | null> {
  const bases = [
    `${typeof window !== 'undefined' ? window.location.origin : ''}${import.meta.env.BASE_URL || '/'}data/`,
    'https://neltud.github.io/xArtists/data/',
    '/data/',
  ]
  for (const b of bases) {
    try {
      const r = await fetch(`${b}lia_shadow_export.json`, { cache: 'no-store' })
      if (!r.ok) continue
      const j = await r.json()
      if (j && typeof j === 'object') return j as ShadowExport
    } catch {
      /* */
    }
  }
  try {
    const r = await fetch(`${import.meta.env.BASE_URL || '/'}data/lia_shadow_sprint.json`, {
      cache: 'no-store',
    })
    if (r.ok) {
      const j = await r.json()
      return {
        fills: j.fills_total,
        shadow_pnl_usd: j.shadow_pnl_usd,
        win_rate: j.win_rate,
        equity_now_usd: j.equity_now_usd,
        equity_curve: j.equity_curve,
        day_index: j.day_index,
        sprint_status: j.status,
        note: j.note,
      }
    }
  } catch {
    /* */
  }
  return null
}

function EquityCanvas({ curve }: { curve: CurvePt[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c || curve.length < 2) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const w = c.width
    const h = c.height
    ctx.clearRect(0, 0, w, h)
    const vals = curve.map(p => Number(p.equity) || 0)
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const span = max - min || 1
    ctx.strokeStyle = 'rgba(34,211,238,0.85)'
    ctx.lineWidth = 2
    ctx.beginPath()
    vals.forEach((v, i) => {
      const x = (i / (vals.length - 1)) * (w - 8) + 4
      const y = h - 4 - ((v - min) / span) * (h - 12)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 1
    const y0 = h - 4 - ((1000 - min) / span) * (h - 12)
    ctx.beginPath()
    ctx.moveTo(4, y0)
    ctx.lineTo(w - 4, y0)
    ctx.stroke()
  }, [curve])
  return (
    <canvas
      ref={ref}
      width={320}
      height={100}
      className="w-full max-w-md h-[100px] rounded-lg bg-black/40 border border-white/10"
      aria-label="Courbe equity shadow"
    />
  )
}

export default function ShadowPerformance() {
  const [data, setData] = useState<ShadowExport | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = () =>
      void loadExport().then(d => {
        if (!cancelled) setData(d)
      })
    load()
    const id = window.setInterval(load, 15_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  const curve = useMemo(() => data?.equity_curve || [], [data])

  if (!data) {
    return <p className="text-[12px] text-zinc-500 animate-pulse">Chargement shadow sprint…</p>
  }

  const pnl = data.shadow_pnl_usd
  const pnlCls =
    typeof pnl === 'number' && pnl > 0
      ? 'text-emerald-300'
      : typeof pnl === 'number' && pnl < 0
        ? 'text-rose-300'
        : 'text-white'

  return (
    <section className="card space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
            Shadow Performance
          </p>
          <p className="text-[12px] text-zinc-500">
            Sprint jour {asText(data.day_index ?? '—')}/7 · {asText(data.sprint_status || 'paper')}
          </p>
        </div>
        <p className={`text-lg font-bold tabular-nums ${pnlCls}`}>
          {pnl != null ? `${pnl >= 0 ? '+' : ''}${asText(pnl)} USD` : '—'}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[12px]">
        <div>
          <p className="text-zinc-500">Fills</p>
          <p className="font-semibold tabular-nums">{asText(data.fills)}</p>
        </div>
        <div>
          <p className="text-zinc-500">Win rate</p>
          <p className="font-semibold tabular-nums">
            {data.win_rate != null ? `${asText(Math.round(Number(data.win_rate) * 100))}%` : '—'}
          </p>
        </div>
        <div>
          <p className="text-zinc-500">Equity</p>
          <p className="font-semibold tabular-nums">{asText(data.equity_now_usd)} USD</p>
        </div>
      </div>
      {curve.length >= 2 && <EquityCanvas curve={curve} />}
      {data.last_shadow && data.last_shadow.length > 0 && (
        <ul className="text-[11px] space-y-1 text-zinc-400 max-h-28 overflow-y-auto">
          {data.last_shadow
            .slice()
            .reverse()
            .map((x, i) => (
              <li
                key={asText(x.id) + String(i)}
                className="flex justify-between gap-2 border-b border-white/5 py-0.5"
              >
                <span>
                  {asText(x.side)} {asText(x.asset)}
                </span>
                <span className="tabular-nums">{asText(x.pnl_usd)}</span>
              </li>
            ))}
        </ul>
      )}
      <p className="text-[10px] text-zinc-600">
        {asText(data.note, 'Paper only — zero real capital')}
      </p>
    </section>
  )
}
