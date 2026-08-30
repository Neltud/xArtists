/**
 * $TRO burn feed — JSON ops + total on-chain MultiversX (Burnify role).
 * Not a trading performance metric.
 */
import { useEffect, useState } from 'react'

type BurnEvent = {
  ts?: string
  amount_tro?: number
  tx?: string | null
  source?: string
  note?: string
}

type FeedDoc = {
  updated?: string
  events?: BurnEvent[]
  total_burned_tro?: number
  note?: string
  explorer?: string
  source_of_truth?: string
}

const CANDIDATES = [
  `${import.meta.env.BASE_URL}data/tro_burn_feed.json`,
  'data/tro_burn_feed.json',
  'https://raw.githubusercontent.com/Neltud/xArtists/main/data/tro_burn_feed.json',
]

const TOKEN_API = 'https://api.multiversx.com/tokens/TRO-94c925'
const DECIMALS = 6

export default function TroBurnFeed() {
  const [doc, setDoc] = useState<FeedDoc | null>(null)
  const [onchainTotal, setOnchainTotal] = useState<number | null>(null)
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
          break
        } catch {
          /* next */
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Live total from MultiversX (authoritative burnt field)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch(TOKEN_API, { cache: 'no-store' })
        if (!r.ok) return
        const j = await r.json()
        const raw = Number(j?.burnt ?? 0)
        if (!Number.isFinite(raw) || cancelled) return
        setOnchainTotal(raw / 10 ** DECIMALS)
      } catch {
        /* offline */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const events = doc?.events ?? []
  const total =
    onchainTotal != null
      ? onchainTotal
      : doc?.total_burned_tro != null
        ? doc.total_burned_tro
        : null

  return (
    <div className="card border-orange-500/25 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 className="text-sm font-bold">🔥 $TRO burn feed</h3>
        {total != null && (
          <span className="text-xs text-orange-300 mono font-semibold">
            Σ {total.toLocaleString(undefined, { maximumFractionDigits: 3 })} TRO
          </span>
        )}
      </div>
      <p className="text-[11px] text-zinc-500 mb-3">
        Preuve de déflation on-chain · Burnify (ESDTRoleLocalBurn) · pas une métrique de performance
      </p>

      {total != null && total > 0 && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-3 py-2 mb-3 text-xs text-zinc-300">
          <p>
            <span className="text-orange-200 font-semibold">
              {total.toLocaleString(undefined, { maximumFractionDigits: 3 })} TRO
            </span>{' '}
            brûlés au total (champ <code className="text-[10px]">burnt</code> API MultiversX).
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">
            Source live · TRO-94c925 · protocole Burnify officiel
          </p>
          <a
            href="https://explorer.multiversx.com/tokens/TRO-94c925"
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-1.5 text-[11px] text-cyan-400/90 underline underline-offset-2"
          >
            Explorer TRO ↗
          </a>
        </div>
      )}

      {err && !doc && (
        <p className="text-xs text-zinc-500">
          Feed JSON indisponible — total on-chain affiché si API OK.
        </p>
      )}
      {events.length === 0 && total == null && (
        <p className="text-xs text-zinc-500">Feed vide — en attente des premiers burns on-chain.</p>
      )}
      {events.length > 0 && (
        <ul className="space-y-2 max-h-48 overflow-y-auto text-xs">
          {events.slice(0, 20).map((e, i) => (
            <li
              key={`${e.ts}-${e.tx}-${i}`}
              className="flex flex-wrap gap-2 border-b border-white/5 pb-1.5"
            >
              <span className="text-zinc-500 mono">{e.ts ? e.ts.slice(0, 19) : '—'}</span>
              <span className="font-semibold text-orange-300">
                {e.amount_tro != null
                  ? `−${e.amount_tro.toLocaleString(undefined, { maximumFractionDigits: 3 })} TRO`
                  : '—'}
              </span>
              {e.source && <span className="text-zinc-400">{e.source}</span>}
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
      <p className="text-[10px] text-zinc-600 mt-2">
        {onchainTotal != null && 'live API · '}
        {doc?.updated && `json ${doc.updated}`}
      </p>
    </div>
  )
}
