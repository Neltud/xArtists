/** Wealth view — equity & profit, no points/ticks language. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { asText } from '../../lib/safeRender'

type PackRow = {
  pack_id?: string
  name?: string
  equity_usd?: number
  realized_trading_usd?: number
  rwa_appreciation_usd?: number
  net_profit_usd?: number
  strategy_bias?: string
  disclaimer?: string
}

export default function PortfolioWealth() {
  const [packs, setPacks] = useState<PackRow[]>([])
  const [source, setSource] = useState('')

  useEffect(() => {
    let c = false
    ;(async () => {
      const bases = [
        `${import.meta.env.BASE_URL || '/'}data/`,
        'https://neltud.github.io/xArtists/data/',
      ]
      for (const b of bases) {
        try {
          const r = await fetch(`${b}pack_performance.json`, { cache: 'no-store' })
          if (!r.ok) continue
          const j = await r.json()
          if (c) return
          setPacks(Array.isArray(j.packs) ? j.packs : [])
          setSource(String(j.note || ''))
          return
        } catch {
          /* */
        }
      }
    })()
    return () => {
      c = true
    }
  }, [])

  const totalEq = packs.reduce((s, p) => s + Number(p.equity_usd || 0), 0)
  const totalProfit = packs.reduce((s, p) => s + Number(p.net_profit_usd || 0), 0)

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
      <header className="flex flex-wrap justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Portfolio</p>
          <h2 className="text-xl font-semibold text-white">Managed performance</h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-zinc-500 uppercase">Total equity</p>
          <p className="text-lg tabular-nums text-white">${asText(totalEq.toFixed(2))}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-black/30 border border-white/5 p-3">
          <p className="text-[10px] text-zinc-500 uppercase">Net performance</p>
          <p
            className={`text-lg font-semibold tabular-nums ${
              totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {totalProfit >= 0 ? '+' : ''}${asText(totalProfit.toFixed(2))}
          </p>
        </div>
        <div className="rounded-xl bg-black/30 border border-white/5 p-3">
          <p className="text-[10px] text-zinc-500 uppercase">Agent packs</p>
          <p className="text-lg font-semibold text-white">{asText(packs.length)}</p>
        </div>
      </div>

      <ul className="space-y-2">
        {packs.map(p => (
          <li
            key={asText(p.pack_id)}
            className="rounded-xl border border-white/5 bg-black/25 p-3 text-[12px] space-y-1"
          >
            <div className="flex justify-between">
              <span className="font-medium text-white">{asText(p.name || p.pack_id)}</span>
              <span className="tabular-nums text-zinc-300">${asText(p.equity_usd)}</span>
            </div>
            <p className="text-zinc-500">
              Trading {asText(p.realized_trading_usd)} · RWA {asText(p.rwa_appreciation_usd)} · Net{' '}
              <span className={Number(p.net_profit_usd) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {asText(p.net_profit_usd)}
              </span>
            </p>
            <p className="text-[10px] text-zinc-600">Agent: {asText(p.strategy_bias)}</p>
          </li>
        ))}
      </ul>

      <p className="text-[10px] text-zinc-600">{asText(source)}</p>
      <Link to="/rwa" className="text-[11px] text-cyan-400 underline">
        RWA valuations →
      </Link>
    </section>
  )
}
