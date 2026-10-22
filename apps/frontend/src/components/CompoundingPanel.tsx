import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
import { useEffect, useMemo, useState } from 'react'

const RAW = 'https://raw.githubusercontent.com/Neltud/xArtists/main'

type Point = { t: number; equity: number }
type Echelon = {
  id: string
  label: string
  equity_usd: number
  peak_usd: number
  trades: number
  wins: number
  losses: number
  net_pnl_usd: number
  status: string
  last_strategy?: string | null
  curve: Point[]
}
type Payload = {
  updated?: string
  live_trading?: boolean
  note?: string
  echelons: Echelon[]
  aggregate?: {
    equity_usd: number
    net_pnl_usd: number
    trades: number
    win_rate: number | null
    variance_pnl: number | null
  }
}

function spark(curve: Point[], w = 120, h = 36) {
  if (!curve?.length) return null
  const ys = curve.map((c) => c.equity)
  const xs = curve.map((c) => c.t)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const span = maxY - minY || 1
  const maxX = Math.max(...xs) || 1
  const pts = curve
    .map((c) => {
      const x = (c.t / maxX) * (w - 4) + 2
      const y = h - 2 - ((c.equity - minY) / span) * (h - 4)
      return `${x},${y}`
    })
    .join(' ')
  const up = ys[ys.length - 1] >= ys[0]
  return (
    <svg width={w} height={h} className="opacity-90">
      <polyline fill="none" stroke={up ? '#4ade80' : '#f87171'} strokeWidth="1.5" points={pts} />
    </svg>
  )
}

export default function CompoundingPanel() {
  const [data, setData] = useState<Payload | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const candidates = [
        `${import.meta.env.BASE_URL}data/compounding_echelons.json?t=${Date.now()}`,
        `${RAW}/data/compounding_echelons.json?t=${Date.now()}`,
      ]
      for (const url of candidates) {
        try {
          const r = await fetch(url, { cache: 'no-store' })
          if (!r.ok) continue
          const j = (await r.json()) as Payload
          if (!cancelled) {
            setData(j)
            setErr(null)
          }
          return
        } catch {
          /* next */
        }
      }
      if (!cancelled) setErr('compounding offline')
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const cols = data?.echelons ?? []
  const agg = data?.aggregate
  const varianceHint = useMemo(() => {
    if (agg?.variance_pnl == null) return '—'
    return agg.variance_pnl.toFixed(4)
  }, [agg])

  return (
    <div className="card mb-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold">{xaRender("Compounding — 10 colonnes (paper)")}</h2>
          <p className="text-xs text-gray-500 mt-1">
            {xaRender("Portefeuilles paper indépendants · S05 / S1 / S2 · fees + gas · sink USDC ")}</p>
        </div>
        <span className="badge-gray text-[10px]">
          {xaRender(data?.live_trading ? 'LIVE FLAG' : 'PAPER')} · {xaRender(data?.updated?.slice(0, 19) || '—')}
        </span>
      </div>
      {xaRender(err && (
        <p className="text-xs text-amber-400 mb-3">
          {xaRender("JSON absent (")}{xaRender(err)}{xaRender("). Lancer ")}<code className="text-[10px]">python -m lia.compounding</code> {xaRender(" puis push. ")}</p>
      ))}
      {xaRender(agg && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
          <div className="rounded-lg bg-[#111118] p-3">
            <p className="text-[10px] text-gray-500 uppercase">{xaRender("Equity agg")}</p>
            <p className="mono font-bold">${xaRender(agg.equity_usd.toFixed(2))}</p>
          </div>
          <div className="rounded-lg bg-[#111118] p-3">
            <p className="text-[10px] text-gray-500 uppercase">{xaRender("Net PnL")}</p>
            <p className={`mono font-bold ${agg.net_pnl_usd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {xaRender(agg.net_pnl_usd.toFixed(2))}
            </p>
          </div>
          <div className="rounded-lg bg-[#111118] p-3">
            <p className="text-[10px] text-gray-500 uppercase">{xaRender("Win rate")}</p>
            <p className="mono font-bold">
              {xaRender(agg.win_rate != null ? `${(agg.win_rate * 100).toFixed(1)}%` : '—')}
            </p>
          </div>
          <div className="rounded-lg bg-[#111118] p-3">
            <p className="text-[10px] text-gray-500 uppercase">{xaRender("Variance PnL")}</p>
            <p className="mono font-bold">{xaRender(varianceHint)}</p>
          </div>
        </div>
      ))}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-[10px] text-gray-500 uppercase border-b border-[#2a2a3a]">
              <th className="text-left py-2">{xaRender("Col")}</th>
              <th className="text-right py-2">{xaRender("Equity")}</th>
              <th className="text-right py-2">{xaRender("PnL")}</th>
              <th className="text-right py-2">W/L</th>
              <th className="text-left py-2">{xaRender("Last")}</th>
              <th className="text-left py-2">{xaRender("Curve")}</th>
            </tr>
          </thead>
          <tbody>
            {xaRender(cols.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-gray-500 text-center">
                  {xaRender("Aucun échelon publié ")}</td>
              </tr>
            ) : (
              cols.map((e) => (
                <tr key={e.id} className="border-b border-[#2a2a3a]/40">
                  <td className="py-2 font-semibold">{xaRender(e.id)}</td>
                  <td className="py-2 text-right mono">${xaRender(e.equity_usd.toFixed(2))}</td>
                  <td
                    className={`py-2 text-right mono ${
                      e.net_pnl_usd >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {xaRender(e.net_pnl_usd.toFixed(2))}
                  </td>
                  <td className="py-2 text-right mono text-gray-400">
                    {xaRender(e.wins)}/{xaRender(e.losses)}
                  </td>
                  <td className="py-2 text-xs text-gray-400">{xaRender(e.last_strategy || '—')}</td>
                  <td className="py-2">{xaRender(spark(e.curve))}</td>
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-gray-600 mt-3">
        {xaRender(data?.note || 'Paper only — pertes sur une colonne n’annulent pas les autres.')}
      </p>
    </div>
  )
}
