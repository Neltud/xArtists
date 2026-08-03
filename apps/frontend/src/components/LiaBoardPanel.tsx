import { useEffect, useState } from 'react'

/** Multiple sources — Pages public/data first, then GitHub raw, cache-bust */
const BOARD_CANDIDATES = [
  `${import.meta.env.BASE_URL}data/lia_board.json`,
  'data/lia_board.json',
  'https://raw.githubusercontent.com/Neltud/xArtists/main/data/lia_board.json',
  'https://neltud.github.io/xArtists/data/lia_board.json',
]

type SeriesRow = {
  id: string
  name: string
  strategy: string
  start_usd: number
  end_usd: number
  multiple: number
  win_rate: number
  trades: number
}

type Board = {
  risk?: {
    max_trades_per_day?: number
    max_trades_per_hour?: number
    hf_mode?: string
    note?: string
  }
  arb?: {
    actionable?: boolean
    best?: { buy_venue: string; sell_venue: string; edge: number }
    note?: string
    block?: { nonce?: number }
  }
  series?: { series?: SeriesRow[]; start_each_usd?: number; horizon_days?: number }
  positions?: { total_usd_approx?: number }
  updated?: string
}

async function loadBoard(): Promise<Board> {
  const t = Date.now()
  let lastErr = '404'
  for (const base of BOARD_CANDIDATES) {
    try {
      const url = base.includes('?') ? base : `${base}?t=${t}`
      const r = await fetch(url, { cache: 'no-store' })
      if (!r.ok) {
        lastErr = String(r.status)
        continue
      }
      return (await r.json()) as Board
    } catch (e) {
      lastErr = e instanceof Error ? e.message : 'fail'
    }
  }
  throw new Error(lastErr)
}

export default function LiaBoardPanel() {
  const [board, setBoard] = useState<Board | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    loadBoard()
      .then(setBoard)
      .catch(e => setErr(e instanceof Error ? e.message : 'load failed'))
  }, [])

  if (err) {
    return (
      <div className="card mb-6 text-sm text-amber-400">
        Board LIA: données absentes ({err}). Après rebuild Pages les seeds{' '}
        <code>public/data/lia_board.json</code> doivent servir. Vellum:{' '}
        <code>python -m lia.board.publish</code>
      </div>
    )
  }
  if (!board) {
    return <div className="card mb-6 h-24 animate-pulse bg-[#16161f]" />
  }

  const series = board.series?.series || []
  const best = board.arb?.best

  return (
    <div className="space-y-4 mb-8">
      <div className="card border-teal-500/20">
        <h2 className="text-lg font-bold mb-2">📡 LIA Board — placements & limites</h2>
        <p className="text-xs text-gray-500 mb-3">{board.risk?.note}</p>
        {board.updated && (
          <p className="text-[10px] text-gray-600 mb-2">updated {board.updated}</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500">Mode</p>
            <p className="font-semibold text-teal-300">{board.risk?.hf_mode || 'block_scan'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Max trades/jour</p>
            <p className="font-semibold">{board.risk?.max_trades_per_day ?? 48}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Max / heure</p>
            <p className="font-semibold">{board.risk?.max_trades_per_hour ?? 6}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Wallet ≈</p>
            <p className="font-semibold">${(board.positions?.total_usd_approx ?? 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold mb-2">⚡ Arb block-time</h3>
        <p className="text-xs text-gray-500 mb-2">{board.arb?.note}</p>
        {best ? (
          <p className="text-sm">
            Best edge <span className="text-green-400 font-bold">{(best.edge * 100).toFixed(3)}%</span> buy{' '}
            <span className="text-purple-300">{best.buy_venue}</span> → sell{' '}
            <span className="text-purple-300">{best.sell_venue}</span>
            {board.arb?.actionable ? (
              <span className="badge-green ml-2">actionable</span>
            ) : (
              <span className="badge-gray ml-2">watch</span>
            )}
          </p>
        ) : (
          <p className="text-sm text-gray-500">Pas d&apos;edge (seed ou mids alignés) — publish pour live</p>
        )}
      </div>

      <div className="card">
        <h3 className="font-bold mb-2">
          📊 Séries paper (${board.series?.start_each_usd ?? 10} · {board.series?.horizon_days ?? 30}j)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-[#2a2a3a]">
                <th className="text-left py-2">Série</th>
                <th className="text-right py-2">WR</th>
                <th className="text-right py-2">Trades</th>
                <th className="text-right py-2">Fin</th>
                <th className="text-right py-2">×</th>
              </tr>
            </thead>
            <tbody>
              {series.map(s => (
                <tr key={s.id} className="border-b border-[#2a2a3a]/40">
                  <td className="py-2 font-medium text-teal-200">{s.name}</td>
                  <td className="py-2 text-right">{(s.win_rate * 100).toFixed(0)}%</td>
                  <td className="py-2 text-right mono text-xs">{s.trades}</td>
                  <td className="py-2 text-right font-bold text-purple-300">${s.end_usd.toFixed(2)}</td>
                  <td className="py-2 text-right">×{s.multiple.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
