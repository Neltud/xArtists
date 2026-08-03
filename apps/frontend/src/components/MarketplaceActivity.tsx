import { useEffect, useState } from 'react'
import {
  fetchMarketplaceActivity,
  verifyScOnExplorer,
  type IndexedListingHint,
} from '../lib/listingsIndex'
import { MARKETPLACE_ADDRESS } from '../../../../packages/core/src/contracts/marketplaceAbi'

export default function MarketplaceActivity() {
  const [rows, setRows] = useState<IndexedListingHint[]>([])
  const [sc, setSc] = useState<{ ok: boolean; explorer?: string; error?: string } | null>(null)

  useEffect(() => {
    fetchMarketplaceActivity().then(setRows)
    verifyScOnExplorer().then(setSc)
  }, [])

  return (
    <div className="card mb-6">
      <h2 className="text-sm font-bold mb-2">SC Marketplace · activité récente</h2>
      <p className="text-[10px] mono text-gray-500 mb-2 break-all">{MARKETPLACE_ADDRESS}</p>
      {sc && (
        <p className="text-xs mb-3">
          {sc.ok ? (
            <a href={sc.explorer} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">
              Vérifié sur explorer ↗
            </a>
          ) : (
            <span className="text-amber-400">SC non vérifié: {sc.error}</span>
          )}
        </p>
      )}
      {rows.length === 0 ? (
        <p className="text-xs text-gray-500">
          Aucune tx récente ou SC placeholder — listing ID reste à saisir manuellement jusqu’à index
          on-chain complet.
        </p>
      ) : (
        <ul className="space-y-1 max-h-40 overflow-y-auto text-xs">
          {rows.slice(0, 12).map(r => (
            <li key={r.txHash} className="flex justify-between gap-2 border-b border-[#2a2a3a]/40 py-1">
              <span className="text-gray-400">{r.function || 'tx'}</span>
              <a
                href={`https://explorer.multiversx.com/transactions/${r.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="mono text-purple-300 truncate"
              >
                {r.txHash.slice(0, 10)}…
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
