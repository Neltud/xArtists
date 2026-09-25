/**
 * Desk paper mark-to-market — prix live Binance/MVX, positions simulées.
 * Aucune exécution on-chain.
 */
import { useMemo, useState } from 'react'
import { useRealTimePrices } from '../hooks/useRealTimePrices'
import type { LiveQuote } from '../services/priceService'

const PAPER_CASH0 = 10_000 // USDC paper

type Leg = {
  id: string
  base: 'EGLD' | 'BTC' | 'ETH'
  side: 'long'
  /** Quantité base */
  qty: number
  /** Prix d’entrée USD au moment de l’ouverture (fixé au 1er tick) */
  entryUsd: number | null
}

const SEED_LEGS: Omit<Leg, 'entryUsd'>[] = [
  { id: 'egld-core', base: 'EGLD', side: 'long', qty: 80 },
  { id: 'btc-sat', base: 'BTC', side: 'long', qty: 0.05 },
  { id: 'eth-sat', base: 'ETH', side: 'long', qty: 1.2 },
]

function fmtUsd(n: number, d = 2): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: d,
  })
}

function fmtPx(q: LiveQuote | undefined): string {
  if (!q || !q.price) return '—'
  const d = q.price >= 1000 ? 2 : q.price >= 1 ? 4 : 6
  return q.price.toLocaleString('en-US', { maximumFractionDigits: d })
}

function chClass(pct: number | null | undefined): string {
  if (pct == null || !Number.isFinite(pct)) return 'text-zinc-500'
  if (pct > 0.05) return 'text-emerald-400'
  if (pct < -0.05) return 'text-rose-400'
  return 'text-zinc-400'
}

function flashBorder(dir?: 'up' | 'down' | 'flat'): string {
  if (dir === 'up') return 'border-emerald-500/40'
  if (dir === 'down') return 'border-rose-500/40'
  return 'border-white/10'
}

export default function PaperLiveDesk() {
  const { snapshot, loading, error, lastUpdate, flash, refresh } = useRealTimePrices(8_000)
  const [entries, setEntries] = useState<Record<string, number>>({})

  // Fixe les prix d’entrée paper au premier tick valide
  useMemo(() => {
    if (!snapshot) return
    setEntries(prev => {
      const next = { ...prev }
      let changed = false
      for (const leg of SEED_LEGS) {
        if (next[leg.id] != null) continue
        const px =
          leg.base === 'EGLD'
            ? snapshot.egld.price
            : leg.base === 'BTC'
              ? snapshot.btc.price
              : snapshot.eth.price
        if (px > 0) {
          next[leg.id] = px
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [snapshot])

  const rows = useMemo(() => {
    if (!snapshot) return []
    return SEED_LEGS.map(leg => {
      const mark =
        leg.base === 'EGLD'
          ? snapshot.egld.price
          : leg.base === 'BTC'
            ? snapshot.btc.price
            : snapshot.eth.price
      const entry = entries[leg.id] ?? mark
      const mv = leg.qty * mark
      const cost = leg.qty * entry
      const upnl = mv - cost
      const upnlPct = cost > 0 ? (upnl / cost) * 100 : 0
      return { ...leg, mark, entry, mv, upnl, upnlPct }
    })
  }, [snapshot, entries])

  const positionsMv = rows.reduce((s, r) => s + r.mv, 0)
  const positionsUpnl = rows.reduce((s, r) => s + r.upnl, 0)
  const equity = PAPER_CASH0 + positionsUpnl

  const quotes: { key: string; q: LiveQuote | undefined }[] = snapshot
    ? [
        { key: 'EGLD', q: snapshot.egld },
        { key: 'BTC', q: snapshot.btc },
        { key: 'ETH', q: snapshot.eth },
        { key: 'USDC', q: snapshot.usdc },
        { key: 'USDT', q: snapshot.usdt },
        { key: 'TRO', q: snapshot.tro },
      ]
    : []

  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-zinc-950 to-black p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
            Live market · paper MTM
          </p>
          <p className="text-[12px] text-zinc-500 mt-1">
            Prix réels (Binance / MultiversX) · book simulé · pas d’ordre on-chain
          </p>
        </div>
        <div className="text-right text-[11px] text-zinc-500 space-y-0.5">
          <p>
            {loading && !snapshot
              ? 'Chargement…'
              : lastUpdate
                ? `MAJ ${lastUpdate.toLocaleTimeString()}`
                : '—'}
          </p>
          <button
            type="button"
            onClick={() => refresh()}
            className="text-cyan-300/90 hover:text-cyan-200 underline-offset-2 hover:underline"
          >
            Rafraîchir
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-rose-300/90 rounded-lg border border-rose-500/20 px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {quotes.map(({ key, q }) => (
          <div
            key={key}
            className={`rounded-xl border bg-black/50 px-2.5 py-2 transition-colors ${flashBorder(
              flash[key],
            )}`}
          >
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">{key}</p>
            <p className="text-sm font-semibold text-white tabular-nums mt-0.5">${fmtPx(q)}</p>
            <p className={`text-[10px] tabular-nums ${chClass(q?.change24hPct)}`}>
              {q?.change24hPct != null && Number.isFinite(q.change24hPct)
                ? `${q.change24hPct >= 0 ? '+' : ''}${q.change24hPct.toFixed(2)}% 24h`
                : '—'}
            </p>
            <p className="text-[9px] text-zinc-600 mt-0.5">{q?.source || '—'}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-2 text-[12px]">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <p className="text-[10px] uppercase text-zinc-500">Equity paper</p>
          <p className="text-lg font-semibold text-white tabular-nums">{fmtUsd(equity)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <p className="text-[10px] uppercase text-zinc-500">Positions MV</p>
          <p className="text-lg font-semibold text-white tabular-nums">{fmtUsd(positionsMv)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <p className="text-[10px] uppercase text-zinc-500">uPnL</p>
          <p
            className={`text-lg font-semibold tabular-nums ${
              positionsUpnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {positionsUpnl >= 0 ? '+' : ''}
            {fmtUsd(positionsUpnl)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-[12px]">
          <thead className="bg-white/[0.04] text-[10px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">Leg</th>
              <th className="px-3 py-2 font-medium">Qty</th>
              <th className="px-3 py-2 font-medium">Entry</th>
              <th className="px-3 py-2 font-medium">Mark</th>
              <th className="px-3 py-2 font-medium">MV</th>
              <th className="px-3 py-2 font-medium">uPnL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map(r => (
              <tr key={r.id} className="text-zinc-300">
                <td className="px-3 py-2 font-medium text-white">
                  {r.side.toUpperCase()} {r.base}
                </td>
                <td className="px-3 py-2 tabular-nums">{r.qty}</td>
                <td className="px-3 py-2 tabular-nums">{fmtUsd(r.entry, r.base === 'BTC' ? 0 : 2)}</td>
                <td className="px-3 py-2 tabular-nums text-cyan-100/90">
                  {fmtUsd(r.mark, r.base === 'BTC' ? 0 : 2)}
                </td>
                <td className="px-3 py-2 tabular-nums">{fmtUsd(r.mv)}</td>
                <td
                  className={`px-3 py-2 tabular-nums font-medium ${
                    r.upnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {r.upnl >= 0 ? '+' : ''}
                  {fmtUsd(r.upnl)}{' '}
                  <span className="text-[10px] opacity-80">
                    ({r.upnlPct >= 0 ? '+' : ''}
                    {r.upnlPct.toFixed(2)}%)
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-zinc-600 leading-relaxed">
        Entrées paper figées au premier tick live de la session. Cash notionnel {fmtUsd(PAPER_CASH0)}{' '}
        USDC. Refresh ~8 s. Simulation uniquement.
      </p>
    </section>
  )
}
