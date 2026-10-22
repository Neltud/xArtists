import {localizeChild as xaLocalize, renderChild as xaRender, usePhraseLocale as xaUsePhraseLocale} from '../i18n/phraseRuntime'
import { useEffect, useState } from 'react'
import {
  fetchMarketplaceActivity,
  fetchListingsIndex,
  verifyScOnExplorer,
  type IndexedListingHint,
  type CatalogListing,
} from '../lib/listingsIndex'
import { MARKETPLACE_ADDRESS, canListBuyNft } from '../config/scStatus'

type Props = {
  onPickListingId?: (id: number) => void
}

export default function MarketplaceActivity({ onPickListingId }: Props) {
  xaUsePhraseLocale()

  const [rows, setRows] = useState<IndexedListingHint[]>([])
  const [catalog, setCatalog] = useState<CatalogListing[]>([])
  const [indexOk, setIndexOk] = useState<boolean | null>(null)
  const [sc, setSc] = useState<{
    ok: boolean
    explorer?: string
    codeHash?: string | null
    error?: string
  } | null>(null)

  useEffect(() => {
    fetchMarketplaceActivity(MARKETPLACE_ADDRESS).then(setRows)
    verifyScOnExplorer(MARKETPLACE_ADDRESS).then(r =>
      setSc({
        ok: !!r.ok,
        explorer: (r as { explorer?: string }).explorer,
        codeHash: (r as { codeHash?: string | null }).codeHash ?? null,
        error: (r as { error?: string }).error,
      })
    )
    fetchListingsIndex().then(idx => {
      if (!idx) {
        setIndexOk(null)
        return
      }
      setIndexOk(!!idx.codehash_ok)
      setCatalog(Array.isArray(idx.listings) ? idx.listings : [])
    })
  }, [])

  return (
    <div className="card mb-6">
      <h2 className="text-sm font-bold mb-2">{xaRender("SC Marketplace · activite + index")}</h2>
      <p className="text-[10px] mono text-gray-500 mb-1 break-all">{xaRender(MARKETPLACE_ADDRESS)}</p>
      <p className="text-[10px] mb-2">
        {xaRender(canListBuyNft() ? (
          <span className="text-emerald-300">{xaRender("List/Buy LIVE (CODEHASH_OK)")}</span>
        ) : (
          <span className="text-amber-300">{xaRender("List/Buy gated — set VITE_MARKETPLACE_CODEHASH_OK")}</span>
        ))}
      </p>
      {xaRender(sc && (
        <div className="text-xs mb-3 space-y-1">
          {xaRender(sc.ok ? (
            <>
              <a
                href={sc.explorer}
                target="_blank"
                rel="noreferrer"
                className="text-purple-400 hover:underline"
              >
                {xaRender("Explorer ↗ ")}</a>
              {xaRender(sc.codeHash ? (
                <p className="mono text-[10px] text-gray-500 break-all">
                  {xaRender("codeHash: ")}{xaRender(String(sc.codeHash).slice(0, 24))}…
                </p>
              ) : (
                <p className="text-[10px] text-red-300/90">{xaRender("codeHash absent — compte vide / non deploye")}</p>
              ))}
            </>
          ) : (
            <span className="text-amber-400">{xaRender("SC non verifie: ")}{xaRender(sc.error)}</span>
          ))}
        </div>
      ))}

      {xaRender(indexOk === false && (
        <p className="text-[10px] text-amber-300/90 mb-2">
          {xaRender("listings_index.json : codehash_ok=false — pas de listings catalogues ")}</p>
      ))}

      {xaRender(catalog.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] uppercase text-gray-500 mb-1">{xaRender("Index publie (")}{xaRender(catalog.length)})</p>
          <ul className="space-y-1 max-h-32 overflow-y-auto text-xs">
            {xaRender(catalog.map(l => (
              <li key={l.listing_id} className="flex justify-between gap-2">
                <button
                  type="button"
                  className="text-purple-300 underline"
                  onClick={() => onPickListingId?.(l.listing_id)}
                >
                  {xaRender("id=")}{xaRender(l.listing_id)}
                </button>
                <span className="text-gray-500 truncate">
                  {xaRender(l.price_egld ? `${l.price_egld} EGLD` : l.token_id || '—')}
                </span>
              </li>
            )))}
          </ul>
        </div>
      ))}

      {xaRender(rows.length === 0 ? (
        <p className="text-xs text-gray-500">{xaRender("Aucune tx recente — listing ID reste manuel si besoin.")}</p>
      ) : (
        <ul className="space-y-1 max-h-48 overflow-y-auto text-xs">
          {xaRender(rows.slice(0, 15).map(r => (
            <li
              key={r.txHash}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2a2a3a]/40 py-1"
            >
              <span className="text-gray-400">
                {xaRender(r.function || 'tx')}
                {xaRender(r.listingIdHint != null && (
                  <button
                    type="button"
                    className="ml-2 text-purple-300 underline"
                    onClick={() => onPickListingId?.(r.listingIdHint!)}
                    title={xaLocalize("Remplir listing ID")}
                  >
                    {xaRender("id=")}{xaRender(r.listingIdHint)}
                  </button>
                ))}
              </span>
              <a
                href={`https://explorer.multiversx.com/transactions/${r.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="mono text-purple-300 truncate"
              >
                {xaRender(r.txHash.slice(0, 10))}…
              </a>
            </li>
          )))}
        </ul>
      ))}
    </div>
  )
}
