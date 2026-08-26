import { useEffect, useState } from 'react'

const RAW = 'https://raw.githubusercontent.com/Neltud/xArtists/main'

type Row = {
  id?: string
  return_1y_pct?: number
  lost_money?: boolean
  stress?: number
}

type Payload = {
  updated?: string
  disclaimer?: string
  echelons?: Row[]
  aggregate?: {
    portfolio_return_1y_pct?: number
    losing_columns?: string[]
    n_losing?: number
    note?: string
  }
}

export default function AnnualYieldPanel() {
  const [data, setData] = useState<Payload | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      for (const url of [
        `${import.meta.env.BASE_URL}data/compounding_annual_sim.json?t=${Date.now()}`,
        `${RAW}/data/compounding_annual_sim.json?t=${Date.now()}`,
      ]) {
        try {
          const r = await fetch(url, { cache: 'no-store' })
          if (!r.ok) continue
          const j = (await r.json()) as Payload
          if (!cancelled) setData(j)
          return
        } catch {
          /* next */
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!data?.echelons?.length) return null

  const agg = data.aggregate

  return (
    <div className="card mb-8">
      <div className="flex flex-wrap justify-between gap-2 mb-3">
        <div>
          <h2 className="text-lg font-bold">Sim rendement 1 an (paper)</h2>
          <p className="text-xs text-gray-500 mt-1">
            Inclut des colonnes perdantes — pas une promesse de performance
          </p>
        </div>
        <span className="text-sm mono font-bold text-teal-300">
          Portfolio {agg?.portfolio_return_1y_pct != null ? `${agg.portfolio_return_1y_pct}%` : '—'}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="text-[10px] uppercase text-gray-500 border-b border-[#2a2a3a]">
              <th className="text-left py-2">Col</th>
              <th className="text-right py-2">Return 1y</th>
              <th className="text-right py-2">Stress</th>
              <th className="text-left py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.echelons.map((e) => (
              <tr key={e.id} className="border-b border-[#2a2a3a]/40">
                <td className="py-1.5 font-semibold">{e.id}</td>
                <td
                  className={`py-1.5 text-right mono ${
                    (e.return_1y_pct ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {e.return_1y_pct != null ? `${e.return_1y_pct}%` : '—'}
                </td>
                <td className="py-1.5 text-right mono text-gray-500">{e.stress ?? '—'}</td>
                <td className="py-1.5 text-xs">
                  {e.lost_money ? (
                    <span className="text-red-400">loss column</span>
                  ) : (
                    <span className="text-green-400/80">ok</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-gray-600 mt-2">
        {data.disclaimer || agg?.note || 'Simulation only.'}
        {agg?.losing_columns?.length
          ? ` · Losers: ${agg.losing_columns.join(', ')}`
          : ''}
      </p>
    </div>
  )
}
