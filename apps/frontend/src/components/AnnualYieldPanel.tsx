import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
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
          <h2 className="text-lg font-bold">{xaRender("Sim rendement 1 an (paper)")}</h2>
          <p className="text-xs text-gray-500 mt-1">
            {xaRender("Inclut des colonnes perdantes — pas une promesse de performance ")}</p>
        </div>
        <span className="text-sm mono font-bold text-teal-300">
          {xaRender("Portfolio ")}{xaRender(agg?.portfolio_return_1y_pct != null ? `${agg.portfolio_return_1y_pct}%` : '—')}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="text-[10px] uppercase text-gray-500 border-b border-[#2a2a3a]">
              <th className="text-left py-2">{xaRender("Col")}</th>
              <th className="text-right py-2">{xaRender("Return 1y")}</th>
              <th className="text-right py-2">{xaRender("Stress")}</th>
              <th className="text-left py-2">{xaRender("Status")}</th>
            </tr>
          </thead>
          <tbody>
            {xaRender(data.echelons.map((e) => (
              <tr key={e.id} className="border-b border-[#2a2a3a]/40">
                <td className="py-1.5 font-semibold">{xaRender(e.id)}</td>
                <td
                  className={`py-1.5 text-right mono ${
                    (e.return_1y_pct ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {xaRender(e.return_1y_pct != null ? `${e.return_1y_pct}%` : '—')}
                </td>
                <td className="py-1.5 text-right mono text-gray-500">{xaRender(e.stress ?? '—')}</td>
                <td className="py-1.5 text-xs">
                  {xaRender(e.lost_money ? (
                    <span className="text-red-400">{xaRender("loss column")}</span>
                  ) : (
                    <span className="text-green-400/80">ok</span>
                  ))}
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-gray-600 mt-2">
        {xaRender(data.disclaimer || agg?.note || 'Simulation only.')}
        {xaRender(agg?.losing_columns?.length
          ? ` · Losers: ${agg.losing_columns.join(', ')}`
          : '')}
      </p>
    </div>
  )
}
