/**
 * P3.5 Holder terminal — SHADOW metrics, Beta risk, active strategy (orchestrator).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { asText } from '../../lib/safeRender'

type CurvePt = { ts?: string; equity?: number }
type Sprint = {
  day_index?: number
  sprint_days_target?: number
  status?: string
  fills_total?: number
  shadow_pnl_usd?: number
  win_rate?: number | null
  equity_now_usd?: number
  equity_start_usd?: number
}
type ExportSnap = {
  fills?: number
  shadow_pnl_usd?: number
  win_rate?: number | null
  equity_curve?: CurvePt[]
  day_index?: number
}

const BETA_LIMITS = {
  maxTradeUsd: 15,
  maxDailyUsd: 40,
  maxExposureEgld: 0.05,
  maxDd: 0.12,
  minConf: 0.62,
}

function maxDrawdown(curve: CurvePt[]): number | null {
  if (!curve.length) return null
  let peak = Number(curve[0].equity) || 0
  let maxDd = 0
  for (const p of curve) {
    const e = Number(p.equity) || 0
    if (e > peak) peak = e
    if (peak > 0) maxDd = Math.max(maxDd, (peak - e) / peak)
  }
  return maxDd
}

function EquityArea({ curve }: { curve: CurvePt[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c || curve.length < 2) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const w = c.width
    const h = c.height
    const vals = curve.map(p => Number(p.equity) || 0)
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const span = max - min || 1
    ctx.clearRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    for (let i = 1; i < 4; i++) {
      const y = (h * i) / 4
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
    const pts = vals.map((v, i) => ({
      x: (i / (vals.length - 1)) * (w - 2) + 1,
      y: h - 6 - ((v - min) / span) * (h - 14),
    }))
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, 'rgba(16,185,129,0.35)')
    grad.addColorStop(1, 'rgba(16,185,129,0.02)')
    ctx.beginPath()
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    ctx.lineTo(pts[pts.length - 1].x, h - 4)
    ctx.lineTo(pts[0].x, h - 4)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()
    ctx.beginPath()
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    ctx.strokeStyle = 'rgba(52,211,153,0.95)'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [curve])
  return (
    <canvas
      ref={ref}
      width={640}
      height={160}
      className="w-full h-[160px] rounded-xl bg-[#0a0a0c]"
      aria-label="Equity curve shadow"
    />
  )
}

async function loadJson(name: string): Promise<Record<string, unknown> | null> {
  const bases = [
    `${import.meta.env.BASE_URL || '/'}data/`,
    'https://neltud.github.io/xArtists/data/',
  ]
  for (const b of bases) {
    try {
      const r = await fetch(`${b}${name}`, { cache: 'no-store' })
      if (!r.ok) continue
      return (await r.json()) as Record<string, unknown>
    } catch {
      /* */
    }
  }
  return null
}

export default function HolderTerminal() {
  const [sprint, setSprint] = useState<Sprint | null>(null)
  const [exp, setExp] = useState<ExportSnap | null>(null)
  const [health, setHealth] = useState('…')
  const [stratCount, setStratCount] = useState(13)
  const [activeStrat, setActiveStrat] = useState<string>('—')
  const [switchReason, setSwitchReason] = useState('')

  useEffect(() => {
    let c = false
    const load = async () => {
      const [s, e, cat, orch] = await Promise.all([
        loadJson('lia_shadow_sprint.json'),
        loadJson('lia_shadow_export.json'),
        loadJson('strategies_catalog.json'),
        loadJson('strategy_orchestrator.json'),
      ])
      if (c) return
      setSprint((s as Sprint) || null)
      setExp((e as ExportSnap) || null)
      setHealth(s ? 'Brain · export OK' : 'Awaiting shadow data')
      const items = (cat as { items?: unknown[] } | null)?.items
      if (Array.isArray(items)) setStratCount(items.length)
      const o = orch as { active?: string; switch_reason?: string; last_reason?: string } | null
      if (o?.active) setActiveStrat(String(o.active))
      if (o?.switch_reason) setSwitchReason(String(o.switch_reason))
      else if (o?.last_reason) setSwitchReason(String(o.last_reason))
    }
    void load()
    const id = window.setInterval(() => void load(), 20_000)
    return () => {
      c = true
      window.clearInterval(id)
    }
  }, [])

  const curve = useMemo(() => exp?.equity_curve || [], [exp])
  const start = sprint?.equity_start_usd ?? 1000
  const now = sprint?.equity_now_usd ?? exp?.equity_now_usd ?? start
  const pnl = sprint?.shadow_pnl_usd ?? exp?.shadow_pnl_usd
  const wr = sprint?.win_rate ?? exp?.win_rate
  const dd = maxDrawdown(curve)
  const sharpeProxy =
    dd != null && dd > 0.0001 && typeof pnl === 'number' ? pnl / (dd * start) : null
  const exposureUsd =
    typeof now === 'number' ? Math.min(BETA_LIMITS.maxTradeUsd, Math.abs(Number(pnl) || 0)) : 0

  return (
    <section className="space-y-5 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-4 sm:p-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 font-medium">
            Holder terminal
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Performance</h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Shadow equity</p>
          <p className="text-xl font-semibold tabular-nums text-white">
            {asText(now)} <span className="text-sm text-zinc-500">USD</span>
          </p>
        </div>
      </header>

      {curve.length >= 2 ? (
        <EquityArea curve={curve} />
      ) : (
        <div className="h-[160px] rounded-xl bg-[#0a0a0c] flex items-center justify-center text-[12px] text-zinc-600">
          Equity curve · waiting for sprint data
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Cumul. PnL',
            value:
              pnl != null ? `${Number(pnl) >= 0 ? '+' : ''}${asText(Number(pnl).toFixed(4))}` : '—',
            tone: typeof pnl === 'number' && pnl >= 0 ? 'text-emerald-400' : 'text-rose-400',
          },
          {
            label: 'Win rate',
            value: wr != null ? `${asText(Math.round(Number(wr) * 100))}%` : '—',
            tone: 'text-white',
          },
          {
            label: 'Max drawdown',
            value: dd != null ? `${asText((dd * 100).toFixed(2))}%` : '—',
            tone: 'text-white',
          },
          {
            label: 'Sharpe proxy',
            value: sharpeProxy != null ? asText(sharpeProxy.toFixed(2)) : '—',
            tone: 'text-white',
          },
        ].map(k => (
          <div key={k.label} className="rounded-xl bg-black/30 px-3 py-3 border border-white/[0.04]">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">{k.label}</p>
            <p className={`text-lg font-semibold tabular-nums ${k.tone}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-wider text-amber-200/80 font-semibold">
            Risk vs Beta Strike limits
          </p>
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-zinc-600 text-zinc-400">
            BETA MODE LOCKED
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div>
            <p className="text-zinc-500">Max trade</p>
            <p className="tabular-nums text-zinc-200">${BETA_LIMITS.maxTradeUsd}</p>
          </div>
          <div>
            <p className="text-zinc-500">Max daily</p>
            <p className="tabular-nums text-zinc-200">${BETA_LIMITS.maxDailyUsd}</p>
          </div>
          <div>
            <p className="text-zinc-500">DD stop</p>
            <p className="tabular-nums text-zinc-200">{BETA_LIMITS.maxDd * 100}%</p>
          </div>
          <div>
            <p className="text-zinc-500">Min conf</p>
            <p className="tabular-nums text-zinc-200">{BETA_LIMITS.minConf}</p>
          </div>
        </div>
        <p className="text-[10px] text-zinc-500">
          Shadow exposure proxy {asText(exposureUsd.toFixed(2))} USD · strategies {stratCount} · live
          path requires ops unlock
        </p>
      </div>

      <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/[0.03] p-3 space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-cyan-200/70 font-semibold">
          Active strategy
        </p>
        <p className="text-sm font-medium text-white mono">{asText(activeStrat)}</p>
        <p className="text-[11px] text-zinc-500 leading-snug">
          {asText(switchReason || 'Hysteresis stable · waiting for dominance')}
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 text-[12px]">
        <div className="rounded-xl bg-black/25 px-3 py-3 border border-white/[0.04]">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Sprint pulse</p>
          <p className="text-zinc-200 font-medium">
            Day {asText(sprint?.day_index ?? exp?.day_index ?? '—')}/
            {asText(sprint?.sprint_days_target ?? 7)}
          </p>
          <p className="text-zinc-500 mt-0.5">
            {asText(sprint?.status, '—')} · {asText(sprint?.fills_total ?? exp?.fills)} fills
          </p>
        </div>
        <div className="rounded-xl bg-black/25 px-3 py-3 border border-white/[0.04]">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">System</p>
          <p className="text-zinc-200">{asText(health)}</p>
          <p className="text-zinc-500 mt-0.5">Guardian preflight · paper path</p>
        </div>
        <div className="rounded-xl bg-black/25 px-3 py-3 border border-white/[0.04]">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Catalog</p>
          <p className="text-zinc-200">{stratCount} strategies</p>
          <p className="text-zinc-500 mt-0.5">Brain registry · paper default</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Link to="/portfolio" className="btn-secondary text-sm">
          Portfolio
        </Link>
        <Link to="/go-live" className="btn-secondary text-sm">
          Status
        </Link>
      </div>

      <p className="text-[10px] text-zinc-600 border-t border-white/[0.04] pt-3">
        SHADOW MODE / SIMULATED DATA — not live capital · LIA_LIVE_TRADING=0 · Beta toggle locked
      </p>
    </section>
  )
}
