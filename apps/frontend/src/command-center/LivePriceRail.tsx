/**
 * Overlay HTML 2D — EGLD USD · $TRO Spot USD · Ratio réserve (1 EGLD = X $TRO).
 * Jamais « $TRO 0.51 EGLD » comme prix unitaire trompeur.
 * Badge LIVE → STALE si lastUpdated > 300s.
 */
import { useEffect, useState } from 'react'

/** Identifiants $TRO connus (API MultiversX) */
const TRO_IDS = ['TRO-94c925', 'TRO-3bc587']

/** Données considérées STALE après 5 minutes sans fetch réussi */
const STALE_MS = 300_000

export default function LivePriceRail() {
  const [egldUsd, setEgldUsd] = useState<number | null>(null)
  const [troUsd, setTroUsd] = useState<number | null>(null)
  /** Epoch ms du dernier fetch réussi (au moins un prix) */
  const [lastUpdatedTimestamp, setLastUpdatedTimestamp] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let c = false
    const run = async () => {
      let e: number | null = null
      try {
        const r = await fetch('https://api.multiversx.com/economics', { cache: 'no-store' })
        if (r.ok) {
          const j = await r.json()
          e = Number(j.price) || null
        }
      } catch {
        /* */
      }
      if (e == null) {
        try {
          const r = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=elrond-erd-2&vs_currencies=usd',
            { cache: 'no-store' },
          )
          if (r.ok) {
            const j = await r.json()
            e = Number(j['elrond-erd-2']?.usd) || null
          }
        } catch {
          /* */
        }
      }

      let tro: number | null = null
      for (const id of TRO_IDS) {
        try {
          const r = await fetch(`https://api.multiversx.com/tokens/${id}`, { cache: 'no-store' })
          if (!r.ok) continue
          const j = await r.json()
          const price = Number(j.price)
          if (Number.isFinite(price) && price > 0) {
            tro = price
            break
          }
        } catch {
          /* next id */
        }
      }

      if (!c) {
        setEgldUsd(e)
        setTroUsd(tro)
        if (e != null || tro != null) {
          setLastUpdatedTimestamp(Date.now())
        }
        setNow(Date.now())
      }
    }
    void run()
    const id = window.setInterval(() => void run(), 30_000)
    const tick = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => {
      c = true
      window.clearInterval(id)
      window.clearInterval(tick)
    }
  }, [])

  const ageMs =
    lastUpdatedTimestamp != null ? now - lastUpdatedTimestamp : Number.POSITIVE_INFINITY
  const isStale = lastUpdatedTimestamp == null || ageMs > STALE_MS
  const isLive = lastUpdatedTimestamp != null && !isStale

  /** Ratio réserve : combien de $TRO pour 1 EGLD (pas un prix unitaire $TRO) */
  const troPerEgld =
    egldUsd != null && troUsd != null && troUsd > 0 ? egldUsd / troUsd : null

  const fmtTroSpot = (v: number | null) => {
    if (v == null) return '…'
    if (v < 0.01) return `$${v.toFixed(6)}`
    if (v < 1) return `$${v.toFixed(4)}`
    return `$${v.toFixed(2)}`
  }

  const fmtRatio = (v: number | null) => {
    if (v == null) return '—'
    if (v >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 0 })
    if (v >= 10) return v.toFixed(2)
    if (v >= 1) return v.toFixed(3)
    return v.toExponential(2)
  }

  const utcLabel =
    lastUpdatedTimestamp != null
      ? new Date(lastUpdatedTimestamp).toISOString().slice(11, 19)
      : '—'

  const rows = [
    {
      k: 'EGLD',
      sub: 'Spot USD',
      v: egldUsd != null ? `$${egldUsd.toFixed(2)}` : '…',
      accent: 'text-cyan-200',
    },
    {
      k: '$TRO Spot',
      sub: 'USD / token',
      v: fmtTroSpot(troUsd),
      accent: 'text-violet-200',
    },
    {
      k: 'Ratio',
      sub: '1 EGLD = X $TRO',
      v: troPerEgld != null ? fmtRatio(troPerEgld) : '—',
      accent: 'text-amber-100/90',
    },
    {
      k: 'UTC',
      sub: isStale ? 'stale' : 'updated',
      v: utcLabel,
      accent: isStale ? 'text-amber-300/90' : 'text-zinc-300',
    },
  ]

  return (
    <div className="data-overlay-rail absolute right-2 top-10 bottom-8 z-10 w-[8.5rem] pointer-events-none">
      <div
        className="h-full rounded-xl border border-cyan-400/30 bg-black/55 px-2.5 py-2.5 flex flex-col gap-2 shadow-[0_0_20px_rgba(34,211,238,0.12)]"
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-1.5">
          {isLive ? (
            <span className="badge-live badge-live-on text-[8px] py-0.5 px-1.5">
              <span className="badge-live-dot" />
              LIVE
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 text-amber-200 text-[8px] py-0.5 px-1.5 font-tech uppercase tracking-wider"
              title={
                lastUpdatedTimestamp == null
                  ? 'Aucun fetch réussi'
                  : `Dernière MAJ il y a ${Math.round(ageMs / 1000)}s (>${STALE_MS / 1000}s)`
              }
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
              STALE
            </span>
          )}
        </div>
        {rows.map(r => (
          <div key={r.k} className="border-b border-white/10 pb-1.5 last:border-0">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400">
              {r.k}
              {r.sub ? (
                <span className="text-zinc-600 font-normal normal-case"> · {r.sub}</span>
              ) : null}
            </p>
            <p
              className={`text-[12px] font-bold mono tabular-nums leading-tight antialiased ${r.accent}`}
            >
              {r.v}
            </p>
          </div>
        ))}
        <p className="text-[8px] text-zinc-600 mt-auto leading-tight">
          Spot ≠ ratio · API publiques · pas un conseil
        </p>
      </div>
    </div>
  )
}
