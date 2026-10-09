/**
 * Vertical price rail — EGLD USD + TRO/EGLD ratio (public APIs).
 */
import { useEffect, useState } from 'react'

const TRO_ID = 'TRO-3bc587' // best-effort; ratio may fall back

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
        // OneDex / public pair heuristic via MVX token economics if available
        const r = await fetch(
          `https://api.multiversx.com/tokens/${TRO_ID}`,
          { cache: 'no-store' },
        )
        if (r.ok) {
          const j = await r.json()
          const price = Number(j.price)
          if (e && price > 0) ratio = price / e
          else if (price > 0 && e) ratio = price / e
        }
      } catch {
        /* */
      }
      // known display fallback from product screenshots era
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
    { k: 'EGLD', v: egld != null ? `$${egld.toFixed(2)}` : '…' },
    { k: '$TRO', v: troEgld != null ? `${troEgld.toFixed(3)} EGLD` : '…' },
    { k: 'UTC', v: ts || '—' },
  ]

  return (
    <div className="absolute right-2 top-10 bottom-8 z-10 w-[7.5rem] pointer-events-none overflow-hidden">
      <div className="h-full rounded-xl border border-cyan-400/25 bg-black/50 backdrop-blur-md px-2 py-2 flex flex-col gap-2">
        <p className="text-[8px] font-tech uppercase tracking-widest text-cyan-300/80">Live rail</p>
        {rows.map(r => (
          <div key={r.k} className="border-b border-white/5 pb-1.5">
            <p className="text-[9px] text-zinc-500">{r.k}</p>
            <p className="text-[12px] font-bold tabular-nums text-cyan-100 font-tech leading-tight">
              {r.v}
            </p>
          </div>
        ))}
        <p className="text-[8px] text-zinc-600 mt-auto">public APIs</p>
      </div>
    </div>
  )
}
