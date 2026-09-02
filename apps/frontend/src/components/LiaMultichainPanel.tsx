import { useEffect, useState } from 'react'
import { LIA_MULTICHAIN } from '../config/multichain'

type ChainBal = { symbol: string; address: string; explorer: string; balanceLabel: string; note?: string }

/**
 * LIA ops balances across chains — Portfolio only (not user Wallet).
 * MVX: live API. BTC/SOL: address + explorer (balance fetch best-effort).
 */
export default function LiaMultichainPanel() {
  const [egld, setEgld] = useState<string>('…')
  const [rows, setRows] = useState<ChainBal[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const list: ChainBal[] = [
        {
          symbol: 'EGLD',
          address: LIA_MULTICHAIN.egld.address,
          explorer: LIA_MULTICHAIN.egld.explorer,
          balanceLabel: '…',
        },
        {
          symbol: 'BTC',
          address: LIA_MULTICHAIN.btc.address,
          explorer: LIA_MULTICHAIN.btc.explorer,
          balanceLabel: 'voir explorer',
          note: 'Adresse receive LIA',
        },
        {
          symbol: 'SOL',
          address: LIA_MULTICHAIN.sol.address,
          explorer: LIA_MULTICHAIN.sol.explorer,
          balanceLabel: 'voir explorer',
          note: 'Adresse receive LIA',
        },
      ]
      try {
        const r = await fetch(
          `https://api.multiversx.com/accounts/${LIA_MULTICHAIN.egld.address}`,
          { cache: 'no-cache' }
        )
        if (r.ok) {
          const j = await r.json()
          const bal = Number(j.balance || 0) / 1e18
          list[0].balanceLabel = `${bal.toFixed(6)} EGLD`
          if (!cancelled) setEgld(list[0].balanceLabel)
        }
      } catch {
        list[0].balanceLabel = 'API offline'
      }
      // BTC mempool
      try {
        const r = await fetch(
          `https://mempool.space/api/address/${LIA_MULTICHAIN.btc.address}`,
          { cache: 'no-cache' }
        )
        if (r.ok) {
          const j = await r.json()
          const funded = (j.chain_stats?.funded_txo_sum || 0) - (j.chain_stats?.spent_txo_sum || 0)
          list[1].balanceLabel = `${(funded / 1e8).toFixed(8)} BTC`
        }
      } catch {
        /* keep explorer note */
      }
      // SOL public RPC
      try {
        const r = await fetch('https://api.mainnet-beta.solana.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getBalance',
            params: [LIA_MULTICHAIN.sol.address],
          }),
        })
        if (r.ok) {
          const j = await r.json()
          const lamports = j.result?.value ?? 0
          list[2].balanceLabel = `${(lamports / 1e9).toFixed(6)} SOL`
        }
      } catch {
        /* keep explorer note */
      }
      if (!cancelled) setRows(list)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="card border-indigo-500/25 bg-indigo-500/5 mb-6">
      <h2 className="text-lg font-bold mb-1">🌐 LIA multi-chain (ops)</h2>
      <p className="text-xs text-gray-500 mb-4">
        Trésorerie protocole — <strong>pas</strong> ton Connect. EGLD live · BTC/SOL adresses receive.
      </p>
      <div className="space-y-3">
        {(rows.length ? rows : []).map(c => (
          <div
            key={c.symbol}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#111118] border border-[#2a2a3a]"
          >
            <div className="min-w-0">
              <p className="font-bold text-sm">{c.symbol}</p>
              <p className="mono text-[10px] text-gray-500 break-all">{c.address}</p>
              {c.note && <p className="text-[10px] text-gray-600">{c.note}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold text-indigo-300 text-sm">{c.balanceLabel}</p>
              <a href={c.explorer} target="_blank" rel="noreferrer" className="text-[10px] text-purple-400">
                Explorer ↗
              </a>
            </div>
          </div>
        ))}
        {!rows.length && <p className="text-sm text-gray-500">Chargement multi-chain… ({egld})</p>}
      </div>
    </div>
  )
}
