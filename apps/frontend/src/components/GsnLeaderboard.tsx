import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
import { useEffect, useState } from 'react'

const RAW =
  'https://raw.githubusercontent.com/Neltud/xArtists/main/data/greensmoke_forecasts.json'

type Row = { id: string; name: string; domain: string; confidence: number }

/**
 * External GreenSmoke top agents — advisory score for LIA pre-trade.
 * NOT LIA sub-agent packs for sale.
 */
export default function GsnLeaderboard() {
  const [rows, setRows] = useState<Row[]>([])
  const [score, setScore] = useState<number | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch(RAW + '?t=' + Date.now())
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const data = await r.json()
        const agents = data.agents || {}
        const list: Row[] = Object.entries(agents).map(([id, a]: [string, any]) => {
          let conf = Number(a.confidence_avg || 0)
          if (conf > 1) conf = conf / 100
          return {
            id,
            name: a.name || id,
            domain: a.domain || a.domain_fr || '',
            confidence: conf,
          }
        })
        list.sort((a, b) => b.confidence - a.confidence)
        const top = list.slice(0, 5)
        const avg = top.length ? top.reduce((s, x) => s + x.confidence, 0) / top.length : 0
        const w = Math.min(0.3, avg * 0.3)
        if (!cancelled) {
          setRows(list.slice(0, 10))
          setScore(w)
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'fetch failed')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="card border-emerald-500/20 mb-6">
      <h3 className="font-bold text-sm text-emerald-200 mb-1">{xaRender("GSN Leaderboard → score pré-trade LIA")}</h3>
      <p className="text-[11px] text-gray-500 mb-3">
        {xaRender("Agents ")}<strong>{xaRender("prévisionnels externes")}</strong> {xaRender(" (GreenSmoke). Poids max ~30 %. Ne sont")}{xaRender(' ')}
        <strong>{xaRender("pas")}</strong> {xaRender(" les Agent Packs NFT (5–25 €). ")}</p>
      {xaRender(err && <p className="text-xs text-red-400">{xaRender(err)}</p>)}
      {xaRender(score != null && (
        <p className="text-xs mb-2">
          {xaRender("Score advisory : ")}<strong className="text-emerald-300">{xaRender((score * 100).toFixed(1))} %</strong> {xaRender(" du poids max signal GSN ")}</p>
      ))}
      <ul className="space-y-1.5">
        {xaRender(rows.map((r, i) => (
          <li
            key={r.id}
            className="flex justify-between text-xs p-2 rounded-lg bg-[#111118] border border-[#2a2a3a]"
          >
            <span>
              #{xaRender(i + 1)} {xaRender(r.name)}{xaRender(' ')}
              <span className="text-gray-500">{xaRender(r.domain)}</span>
            </span>
            <span className="font-mono text-emerald-400">{xaRender((r.confidence * 100).toFixed(0))}%</span>
          </li>
        )))}
      </ul>
    </div>
  )
}
