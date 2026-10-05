/** RWA-TRO supply monitor — mint vs burn. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { asText } from '../../lib/safeRender'

type Led = {
  total_minted?: number
  total_burned?: number
  circulating?: number
  paper?: boolean
}

async function loadLed(): Promise<Led | null> {
  const bases = [
    `${import.meta.env.BASE_URL || '/'}data/`,
    'https://neltud.github.io/xArtists/data/',
  ]
  for (const b of bases) {
    try {
      const r = await fetch(`${b}rwa_tro_ledger.json`, { cache: 'no-store' })
      if (!r.ok) continue
      return (await r.json()) as Led
    } catch {
      /* */
    }
  }
  return null
}

export default function EconomicPulse() {
  const [led, setLed] = useState<Led | null>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      const d = await loadLed()
      if (!c) setLed(d)
    })()
    return () => {
      c = true
    }
  }, [])

  const m = Number(led?.total_minted ?? 0)
  const b = Number(led?.total_burned ?? 0)
  const circ = Number(led?.circulating ?? m - b)
  const ratio = m > 0 ? b / m : 0

  return (
    <section className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-violet-200/80 font-semibold">
          RWA · TRO economic pulse
        </p>
        {led?.paper !== false && (
          <span className="text-[9px] text-zinc-500 uppercase">Paper ledger</span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[9px] text-zinc-500 uppercase">Minted</p>
          <p className="text-lg font-semibold tabular-nums text-emerald-400">{asText(m)}</p>
        </div>
        <div>
          <p className="text-[9px] text-zinc-500 uppercase">Burned</p>
          <p className="text-lg font-semibold tabular-nums text-rose-400">{asText(b)}</p>
        </div>
        <div>
          <p className="text-[9px] text-zinc-500 uppercase">Circulating</p>
          <p className="text-lg font-semibold tabular-nums text-white">{asText(circ)}</p>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-[9px] text-zinc-500 mb-0.5">
          <span>Burn / mint</span>
          <span>{asText((ratio * 100).toFixed(0))}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-black/50 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-rose-500"
            style={{ width: `${Math.min(100, ratio * 100)}%` }}
          />
        </div>
      </div>
      <Link to="/rwa" className="text-[11px] text-cyan-400 underline">
        RWA catalog →
      </Link>
    </section>
  )
}
