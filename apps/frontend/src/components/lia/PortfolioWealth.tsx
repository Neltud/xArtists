/** Wealth view — equity, RWA backing, performance — no points language. */
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
  rwa_detail?: Record<string, number>
  disclaimer?: string
}

type RwaItem = {
  id?: string
  title?: string
  artist?: string
  shipment_status?: string
  status?: string
  valuation?: { score?: number; price_proxy_usd?: number }
}

type TxEv = { ts?: string; event?: string; label?: string; tx_hash?: string; strategy?: string }

export default function PortfolioWealth() {
  const [packs, setPacks] = useState<PackRow[]>([])
  const [rwa, setRwa] = useState<RwaItem[]>([])
  const [feed, setFeed] = useState<TxEv[]>([])
  const [recon, setRecon] = useState<{ ok?: boolean; ghost?: boolean } | null>(null)
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
          const [p, cat, tel, aud] = await Promise.all([
            fetch(`${b}pack_performance.json`, { cache: 'no-store' }),
            fetch(`${b}rwa_catalog.json`, { cache: 'no-store' }),
            fetch(`${b}execution_telemetry.json`, { cache: 'no-store' }),
            fetch(`${b}reconciliation_audit.json`, { cache: 'no-store' }),
          ])
          if (c) return
          if (p.ok) {
            const j = await p.json()
            setPacks(Array.isArray(j.packs) ? j.packs : [])
            setSource(String(j.note || ''))
          }
          if (cat.ok) {
            const j = await cat.json()
            setRwa(Array.isArray(j.items) ? j.items : [])
          }
          if (tel.ok) {
            const j = await tel.json()
            setFeed(Array.isArray(j.events) ? j.events.slice(-12).reverse() : [])
          }
          if (aud.ok) setRecon(await aud.json())
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
          {recon && (
            <p className={`text-[9px] ${recon.ok ? 'text-emerald-500' : 'text-rose-400'}`}>
              {recon.ok ? 'Integrity OK' : 'Integrity alert'}
              {recon.ghost ? ' · ghost risk' : ''}
            </p>
          )}
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

      <div>
        <p className="text-[10px] uppercase text-zinc-500 mb-2">Packs</p>
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
      </div>

      <div>
        <p className="text-[10px] uppercase text-zinc-500 mb-2">Asset breakdown (RWA)</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {rwa.slice(0, 6).map(it => (
            <div key={asText(it.id)} className="rounded-lg border border-white/5 bg-black/20 p-2 text-[11px]">
              <p className="text-white font-medium">{asText(it.title)}</p>
              <p className="text-zinc-500">{asText(it.artist)}</p>
              <p className="tabular-nums text-cyan-300">
                ${asText(it.valuation?.price_proxy_usd)} · score {asText(it.valuation?.score)}
              </p>
              <p className="text-[10px] text-zinc-600">
                {asText(it.shipment_status || it.status || 'in_vault')}
              </p>
            </div>
          ))}
          {!rwa.length && <p className="text-zinc-600 text-[11px]">No RWA catalog loaded</p>}
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase text-zinc-500 mb-2">Transaction feed</p>
        <ul className="max-h-28 overflow-y-auto text-[10px] mono space-y-1">
          {feed.map((e, i) => (
            <li key={i} className="text-zinc-500">
              {asText(e.ts)} · {asText(e.event)} · {asText(e.label || e.strategy)}
              {e.tx_hash && (
                <a
                  className="text-cyan-400 underline ml-1"
                  href={`https://explorer.multiversx.com/transactions/${e.tx_hash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {e.tx_hash.slice(0, 10)}…
                </a>
              )}
            </li>
          ))}
          {!feed.length && <li className="text-zinc-600">No execution events</li>}
        </ul>
      </div>

      <p className="text-[10px] text-zinc-600">{asText(source)}</p>
      <div className="flex flex-wrap gap-2">
        <Link to="/rwa" className="text-[11px] text-cyan-400 underline">
          RWA catalog →
        </Link>
        <Link to="/history" className="text-[11px] text-cyan-400 underline">
          History →
        </Link>
      </div>
    </section>
  )
}
