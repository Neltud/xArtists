/**
 * Market metrics — multi-asset live (BTC ETH SOL TAO EGLD GOLD) + shadow bars.
 */
import { useEffect, useRef, useState } from 'react'
import { asText } from '../../lib/safeRender'
import LiveAssetTape from '../LiveAssetTape'

type Metrics = {
  egldUsd: number | null
  btcUsd: number | null
  ethUsd: number | null
  solUsd: number | null
  taoUsd: number | null
  goldUsd: number | null
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
    const max = Math.max(...values.map(Math.abs), 1e-9)
    const bw = (w - 16) / values.length
    values.forEach((v, i) => {
      const bh = (Math.abs(v) / max) * (h - 28)
      const x = 8 + i * bw
      const y = v >= 0 ? h / 2 - bh : h / 2
      ctx.fillStyle = v >= 0 ? color : '#f43f5e'
      ctx.globalAlpha = 0.9
      ctx.fillRect(x + 2, y, Math.max(4, bw - 4), Math.max(2, bh))
      ctx.globalAlpha = 1
      ctx.fillStyle = '#a1a1aa'
      ctx.font = '10px sans-serif'
      ctx.fillText(labels[i] || '', x + 2, h - 6)
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
      <canvas
        ref={ref}
        width={320}
        height={120}
        className="w-full h-[120px] rounded-lg bg-black/40 border border-cyan-500/15"
      />
    </div>
  )
}

export default function MarketMetricsCharts() {
  const [m, setM] = useState<Metrics>({
    egldUsd: null,
    btcUsd: null,
    ethUsd: null,
    solUsd: null,
    taoUsd: null,
    goldUsd: null,
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
      let solUsd: number | null = null
      let taoUsd: number | null = null
      let goldUsd: number | null = null
      try {
        const r = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,bittensor,elrond-erd-2,pax-gold&vs_currencies=usd',
          { cache: 'no-store' },
        )
        if (r.ok) {
          const j = await r.json()
          btcUsd = Number(j.bitcoin?.usd) || null
          ethUsd = Number(j.ethereum?.usd) || null
          solUsd = Number(j.solana?.usd) || null
          taoUsd = Number(j.bittensor?.usd) || null
          egldUsd = Number(j['elrond-erd-2']?.usd) || null
          goldUsd = Number(j['pax-gold']?.usd) || null
        }
      } catch {
        /* */
      }
      if (egldUsd == null) {
        try {
          const r = await fetch('https://api.multiversx.com/economics', { cache: 'no-store' })
          if (r.ok) {
            const j = await r.json()
            egldUsd = Number(j.price) || null
          }
        } catch {
          /* */
        }
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
      if (!c)
        setM({
          egldUsd,
          btcUsd,
          ethUsd,
          solUsd,
          taoUsd,
          goldUsd,
          shadowPnl,
          winRate,
          fills,
          dayIndex,
        })
    })()
    return () => {
      c = true
    }
  }, [])

  // log-ish display scale so majors fit on one chart
  const priceBars = [
    Math.log10((m.btcUsd || 1) + 1),
    Math.log10((m.ethUsd || 1) + 1),
    Math.log10((m.solUsd || 1) + 1),
    Math.log10((m.taoUsd || 1) + 1),
    Math.log10((m.egldUsd || 1) + 1),
    Math.log10((m.goldUsd || 1) + 1),
  ]

  return (
    <section className="card space-y-4 border-cyan-500/20 bg-gradient-to-b from-cyan-950/20 to-transparent">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-cyan-300/80 font-semibold">
          Market · live
        </p>
        <p className="text-[12px] text-zinc-500">BTC · ETH · SOL · TAO · EGLD · GOLD — poll public APIs</p>
      </div>
      <LiveAssetTape compact />
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[11px]">
        {(
          [
            ['BTC', m.btcUsd],
            ['ETH', m.ethUsd],
            ['SOL', m.solUsd],
            ['TAO', m.taoUsd],
            ['EGLD', m.egldUsd],
            ['GOLD', m.goldUsd],
          ] as const
        ).map(([lab, v]) => (
          <div key={lab} className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5">
            <p className="text-zinc-500">{lab}</p>
            <p className="font-semibold tabular-nums text-white">
              {v != null ? (v >= 100 ? `$${Math.round(v)}` : `$${v.toFixed(2)}`) : '—'}
            </p>
          </div>
        ))}
      </div>
      <BarChart
        label="Log scale (display)"
        values={priceBars}
        labels={['BTC', 'ETH', 'SOL', 'TAO', 'EGLD', 'XAU']}
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
      <p className="text-[10px] text-zinc-600">Paper · not investment advice</p>
    </section>
  )
}
