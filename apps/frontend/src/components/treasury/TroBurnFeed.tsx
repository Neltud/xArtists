/**
 * T6 — $TRO burn feed (JSON published by Vellum / ops).
 */
import { useEffect, useState } from 'react'

type BurnEvent = {
  ts?: string
  amount_tro?: number
  tx?: string
  source?: string
  note?: string
}

type FeedDoc = {
  updated?: string
  events?: BurnEvent[]
  total_burned_tro?: number
}

const CANDIDATES = [
  `${import.meta.env.BASE_URL}data/tro_burn_feed.json`,
  'data/tro_burn_feed.json',
  'https://raw.githubusercontent.com/Neltud/xArtists/main/data/tro_burn_feed.json',
]

export default function TroBurnFeed() {
  const [doc, setDoc] = useState<FeedDoc | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const t = Date.now()
      for (const base of CANDIDATES) {
        try {
          const url = base.includes('?') ? base : `${base}?t=${t}`
          const r = await fetch(url, { cache: 'no-store' })
          if (!r.ok) continue
          const j = (await r.json()) as FeedDoc
          if (!cancelled) {
            setDoc(j)
            setErr(null)
          }
          return
        } catch {
          /* next */
        }
      }
      if (!cancelled) setErr('feed unavailable')
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const events = doc?.events ?? []

  return (
    <div className="card border-white/10 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 className="text-sm font-bold">🔥 $TRO burn feed</h3>
        {doc?.total_burned_tro != null && (
          <span className="text-xs text-gray-400 mono">
            Σ {doc.total_burned_tro.toLocaleString()} TRO
          </span>
        )}
      </div>
      <p className="text-[11px] text-gray-500 mb-3">
        Proof of deflation events · published JSON · not a performance metric
      </p>
      {err && !doc && (
        <p className="text-xs text-gray-500">
          Aucun événement publié. Ops : écrire <code>data/tro_burn_feed.json</code> + mirror.
        </p>
      )}
      {events.length === 0 && !err && (
        <p className="text-xs text-gray-500">Feed vide — en attente des premiers burns on-chain.</p>
      )}
      {events.length > 0 && (
        <ul className="space-y-2 max-h-48 overflow-y-auto text-xs">
          {events.slice(0, 20).map((e, i) => (
            <li key={`${e.ts}-${e.tx}-${i}`} className="flex flex-wrap gap-2 border-b border-white/5 pb-1.5">
              <span className="text-gray-500 mono">{e.ts ? e.ts.slice(0, 19) : '—'}</span>
              <span className="font-semibold text-orange-300">
                {e.amount_tro != null ? `−${e.amount_tro} TRO` : '—'}
              </span>
              {e.source && <span className="text-gray-400">{e.source}</span>}
              {e.tx && (
                <a
                  href={`https://explorer.multiversx.com/transactions/${e.tx}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-300 underline truncate max-w-[10rem]"
                >
                  tx
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
      {doc?.updated && <p className="text-[10px] text-gray-600 mt-2">updated {doc.updated}</p>}
    </div>
  )
}
