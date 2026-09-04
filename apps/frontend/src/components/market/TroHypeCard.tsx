/** TRO hype score — QuantOracle MultiversX */
import { useEffect, useState } from 'react'
import { quantOracle, type HypeScore } from '../../lab/quant/quantOracle'

const TRO = 'TRO-94c925'

export default function TroHypeCard() {
  const [hype, setHype] = useState<HypeScore | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      try {
        const s = await quantOracle.getHypeScore(TRO)
        if (!c) setHype(s)
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : 'Hype indisponible')
      }
    })()
    return () => {
      c = true
    }
  }, [])

  const pct = hype ? Math.round(hype.score * 100) : null
  const bar =
    pct == null
      ? '#3f3f46'
      : pct >= 70
        ? '#34d399'
        : pct >= 45
          ? '#a78bfa'
          : '#fb923c'

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Hype · TRO</p>
          <p className="text-sm font-semibold text-white mt-1">TUDURIORIGINAL</p>
        </div>
        <span className="text-[11px] text-zinc-500 font-mono">{TRO}</span>
      </div>

      {err && <p className="text-[12px] text-amber-200">{err}</p>}

      <div className="flex items-end gap-4">
        <p className="text-4xl font-semibold tabular-nums text-white tracking-tight">
          {pct != null ? pct : '—'}
          {pct != null && <span className="text-lg text-zinc-500 font-normal">/100</span>}
        </p>
        <div className="flex-1 min-w-[8rem]">
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct ?? 0}%`, background: bar }}
            />
          </div>
          <p className="text-[10px] text-zinc-600 mt-1.5">
            {hype?.sources.join(' · ') || 'chargement…'}
          </p>
        </div>
      </div>

      <p className="text-[11px] text-zinc-600 leading-relaxed">
        Score paper (on-chain MultiversX + social placeholder). Pas un signal d’achat. Vellum/X =
        couche séparée.
      </p>
    </section>
  )
}
