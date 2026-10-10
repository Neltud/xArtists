/**
 * Overlay HTML 2D — EGLD USD · $TRO USD (prix unitaire) · ratio TRO/EGLD explicite.
 * Ne plus afficher « 0.517 EGLD » comme prix unitaire trompeur.
 */
import { useEffect, useState } from 'react'

/** Identifiants $TRO connus (API MultiversX) */
const TRO_IDS = ['TRO-94c925', 'TRO-3bc587']

export default function LivePriceRail() {
  const [egldUsd, setEgldUsd] = useState<number | null>(null)
  const [troUsd, setTroUsd] = useState<number | null>(null)
  const [ts, setTs] = useState('')

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
        setTs(new Date().toISOString().slice(11, 19))
      }
    }
    void run()
    const id = window.setInterval(() => void run(), 30_000)
    return () => {
      c = true
      window.clearInterval(id)
    }
  }, [])

  const ratio =
    egldUsd != null && troUsd != null && egldUsd > 0 ? troUsd / egldUsd : null

  const fmtTroUsd = (v: number | null) => {
    if (v == null) return '…'
    if (v < 0.01) return `$${v.toFixed(6)}`
    if (v < 1) return `$${v.toFixed(4)}`
    return `$${v.toFixed(2)}`
  }

  const rows = [
    {
      k: 'EGLD',
      sub: 'USD',
      v: egldUsd != null ? `$${egldUsd.toFixed(2)}` : '…',
      accent: 'text-cyan-200',
    },
    {
      k: '$TRO',
      sub: 'prix USD',
      v: fmtTroUsd(troUsd),
      accent: 'text-violet-200',
    },
    {
      k: 'TRO/EGLD',
      sub: 'ratio',
      v: ratio != null ? ratio.toExponential(2) : '—',
      accent: 'text-amber-100/90',
    },
    { k: 'UTC', sub: '', v: ts || '—', accent: 'text-zinc-300' },
  ]

  return (
    <div className="data-overlay-rail absolute right-2 top-10 bottom-8 z-10 w-[8.25rem] pointer-events-none">
      <div
        className="h-full rounded-xl border border-cyan-400/30 bg-black/55 px-2.5 py-2.5 flex flex-col gap-2 shadow-[0_0_20px_rgba(34,211,238,0.12)]"
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="badge-live badge-live-on text-[8px] py-0.5 px-1.5">
            <span className="badge-live-dot" />
            LIVE
          </span>
        </div>
        {rows.map(r => (
          <div key={r.k} className="border-b border-white/10 pb-1.5 last:border-0">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400">
              {r.k}
              {r.sub ? (
                <span className="text-zinc-600 font-normal normal-case"> · {r.sub}</span>
              ) : null}
            </p>
            <p className={`text-[12px] font-bold mono tabular-nums leading-tight antialiased ${r.accent}`}>
              {r.v}
            </p>
          </div>
        ))}
        <p className="text-[8px] text-zinc-600 mt-auto leading-tight">
          API publiques · pas un conseil
        </p>
      </div>
    </div>
  )
}
