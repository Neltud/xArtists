/**
 * UI monitoring transactionnel — statut API MultiversX réel.
 */
import { useEffect, useState } from 'react'
import {
  transactionMonitor,
  type MonitoredTx,
  type TxNetwork,
} from '../services/transactionMonitor'

const STATUS_STYLE: Record<string, string> = {
  pending: 'text-amber-300 border-amber-500/40',
  success: 'text-emerald-300 border-emerald-500/40',
  fail: 'text-rose-300 border-rose-500/40',
  unknown: 'text-zinc-400 border-zinc-600',
  not_found: 'text-zinc-500 border-zinc-700',
}

export default function TxMonitorPanel({ compact = false }: { compact?: boolean }) {
  const [active, setActive] = useState<MonitoredTx[]>([])
  const [history, setHistory] = useState<MonitoredTx[]>([])
  const [manualHash, setManualHash] = useState('')
  const [network, setNetwork] = useState<TxNetwork>('mainnet')

  useEffect(() => {
    const unsub = transactionMonitor.subscribe(() => {
      setActive(transactionMonitor.getActive())
      setHistory(transactionMonitor.getHistory())
    })
    setActive(transactionMonitor.getActive())
    setHistory(transactionMonitor.getHistory())
    return unsub
  }, [])

  const startWatch = () => {
    const h = manualHash.trim()
    if (h.length < 16) return
    transactionMonitor.watch(h, { network })
    setManualHash('')
  }

  const rows = [...active, ...history.slice(0, compact ? 3 : 8)]

  return (
    <div className="rounded-2xl border border-cyan-500/25 bg-[#0c0c14] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-cyan-400/80">TX Monitor</p>
          <h3 className="text-sm font-bold text-white">Suivi on-chain MultiversX</h3>
        </div>
        <span className="text-[10px] text-zinc-500">{active.length} active</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={manualHash}
          onChange={e => setManualHash(e.target.value)}
          placeholder="tx hash…"
          className="flex-1 min-w-[140px] rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] font-mono text-white"
        />
        <select
          value={network}
          onChange={e => setNetwork(e.target.value as TxNetwork)}
          className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] text-zinc-300"
        >
          <option value="mainnet">mainnet</option>
          <option value="devnet">devnet</option>
          <option value="testnet">testnet</option>
        </select>
        <button type="button" className="btn-secondary text-[11px] py-1.5 px-2" onClick={startWatch}>
          Watch
        </button>
      </div>

      {rows.length === 0 && (
        <p className="text-[11px] text-zinc-600">
          Aucune TX suivie. Après broadcast, le hash est monitoré via API (pas de faux succès).
        </p>
      )}

      <ul className="space-y-2">
        {rows.map(tx => (
          <li
            key={`${tx.network}-${tx.hash}-${tx.startedAt}`}
            className={`rounded-lg border px-3 py-2 text-[11px] ${STATUS_STYLE[tx.status] || STATUS_STYLE.unknown}`}
          >
            <div className="flex justify-between gap-2">
              <span className="font-mono">{tx.hash.slice(0, 12)}…{tx.hash.slice(-6)}</span>
              <span className="uppercase font-semibold">{tx.status}</span>
            </div>
            <div className="flex justify-between mt-1 text-zinc-500">
              <span>
                {tx.network} · polls {tx.polls}
              </span>
              <a
                href={tx.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400/80 underline"
              >
                Explorer
              </a>
            </div>
            {tx.error && <p className="text-rose-400/90 mt-1">{tx.error}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
