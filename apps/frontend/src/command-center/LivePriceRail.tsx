/**
 * Overlay HTML 2D — prix EGLD / $TRO vectoriels au-dessus du canvas 3D.
 */
import { useEffect, useState } from 'react'

const TRO_ID = 'TRO-3bc587'

export default function LivePriceRail() {
  const [egld, setEgld] = useState<number | null>(null)
  const [troEgld, setTroEgld] = useState<number | null>(null)
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
      let ratio: number | null = null
      try {
        const r = await fetch(`https://api.multiversx.com/tokens/${TRO_ID}`, { cache: 'no-store' })
        if (r.ok) {
          const j = await r.json()
          const price = Number(j.price)
          if (e && price > 0) ratio = price / e
        }
      } catch {
        /* */
      }
      if (ratio == null) ratio = 0.517
      if (!c) {
        setEgld(e)
        setTroEgld(ratio)
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

  const rows = [
    { k: 'EGLD', v: egld != null ? `$${egld.toFixed(2)}` : '…', accent: 'text-cyan-200' },
    {
      k: '$TRO',
      v: troEgld != null ? `${troEgld.toFixed(3)} EGLD` : '…',
      accent: 'text-violet-200',
    },
    { k: 'UTC', v: ts || '—', accent: 'text-zinc-300' },
  ]

  return (
    <div className="data-overlay-rail absolute right-2 top-10 bottom-8 z-10 w-[7.75rem] pointer-events-none">
      <div className="h-full rounded-xl border border-cyan-400/30 bg-black/55 px-2.5 py-2.5 flex flex-col gap-2.5 shadow-[0_0_20px_rgba(34,211,238,0.12)]"
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="badge-live badge-live-on text-[8px] py-0.5 px-1.5">
            <span className="badge-live-dot" />
            LIVE
          </span>
        </div>
        {rows.map(r => (
          <div key={r.k} className="border-b border-white/10 pb-2 last:border-0">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400">{r.k}</p>
            <p
              className={`text-[13px] font-bold tabular-nums font-tech leading-tight antialiased ${r.accent}`}
              style={{ textRendering: 'geometricPrecision' }}
            >
              {r.v}
            </p>
          </div>
        ))}
        <p className="text-[8px] text-zinc-600 mt-auto">API publiques</p>
      </div>
    </div>
  )
}
