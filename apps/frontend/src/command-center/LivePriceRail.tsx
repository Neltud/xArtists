/**
 * Overlay HTML 2D — EGLD USD · $TRO Spot USD · Ratio réserve (1 EGLD = X $TRO).
 * Badge LIVE → STALE si lastUpdated > 300s.
 * Cache localStorage pour survivre aux 429 / timeouts.
 */
import { useEffect, useState } from 'react'

const TRO_IDS = ['TRO-94c925', 'TRO-3bc587']
const STALE_MS = 300_000
const CACHE_KEY = 'xartists_live_price_rail_v1'

type PriceCache = { egld: number | null; tro: number | null; ts: number }

function readCache(): PriceCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const j = JSON.parse(raw) as PriceCache
    if (!j || typeof j.ts !== 'number') return null
    return j
  } catch {
    return null
  }
}

function writeCache(egld: number | null, tro: number | null) {
  try {
    if (egld == null && tro == null) return
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ egld, tro, ts: Date.now() } satisfies PriceCache),
    )
  } catch {
    /* */
  }
}

function fmtTroSpot(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '…'
  if (n >= 1) return `$${n.toFixed(3)}`
  if (n >= 0.01) return `$${n.toFixed(4)}`
  return `$${n.toFixed(6)}`
}

function fmtRatio(n: number): string {
  if (n >= 1000) return n.toFixed(0)
  if (n >= 10) return n.toFixed(1)
  return n.toFixed(2)
}

export default function LivePriceRail() {
  const boot = readCache()
  const [egldUsd, setEgldUsd] = useState<number | null>(boot?.egld ?? null)
  const [troUsd, setTroUsd] = useState<number | null>(boot?.tro ?? null)
  const [lastUpdatedTimestamp, setLastUpdatedTimestamp] = useState<number | null>(boot?.ts ?? null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let c = false
    const run = async () => {
      let e: number | null = null
      try {
        const r = await fetch('https://api.multiversx.com/economics', { cache: 'no-store' })
        if (r.status === 429) throw new Error('429')
        if (r.ok) {
          const j = await r.json()
          const p = Number(j.price)
          if (Number.isFinite(p) && p > 0) e = p
        }
      } catch {
        /* */
      }
      if (e == null) {
        try {
          const r = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=elrond-erd-2,multiversx&vs_currencies=usd',
            { cache: 'no-store' },
          )
          if (r.ok) {
            const j = await r.json()
            e =
              Number(j['elrond-erd-2']?.usd) ||
              Number(j.multiversx?.usd) ||
              null
            if (e != null && !(e > 0)) e = null
          }
        } catch {
          /* */
        }
      }

      let tro: number | null = null
      for (const id of TRO_IDS) {
        try {
          const r = await fetch(`https://api.multiversx.com/tokens/${id}`, { cache: 'no-store' })
          if (r.status === 429) break
          if (!r.ok) continue
          const j = await r.json()
          const price = Number(j.price)
          if (Number.isFinite(price) && price > 0) {
            tro = price
            break
          }
        } catch {
          /* next */
        }
      }

      if (c) return

      if (e == null && tro == null) {
        const cached = readCache()
        if (cached) {
          setEgldUsd(cached.egld)
          setTroUsd(cached.tro)
          setLastUpdatedTimestamp(cached.ts)
        }
        setNow(Date.now())
        return
      }

      const nextE = e ?? readCache()?.egld ?? null
      const nextT = tro ?? readCache()?.tro ?? null
      setEgldUsd(nextE)
      setTroUsd(nextT)
      writeCache(nextE, nextT)
      setLastUpdatedTimestamp(Date.now())
      setNow(Date.now())
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

  const ageMs = lastUpdatedTimestamp != null ? now - lastUpdatedTimestamp : null
  const isStale = ageMs == null || ageMs > STALE_MS
  const isLive = !isStale

  const troPerEgld =
    egldUsd != null && troUsd != null && troUsd > 0 ? egldUsd / troUsd : null

  const utcLabel =
    lastUpdatedTimestamp != null
      ? new Date(lastUpdatedTimestamp).toISOString().slice(11, 19)
      : '—'

  const rows = [
    {
      k: 'EGLD',
      sub: 'USD',
      v: egldUsd != null && Number.isFinite(egldUsd) ? `$${egldUsd.toFixed(2)}` : '…',
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
                  : `Dernière MAJ il y a ${Math.round((ageMs || 0) / 1000)}s (>${STALE_MS / 1000}s)`
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
          Spot ≠ ratio · API publiques · cache 5 min
        </p>
      </div>
    </div>
  )
}
