/** Matrice 10 colonnes — paper display, enfants React toujours string. */
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
  if (key === 'assetId') return asText(m.assetId)
  const v = m[key as keyof Matrix10]
  if (typeof v === 'number') {
    if (key === 'price' || key === 'rce') return asText(v.toFixed(v >= 100 ? 2 : 4))
    if (v <= 1 && v >= 0) return asText((v * 100).toFixed(0) + '%')
    return asText(v.toFixed(2))
  }
  return asText(v)
}

export default function MatrixBoard() {
  const [rows, setRows] = useState<{ matrix: Matrix10; strategy: string; reason: string }[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [px, profile] = await Promise.all([
          fetchEgldPrice(true),
          fetchProtocolProfile().catch(() => null),
        ])
        const assets = [
          { id: 'EGLD', sentiment: 0.1, vol: 0.35 },
          { id: 'TRO', sentiment: 0.05, vol: 0.55 },
          { id: 'BTC', sentiment: 0.08, vol: 0.28 },
        ]
        const built = assets.map(a => {
          const matrix = matrixFromPulse({
            assetId: a.id,
            price: a.id === 'EGLD' ? px.priceUsd : px.priceUsd * (a.id === 'TRO' ? 0.001 : 20),
            sentiment: a.sentiment,
            volatility: a.vol,
            confidence: 0.55,
            rce: profile?.egldUsd || 0,
          })
          const cycle = runDecisionCycle(matrix, { executeShadow: false })
          return {
            matrix,
            strategy: asText(cycle.strategy),
            reason: asText(cycle.reason),
          }
        })
        if (!cancelled) setRows(built)
      } catch (e) {
        if (!cancelled) setErr(asText(e, 'Matrice indisponible'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="card space-y-3 overflow-x-auto">
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400 font-semibold">
          Matrice 10 colonnes
        </p>
        <p className="text-[12px] text-zinc-500 mt-0.5 max-w-xl">
          Vue recherche (simulée) — pas un conseil d’investissement.
        </p>
      </div>
      {err && <p className="text-[12px] text-amber-200">{asText(err)}</p>}
      <table className="w-full text-[11px] min-w-[640px]">
        <thead>
          <tr className="text-zinc-500 border-b border-white/10">
            <th className="text-left py-2 px-1">Actif</th>
            {COLS.map(col => (
              <th key={col.key} className="text-right py-2 px-1" title={col.tip}>
                {col.label}
              </th>
            ))}
            <th className="text-right py-2 px-1">Strat</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={asText(r.matrix.assetId)} className="border-b border-white/5">
              <td className="py-2 px-1 font-semibold text-white">{asText(r.matrix.assetId)}</td>
              {COLS.map(col => (
                <td key={col.key} className="text-right py-2 px-1 mono text-zinc-300">
                  {cell(r.matrix, col.key)}
                </td>
              ))}
              <td className="text-right py-2 px-1 text-cyan-200/90 truncate max-w-[8rem]" title={r.reason}>
                {asText(r.strategy).replace(/^STRAT_/, '')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
