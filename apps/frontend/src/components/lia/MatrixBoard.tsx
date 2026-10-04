/**
 * Board léger — matrice 10 colonnes (perception LIA).
 * Paper / pédagogique : pas un signal d’ordre live.
 *
 * Colonnes : TIMEFRAME · PRICE · VOL · LIQ · RCE · SENT · TREND · DIST · CONF · STATE
 * RCE = Real Capital Engaged (capital réel engagé, ici proxy EGLD/USD protocole)
 */
import { useEffect, useState } from 'react'
import { matrixFromPulse, runDecisionCycle } from '../../lia/decisionCycle'
import { fetchEgldPrice } from '../../lia/priceTick'
import { fetchProtocolProfile } from '../../lia/protocolProfile'
import type { Matrix10 } from '../../lia/types'
import { asText } from '../../lib/safeRender'

const COLS: { key: keyof Matrix10 | 'assetId'; label: string; tip: string }[] = [
  { key: 'timeframe', label: 'TF', tip: 'Timeframe — échelle de temps (ex. H1 = 1 heure)' },
  { key: 'price', label: 'Prix', tip: 'Prix de référence' },
  { key: 'volatility', label: 'Vol', tip: 'Volatilité 0–1' },
  { key: 'liquidity', label: 'Liq', tip: 'Liquidité relative 0–1' },
  { key: 'rce', label: 'RCE', tip: 'Real Capital Engaged — proxy capital protocole' },
  { key: 'sentiment', label: 'Sent', tip: 'Sentiment 0–1' },
  { key: 'trend', label: 'Trend', tip: 'Tendance UP / DOWN / SIDEWAYS' },
  { key: 'distance', label: 'Dist', tip: 'Distance aux moyennes / extrêmes' },
  { key: 'confidence', label: 'Conf', tip: 'Confiance du modèle 0–1' },
  { key: 'assetState', label: 'État', tip: 'État de l’actif (Liquid, etc.)' },
]

function cell(m: Matrix10, key: (typeof COLS)[0]['key']): string {
  const v = m[key as keyof Matrix10]
  if (typeof v === 'number') {
    if (key === 'price' || key === 'rce') return v >= 1000 ? v.toFixed(0) : v.toFixed(2)
    if (v <= 1 && v >= 0 && key !== 'price') return v.toFixed(2)
    return String(v)
  }
  return asText(v)
}

export default function MatrixBoard() {
  const [rows, setRows] = useState<{ matrix: Matrix10; strategy: string; reason: string }[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      try {
        const [px, prof] = await Promise.all([fetchEgldPrice(true), fetchProtocolProfile()])
        const assets = [
          { id: 'EGLD', sentiment: 0.1, vol: 0.35 },
          { id: 'TRO', sentiment: 0.05, vol: 0.55 },
          { id: 'BTC', sentiment: 0.08, vol: 0.28 },
        ]
        const built = assets.map(a => {
          const matrix = matrixFromPulse({
            assetId: a.id,
            price: a.id === 'EGLD' ? px.priceUsd : a.id === 'BTC' ? px.priceUsd * 15 : 0.0001,
            sentiment: a.sentiment,
            volatility: a.vol,
            confidence: 0.55,
            rce: prof.egldUsd || 0,
          })
          const cycle = runDecisionCycle(matrix, { executeShadow: false })
          return { matrix, strategy: cycle.strategy, reason: cycle.reason }
        })
        if (!c) setRows(built)
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : 'matrix unavailable')
      }
    })()
    return () => {
      c = true
    }
  }, [])

  return (
    <section className="rounded-2xl border border-cyan-500/15 bg-cyan-500/[0.03] p-4 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-300/90 font-semibold">
            Matrice 10 colonnes · paper
          </p>
          <p className="text-[12px] text-zinc-500 mt-0.5 max-w-xl">
            Perception LIA (lecture seule). Pas un ordre automatique. RCE = Real Capital Engaged.
          </p>
        </div>
      </div>
      {err && <p className="text-[12px] text-amber-200">{asText(err)}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] min-w-[640px]">
          <thead>
            <tr className="text-zinc-500 border-b border-white/10">
              <th className="text-left py-2 pr-2">Actif</th>
              {COLS.map(col => (
                <th key={col.key} className="text-right py-2 px-1" title={col.tip}>
                  {col.label}
                </th>
              ))}
              <th className="text-left py-2 pl-2">Strat paper</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.matrix.assetId} className="border-b border-white/5 text-zinc-300">
                <td className="py-2 pr-2 font-semibold text-white">{asText(r.matrix.assetId)}</td>
                {COLS.map(col => (
                  <td key={col.key} className="text-right py-2 px-1 mono tabular-nums">
                    {cell(r.matrix, col.key)}
                  </td>
                ))}
                <td className="py-2 pl-2 text-cyan-200/90" title={asText(r.reason)}>
                  {asText(r.strategy).replace(/^STRAT_/, '')}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !err && (
              <tr>
                <td colSpan={12} className="py-6 text-center text-zinc-500">
                  Chargement matrice…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
