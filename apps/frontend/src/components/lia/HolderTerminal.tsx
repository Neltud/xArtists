/**
 * P2 — Holder terminal: portfolio summary + shadow analytics + system health.
 * Institutional density, no developer jargon. All performance = SHADOW.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { asText } from '../../lib/safeRender'

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
  equity_curve?: { equity?: number }[]
}

function maxDrawdown(curve: { equity?: number }[]): number | null {
  if (!curve.length) return null
  let peak = Number(curve[0].equity) || 0
  let maxDd = 0
  for (const p of curve) {
    const e = Number(p.equity) || 0
    if (e > peak) peak = e
    if (peak > 0) {
      const dd = (peak - e) / peak
      if (dd > maxDd) maxDd = dd
    }
  }
  return maxDd
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
  const [health, setHealth] = useState<string>('…')

  useEffect(() => {
    let c = false
    const load = async () => {
      const [s, e] = await Promise.all([
        loadJson('lia_shadow_sprint.json'),
        loadJson('lia_shadow_export.json'),
      ])
      if (c) return
      setSprint((s as Sprint) || null)
      setExp((e as ExportSnap) || null)
      setHealth(s ? 'Shadow loop data OK' : 'Waiting for sprint export')
    }
    void load()
    const id = window.setInterval(() => void load(), 20_000)
    return () => {
      c = true
      window.clearInterval(id)
    }
  }, [])

  const start = sprint?.equity_start_usd ?? 1000
  const now = sprint?.equity_now_usd ?? exp?.equity_now_usd ?? start
  const pnl = sprint?.shadow_pnl_usd ?? exp?.shadow_pnl_usd
  const wr = sprint?.win_rate ?? exp?.win_rate
  const curve = exp?.equity_curve || []
  const dd = maxDrawdown(curve)
  // naive sharpe proxy: pnl / (dd+eps) — illustrative only
  const sharpeProxy =
    dd != null && dd > 0.0001 && typeof pnl === 'number' ? pnl / (dd * start) : null

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-semibold">
            Holder terminal
          </p>
          <h2 className="text-xl font-semibold text-white tracking-tight">Overview</h2>
          <p className="text-[12px] text-zinc-500">SHADOW / SIMULATED performance — not live capital</p>
        </div>
        <span className="text-[10px] mono px-2 py-1 rounded-full border border-amber-500/30 text-amber-200/90">
          LIA_LIVE_TRADING=0
        </span>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card !p-3">
          <p className="text-[10px] text-zinc-500 uppercase">Equity</p>
          <p className="text-lg font-semibold tabular-nums text-white">{asText(now)} USD</p>
        </div>
        <div className="card !p-3">
          <p className="text-[10px] text-zinc-500 uppercase">Shadow PnL</p>
          <p
            className={`text-lg font-semibold tabular-nums ${
              typeof pnl === 'number' && pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'
            }`}
          >
            {pnl != null ? `${pnl >= 0 ? '+' : ''}${asText(pnl)}` : '—'}
          </p>
        </div>
        <div className="card !p-3">
          <p className="text-[10px] text-zinc-500 uppercase">Win rate</p>
          <p className="text-lg font-semibold tabular-nums">
            {wr != null ? `${asText(Math.round(Number(wr) * 100))}%` : '—'}
          </p>
        </div>
        <div className="card !p-3">
          <p className="text-[10px] text-zinc-500 uppercase">Max DD</p>
          <p className="text-lg font-semibold tabular-nums">
            {dd != null ? `${asText((dd * 100).toFixed(2))}%` : '—'}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 text-[12px]">
        <div className="card !p-3 space-y-1">
          <p className="text-[10px] uppercase text-zinc-500">Sprint</p>
          <p className="font-medium text-zinc-200">
            Day {asText(sprint?.day_index ?? '—')}/{asText(sprint?.sprint_days_target ?? 7)}
          </p>
          <p className="text-zinc-500">{asText(sprint?.status, '—')} · fills {asText(sprint?.fills_total)}</p>
        </div>
        <div className="card !p-3 space-y-1">
          <p className="text-[10px] uppercase text-zinc-500">Analytics</p>
          <p className="text-zinc-300">
            Sharpe proxy {sharpeProxy != null ? asText(sharpeProxy.toFixed(2)) : '—'}
          </p>
          <p className="text-[10px] text-zinc-600">Illustrative only · not a fund metric</p>
        </div>
        <div className="card !p-3 space-y-1">
          <p className="text-[10px] uppercase text-zinc-500">System</p>
          <p className="text-zinc-300">{asText(health)}</p>
          <p className="text-zinc-500">Cron: shadow-sprint.yml · paper</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/lia" className="btn-primary text-sm">
          Intelligence hub
        </Link>
        <Link to="/portfolio" className="btn-secondary text-sm">
          Portfolio
        </Link>
        <Link to="/go-live" className="btn-secondary text-sm">
          Status
        </Link>
      </div>
    </section>
  )
}
