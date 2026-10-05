/**
 * P4 Holder terminal — Shadow (default) + Live on-chain display toggle.
 * Live = balances/TX display only. Does not enable LIA_LIVE_TRADING.
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
type LiveSnap = {
  equity_proxy_usd?: number
  egld_usd?: number
  deployer?: {
    egld?: number
    tokens?: Record<string, number>
    txs?: { txHash?: string; status?: string; function?: string; explorer?: string }[]
  }
}

const BETA_LIMITS = {
  maxTradeUsd: 15,
  maxDailyUsd: 40,
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
    <canvas ref={ref} width={640} height={160} className="w-full h-[160px] rounded-xl bg-[#0a0a0c]" />
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
  const [mode, setMode] = useState<'shadow' | 'live'>('shadow')
  const [sprint, setSprint] = useState<Sprint | null>(null)
  const [exp, setExp] = useState<ExportSnap | null>(null)
  const [live, setLive] = useState<LiveSnap | null>(null)
  const [health, setHealth] = useState('…')
  const [activeStrat, setActiveStrat] = useState('—')
  const [switchReason, setSwitchReason] = useState('')

  useEffect(() => {
    let c = false
    const load = async () => {
      const [s, e, orch, lv] = await Promise.all([
        loadJson('lia_shadow_sprint.json'),
        loadJson('lia_shadow_export.json'),
        loadJson('strategy_orchestrator.json'),
        loadJson('lia_live_status.json'),
      ])
      if (c) return
      setSprint((s as Sprint) || null)
      setExp((e as ExportSnap) || null)
      setLive((lv as LiveSnap) || null)
      setHealth(s ? 'Brain · export OK' : 'Awaiting shadow data')
      const o = orch as { active?: string; switch_reason?: string; last_reason?: string } | null
      if (o?.active) setActiveStrat(String(o.active))
      setSwitchReason(String(o?.switch_reason || o?.last_reason || ''))
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
  const shadowEquity = sprint?.equity_now_usd ?? exp?.equity_now_usd ?? start
  const pnl = sprint?.shadow_pnl_usd ?? exp?.shadow_pnl_usd
  const wr = sprint?.win_rate ?? exp?.win_rate
  const dd = maxDrawdown(curve)
  const isLive = mode === 'live'
  const displayEquity = isLive ? live?.equity_proxy_usd : shadowEquity

  return (
    <section
      className={`space-y-5 rounded-2xl border p-4 sm:p-5 ${
        isLive
          ? 'border-rose-500/40 bg-gradient-to-b from-rose-500/[0.07] to-transparent shadow-[0_0_40px_rgba(244,63,94,0.12)]'
          : 'border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent'
      }`}
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 font-medium">
            Holder terminal
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Performance</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-white/10 p-0.5 text-[10px] font-bold uppercase">
            <button
              type="button"
              className={`px-3 py-1 rounded-full ${
                !isLive ? 'bg-emerald-500/20 text-emerald-300' : 'text-zinc-500'
              }`}
              onClick={() => setMode('shadow')}
            >
              Shadow
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded-full ${
                isLive ? 'bg-rose-500/25 text-rose-300' : 'text-zinc-500'
              }`}
              onClick={() => setMode('live')}
            >
              Live
            </button>
          </div>
          {isLive && (
            <span className="text-[10px] font-bold tracking-widest text-rose-400 animate-pulse">
              ● LIVE
            </span>
          )}
        </div>
      </header>

      <div className="text-right">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">
          {isLive ? 'On-chain equity proxy' : 'Shadow equity'}
        </p>
        <p className="text-xl font-semibold tabular-nums text-white">
          {asText(displayEquity)} <span className="text-sm text-zinc-500">USD</span>
        </p>
      </div>

      {!isLive &&
        (curve.length >= 2 ? (
          <EquityArea curve={curve} />
        ) : (
          <div className="h-[120px] rounded-xl bg-[#0a0a0c] flex items-center justify-center text-[12px] text-zinc-600">
            Equity curve · shadow sprint
          </div>
        ))}

      {isLive && (
        <div className="rounded-xl border border-rose-500/20 bg-black/40 p-3 space-y-2">
          <p className="text-[10px] uppercase text-rose-300/80 font-semibold">Real balances</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px]">
            <div>
              <p className="text-zinc-500">EGLD</p>
              <p className="tabular-nums text-white">{asText(live?.deployer?.egld)}</p>
            </div>
            <div>
              <p className="text-zinc-500">USDC</p>
              <p className="tabular-nums text-white">
                {asText(live?.deployer?.tokens?.['USDC-c76f1f'])}
              </p>
            </div>
            <div>
              <p className="text-zinc-500">TRO</p>
              <p className="tabular-nums text-white">
                {asText(live?.deployer?.tokens?.['TRO-94c925'])}
              </p>
            </div>
            <div>
              <p className="text-zinc-500">EGLD USD</p>
              <p className="tabular-nums text-white">{asText(live?.egld_usd)}</p>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500">Display only · trading remains gated (LIA_LIVE_TRADING=0)</p>
          <ul className="text-[11px] space-y-1 max-h-28 overflow-y-auto">
            {(live?.deployer?.txs || []).slice(0, 5).map(t => (
              <li key={asText(t.txHash)} className="flex gap-2">
                <span className="text-rose-400 font-mono shrink-0">[LIVE]</span>
                <a
                  className="text-cyan-400 underline truncate"
                  href={t.explorer || `https://explorer.multiversx.com/transactions/${t.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {asText(t.function || t.txHash?.slice(0, 10))}
                </a>
                <span className="text-zinc-500">{asText(t.status)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isLive && (
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
              label: 'Max DD',
              value: dd != null ? `${asText((dd * 100).toFixed(2))}%` : '—',
              tone: 'text-white',
            },
            {
              label: 'Beta max trade',
              value: `$${BETA_LIMITS.maxTradeUsd}`,
              tone: 'text-white',
            },
          ].map(k => (
            <div key={k.label} className="rounded-xl bg-black/30 px-3 py-3 border border-white/[0.04]">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">{k.label}</p>
              <p className={`text-lg font-semibold tabular-nums ${k.tone}`}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/[0.03] p-3 space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-cyan-200/70 font-semibold">
          Active strategy
        </p>
        <p className="text-sm font-medium text-white mono">{asText(activeStrat)}</p>
        <p className="text-[11px] text-zinc-500">{asText(switchReason || 'Hysteresis stable')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/portfolio" className="btn-secondary text-sm">
          Portfolio
        </Link>
        <Link to="/go-live" className="btn-secondary text-sm">
          Status
        </Link>
      </div>

      <p className="text-[10px] text-zinc-600 border-t border-white/[0.04] pt-3">
        {isLive
          ? 'LIVE DISPLAY — balances & TX from chain · execution still gated · switch to Shadow anytime'
          : 'SHADOW MODE / SIMULATED DATA · LIA_LIVE_TRADING=0 · Beta toggle locked'}
      </p>
    </section>
  )
}
