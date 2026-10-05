/** Audit trail — proposals + live TX + performance delta. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { asText } from '../lib/safeRender'

type Row = {
  ts?: string
  strategy?: string
  intent?: string
  status?: string
  hash?: string
  slip?: string
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

export default function HistoryPage() {
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    let c = false
    ;(async () => {
      const [props, live, delta] = await Promise.all([
        loadJson('strike_proposals.json'),
        loadJson('lia_live_status.json'),
        loadJson('performance_delta.json'),
      ])
      if (c) return
      const out: Row[] = []
      const proposals = (props as { proposals?: Record<string, unknown>[] } | null)?.proposals || []
      for (const p of proposals) {
        out.push({
          ts: String(p.created || p.executed_at || '—'),
          strategy: String(p.action || 'strike'),
          intent: `${p.size_egld ?? '—'} EGLD ${p.pair || ''}`,
          status: String(p.status || '—'),
          hash: p.tx_hash ? String(p.tx_hash) : undefined,
          slip: undefined,
        })
      }
      const txs =
        ((live as { deployer?: { txs?: Record<string, unknown>[] } } | null)?.deployer?.txs) || []
      for (const t of txs) {
        out.push({
          ts: t.timestamp ? String(t.timestamp) : '—',
          strategy: String(t.function || 'tx'),
          intent: 'on-chain',
          status: String(t.status || '—'),
          hash: t.txHash ? String(t.txHash) : undefined,
        })
      }
      const strat = (delta as { strategies?: Record<string, { avg_slippage?: number }> } | null)
        ?.strategies
      if (strat) {
        for (const [k, v] of Object.entries(strat)) {
          out.push({
            ts: 'delta',
            strategy: k,
            intent: 'performance',
            status: 'measured',
            slip: v.avg_slippage != null ? `${(v.avg_slippage * 100).toFixed(2)}%` : '—',
          })
        }
      }
      setRows(out)
    })()
    return () => {
      c = true
    }
  }, [])

  return (
    <div className="animate-fade-in space-y-4 max-w-3xl mx-auto pb-16">
      <header>
        <p className="section-label">Audit</p>
        <h1 className="section-title display text-2xl">History</h1>
        <p className="text-sm text-zinc-400">Strike proposals · on-chain TX · slippage delta</p>
      </header>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-white/5 text-zinc-500 uppercase tracking-wider">
            <tr>
              <th className="p-2">Time</th>
              <th className="p-2">Strategy</th>
              <th className="p-2">Intent</th>
              <th className="p-2">Status</th>
              <th className="p-2">Hash / Slip</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="p-2 text-zinc-500 mono">{asText(r.ts)}</td>
                <td className="p-2">{asText(r.strategy)}</td>
                <td className="p-2">{asText(r.intent)}</td>
                <td className="p-2">{asText(r.status)}</td>
                <td className="p-2 mono">
                  {r.hash ? (
                    <a
                      className="text-cyan-400 underline"
                      href={`https://explorer.multiversx.com/transactions/${r.hash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {r.hash.slice(0, 10)}…
                    </a>
                  ) : (
                    asText(r.slip || '—')
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={5} className="p-4 text-zinc-600 text-center">
                  No history yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Link to="/lia" className="btn-secondary text-sm">
        ← LIA hub
      </Link>
    </div>
  )
}
