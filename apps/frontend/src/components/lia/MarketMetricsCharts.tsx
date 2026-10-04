/**
 * Market metrics diagrams — macro / crypto / MVX (not NFT- or TRO-centric).
 * Data from public APIs + shadow export; paper labels honest.
 */
import { useEffect, useRef, useState } from 'react'
import { asText } from '../../lib/safeRender'

type Metrics = {
  egldUsd: number | null
  btcUsd: number | null
  ethUsd: number | null
  shadowPnl: number | null
  winRate: number | null
  fills: number | null
  dayIndex: number | null
}

function BarChart({
  label,
  values,
  labels,
  color = '#22d3ee',
}: {
  label: string
  values: number[]
  labels: string[]
  color?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c || !values.length) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const w = c.width
    const h = c.height
    ctx.clearRect(0, 0, w, h)
    const max = Math.max(...values.map(Math.abs), 1)
    const bw = (w - 16) / values.length
    values.forEach((v, i) => {
      const bh = (Math.abs(v) / max) * (h - 24)
      const x = 8 + i * bw
      const y = v >= 0 ? h / 2 - bh : h / 2
      ctx.fillStyle = v >= 0 ? color : '#f43f5e'
      ctx.globalAlpha = 0.85
      ctx.fillRect(x + 2, y, bw - 4, Math.max(2, bh))
      ctx.globalAlpha = 1
      ctx.fillStyle = '#71717a'
      ctx.font = '9px sans-serif'
      ctx.fillText(labels[i] || '', x + 2, h - 4)
    })
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.beginPath()
    ctx.moveTo(4, h / 2)
    ctx.lineTo(w - 4, h / 2)
    ctx.stroke()
  }, [values, labels, color])
  return (
    <div>
      <p className="text-[10px] uppercase text-zinc-500 mb-1">{label}</p>
      <canvas ref={ref} width={280} height={100} className="w-full h-[100px] rounded-lg bg-black/30 border border-white/10" />
    </div>
  )
}

export default function MarketMetricsCharts() {
  const [m, setM] = useState<Metrics>({
    egldUsd: null,
    btcUsd: null,
    ethUsd: null,
    shadowPnl: null,
    winRate: null,
    fills: null,
    dayIndex: null,
  })

  useEffect(() => {
    let c = false
    ;(async () => {
      let egldUsd: number | null = null
      let btcUsd: number | null = null
      let ethUsd: number | null = null
      try {
        const r = await fetch('https://api.multiversx.com/economics', { cache: 'no-store' })
        if (r.ok) {
          const j = await r.json()
          egldUsd = Number(j.price) || null
        }
      } catch {
        /* */
      }
      try {
        const r = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd',
          { cache: 'no-store' },
        )
        if (r.ok) {
          const j = await r.json()
          btcUsd = Number(j.bitcoin?.usd) || null
          ethUsd = Number(j.ethereum?.usd) || null
        }
      } catch {
        /* */
      }
      let shadowPnl: number | null = null
      let winRate: number | null = null
      let fills: number | null = null
      let dayIndex: number | null = null
      try {
        const base = import.meta.env.BASE_URL || '/'
        const r = await fetch(`${base}data/lia_shadow_export.json`, { cache: 'no-store' })
        if (r.ok) {
          const j = await r.json()
          shadowPnl = j.shadow_pnl_usd ?? null
          winRate = j.win_rate ?? null
          fills = j.fills ?? null
          dayIndex = j.day_index ?? null
        }
      } catch {
        /* */
      }
      if (!c) setM({ egldUsd, btcUsd, ethUsd, shadowPnl, winRate, fills, dayIndex })
    })()
    return () => {
      c = true
    }
  }, [])

  const priceBars = [m.btcUsd || 0, m.ethUsd || 0, (m.egldUsd || 0) * 500].map(v => v / 1000)
  // normalize rough scale for display only

  return (
    <section className="card space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
          Market metrics
        </p>
        <p className="text-[12px] text-zinc-500">
          Macro / majors / EGLD + shadow sprint — pas de signaux NFT dédiés.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[12px]">
        <div>
          <p className="text-zinc-500">BTC</p>
          <p className="font-semibold tabular-nums">
            {m.btcUsd != null ? `$${asText(Math.round(m.btcUsd))}` : '—'}
          </p>
        </div>
        <div>
          <p className="text-zinc-500">ETH</p>
          <p className="font-semibold tabular-nums">
            {m.ethUsd != null ? `$${asText(Math.round(m.ethUsd))}` : '—'}
          </p>
        </div>
        <div>
          <p className="text-zinc-500">EGLD</p>
          <p className="font-semibold tabular-nums">
            {m.egldUsd != null ? `$${asText(m.egldUsd.toFixed(2))}` : '—'}
          </p>
        </div>
      </div>
      <BarChart
        label="Relative scale (display only)"
        values={priceBars}
        labels={['BTC', 'ETH', 'EGLD×']}
        color="#a78bfa"
      />
      <div className="grid grid-cols-3 gap-2 text-[12px]">
        <div>
          <p className="text-zinc-500">Shadow PnL</p>
          <p className="font-semibold tabular-nums">{asText(m.shadowPnl)} USD</p>
        </div>
        <div>
          <p className="text-zinc-500">Win rate</p>
          <p className="font-semibold tabular-nums">
            {m.winRate != null ? `${asText(Math.round(m.winRate * 100))}%` : '—'}
          </p>
        </div>
        <div>
          <p className="text-zinc-500">Sprint day</p>
          <p className="font-semibold tabular-nums">
            {m.dayIndex != null ? `${asText(m.dayIndex)}/7` : '—'}
          </p>
        </div>
      </div>
      <BarChart
        label="Shadow fills vs win% (scaled)"
        values={[m.fills || 0, (m.winRate || 0) * 100, Math.abs(m.shadowPnl || 0) * 10]}
        labels={['fills', 'win%', '|pnl|']}
        color="#34d399"
      />
      <p className="text-[10px] text-zinc-600">Paper · friction on · not investment advice</p>
    </section>
  )
}
