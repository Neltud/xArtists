/**
 * Overlay HTML 2D — EGLD USD · $TRO Spot USD · Ratio réserve (1 EGLD = X $TRO).
 * Badge LIVE → STALE si lastUpdated > 300s.
 * Mode Pitch : PITCH_DEMO (pas de branding tiers).
 * Cache localStorage pour survivre aux 429 / timeouts.
 */
import { useEffect, useState } from 'react'
import { isPitchMode, PITCH_DEMO, PITCH_EVENT } from '../lib/pitchMode'

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
  const [pitch, setPitch] = useState(() => isPitchMode())
  const [egldUsd, setEgldUsd] = useState<number | null>(boot?.egld ?? null)
  const [troUsd, setTroUsd] = useState<number | null>(boot?.tro ?? null)
  const [lastUpdatedTimestamp, setLastUpdated] = useState<number | null>(boot?.ts ?? null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const on = () => setPitch(isPitchMode())
    window.addEventListener(PITCH_EVENT, on)
    return () => window.removeEventListener(PITCH_EVENT, on)
  }, [])

  useEffect(() => {
    let cancelled = false
    const tick = () => setNow(Date.now())
    const id = window.setInterval(tick, 15_000)

    const run = async () => {
      let e: number | null = null
      let tro: number | null = null
      try {
        const r = await fetch('https://api.multiversx.com/economics', { cache: 'no-store' })
        if (r.ok) {
          const j = await r.json()
          const price = Number(j.price)
          if (Number.isFinite(price) && price > 0) e = price
        }
      } catch {
        /* */
      }
      for (const id of TRO_IDS) {
        try {
          const r = await fetch(`https://api.multiversx.com/tokens/${id}`, { cache: 'no-store' })
          if (r.ok) {
            const j = await r.json()
            const price = Number(j.price)
            if (Number.isFinite(price) && price > 0) {
              tro = price
              break
            }
          }
        } catch {
          /* */
        }
      }
      if (cancelled) return
      if (e == null && tro == null) {
        const cached = readCache()
        if (cached) {
          setEgldUsd(cached.egld)
          setTroUsd(cached.tro)
          setLastUpdated(cached.ts)
        }
        return
      }
      const nextE = e ?? readCache()?.egld ?? null
      const nextT = tro ?? readCache()?.tro ?? null
      setEgldUsd(nextE)
      setTroUsd(nextT)
      setLastUpdated(Date.now())
      writeCache(nextE, nextT)
    }
    void run()
    const poll = window.setInterval(() => void run(), 60_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
      window.clearInterval(poll)
    }
  }, [])

  const ageMs = lastUpdatedTimestamp != null ? now - lastUpdatedTimestamp : null
  const isStale = ageMs == null || ageMs > STALE_MS
  const isLive = !isStale

  const displayEgld = pitch ? PITCH_DEMO.egldUsd : egldUsd
  const displayTro = pitch ? PITCH_DEMO.troUsd : troUsd
  const troPerEgld =
    displayEgld != null && displayTro != null && displayTro > 0
      ? displayEgld / displayTro
      : null

  const utcLabel =
    lastUpdatedTimestamp != null
      ? new Date(lastUpdatedTimestamp).toISOString().slice(11, 19)
      : '—'

  const rows = [
    {
      k: 'EGLD',
      sub: 'USD',
      v: displayEgld != null && Number.isFinite(displayEgld) ? `$${displayEgld.toFixed(2)}` : '…',
      accent: 'text-cyan-200',
    },
    {
      k: '$TRO Spot',
      sub: 'USD / token',
      v: fmtTroSpot(displayTro),
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
      sub: pitch ? 'pitch' : isStale ? 'stale' : 'updated',
      v: pitch ? 'DEMO' : utcLabel,
      accent: pitch ? 'text-amber-200' : isStale ? 'text-amber-300/90' : 'text-zinc-300',
    },
  ]

  return (
    <div className="data-overlay-rail absolute right-2 top-10 bottom-8 z-10 w-[8.5rem] pointer-events-none">
      <div
        className="h-full rounded-xl border border-cyan-400/30 bg-black/55 px-2.5 py-2.5 flex flex-col gap-2 shadow-[0_0_20px_rgba(34,211,238,0.12)]"
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-1.5">
          {pitch ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 text-amber-100 text-[8px] py-0.5 px-1.5 font-tech uppercase">
              PITCH
            </span>
          ) : isLive ? (
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
                  : `Dernière MAJ il y a ${Math.round((ageMs || 0) / 1000)}s`
              }
            >
              STALE
            </span>
          )}
        </div>
        {rows.map(row => (
          <div key={row.k} className="border-t border-white/5 pt-1.5 first:border-0 first:pt-0">
            <p className="text-[9px] uppercase tracking-wider text-zinc-500 leading-none">{row.k}</p>
            <p className={`text-[11px] font-semibold tabular-nums ${row.accent}`}>{row.v}</p>
            <p className="text-[8px] text-zinc-600">{row.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
