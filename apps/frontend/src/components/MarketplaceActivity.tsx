import { useEffect, useState } from 'react'
import {
  fetchMarketplaceActivity,
  verifyScOnExplorer,
  type IndexedListingHint,
} from '../lib/listingsIndex'
import { MARKETPLACE_ADDRESS } from '../../../../packages/core/src/contracts/marketplaceAbi'

type Props = {
  onPickListingId?: (id: number) => void
}

export default function MarketplaceActivity({ onPickListingId }: Props) {
  const [rows, setRows] = useState<IndexedListingHint[]>([])
  const [sc, setSc] = useState<{
    ok: boolean
    explorer?: string
    codeHash?: string | null
    error?: string
  } | null>(null)

  useEffect(() => {
    fetchMarketplaceActivity().then(setRows)
    verifyScOnExplorer().then(r =>
      setSc({
        ok: !!r.ok,
        explorer: (r as any).explorer,
        codeHash: (r as any).codeHash ?? (r as any).code,
        error: (r as any).error,
      })
    )
  }, [])

  return (
    <div className="card mb-6">
      <h2 className="text-sm font-bold mb-2">SC Marketplace · activité + codeHash</h2>
      <p className="text-[10px] mono text-gray-500 mb-2 break-all">{MARKETPLACE_ADDRESS}</p>
      {sc && (
        <div className="text-xs mb-3 space-y-1">
          {sc.ok ? (
            <>
              <a href={sc.explorer} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">
                Explorer ↗
              </a>
              {sc.codeHash && (
                <p className="mono text-[10px] text-gray-500 break-all">codeHash: {String(sc.codeHash).slice(0, 24)}…</p>
              )}
              <p className="text-[10px] text-amber-200/80">
                P0: comparer ce codeHash au wasm repo avant Bid live —{" "}
                <code>python scripts/verify_marketplace_codehash.py</code>
              </p>
            </>
          ) : (
            <span className="text-amber-400">SC non vérifié: {sc.error}</span>
          )}
        </div>
      )}
      {rows.length === 0 ? (
        <p className="text-xs text-gray-500">Aucune tx récente — listing ID reste manuel si besoin.</p>
      ) : (
        <ul className="space-y-1 max-h-48 overflow-y-auto text-xs">
          {rows.slice(0, 15).map(r => (
            <li key={r.txHash} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2a2a3a]/40 py-1">
              <span className="text-gray-400">
                {r.function || 'tx'}
                {r.listingIdHint != null && (
                  <button
                    type="button"
                    className="ml-2 text-purple-300 underline"
                    onClick={() => onPickListingId?.(r.listingIdHint!)}
                    title="Remplir listing ID"
                  >
                    id={r.listingIdHint}
                  </button>
                )}
              </span>
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
