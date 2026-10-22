import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * Last paper legs: gate → EV → DecisionProof (no chain sig).
 */
import { useEffect, useState } from 'react'

const RAW = 'https://raw.githubusercontent.com/Neltud/xArtists/main/data/lia_paper_legs.json'

type Leg = {
  ts?: string
  ok?: boolean
  paper?: boolean
  gate?: { decision?: string; confidence?: number; size_usd?: number; source?: string }
  ev?: { expected_value?: number; probability_of_profit?: number; is_viable?: boolean }
  decision_proof?: { decision_id?: string; action_name?: string; amount?: number }
  verification?: string
  reason?: string
}

export default function PaperLegsPanel() {
  const [legs, setLegs] = useState<Leg[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      const urls = [
        `${import.meta.env.BASE_URL}data/lia_paper_legs.json?t=${Date.now()}`,
        `${RAW}?t=${Date.now()}`,
      ]
      for (const url of urls) {
        try {
          const r = await fetch(url, { cache: 'no-store' })
          if (!r.ok) continue
          const j = await r.json()
          const list = Array.isArray(j.legs) ? j.legs : []
          if (!c) {
            setLegs(list.slice(-12).reverse())
            setErr(null)
          }
          return
        } catch {
          /* next */
        }
      }
      if (!c) setErr('paper legs offline')
    })()
    return () => {
      c = true
    }
  }, [])

  return (
    <section className="card mb-8 border-teal-500/20">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-lg font-bold text-teal-100">{xaRender("Paper legs · gate → proof")}</h2>
          <p className="text-[11px] text-zinc-500">
            {xaRender("Chemin executor paper — aucune signature MultiversX ")}</p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-teal-300/80 border border-teal-500/30 rounded-full px-2 py-0.5">
          {xaRender("paper only ")}</span>
      </div>

      {xaRender(err && legs.length === 0 && (
        <p className="text-xs text-amber-400">
          {xaRender(err)} — <code className="text-[10px]">python -m lia.executor.paper_with_proof</code>
        </p>
      ))}

      {xaRender(legs.length === 0 && !err ? (
        <p className="text-sm text-zinc-500">{xaRender("Aucun leg enregistré.")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-[10px] uppercase text-zinc-500 border-b border-[#2a2a3a]">
                <th className="text-left py-2">Ts</th>
                <th className="text-left py-2">{xaRender("Gate")}</th>
                <th className="text-right py-2">{xaRender("Size")}</th>
                <th className="text-right py-2">EV</th>
                <th className="text-left py-2">{xaRender("Proof")}</th>
                <th className="text-left py-2">{xaRender("Verify")}</th>
              </tr>
            </thead>
            <tbody>
              {xaRender(legs.map((leg, i) => (
                <tr key={leg.ts || i} className="border-b border-[#2a2a3a]/40">
                  <td className="py-2 text-[11px] text-zinc-500">
                    {xaRender(leg.ts ? new Date(leg.ts).toLocaleString('fr-FR') : '—')}
                  </td>
                  <td className="py-2">
                    <span className="font-semibold">{xaRender(leg.gate?.decision || (leg.ok ? '—' : 'BLOCK'))}</span>
                    <span className="text-[10px] text-zinc-500 ml-1">
                      {xaRender(leg.gate?.confidence != null
                        ? `${(Number(leg.gate.confidence) * 100).toFixed(0)}%`
                        : '')}
                    </span>
                  </td>
                  <td className="py-2 text-right mono">{xaRender(leg.gate?.size_usd ?? '—')}</td>
                  <td className="py-2 text-right mono text-zinc-300">
                    {xaRender(leg.ev?.expected_value != null
                      ? Number(leg.ev.expected_value).toFixed(2)
                      : '—')}
                  </td>
                  <td className="py-2 text-[11px] mono text-zinc-500">
                    {xaRender((leg.decision_proof?.decision_id || '').slice(0, 10) || '—')}
                    {xaRender(leg.decision_proof?.action_name
                      ? ` · ${leg.decision_proof.action_name}`
                      : '')}
                  </td>
                  <td className="py-2 text-[11px] text-teal-300/90">
                    {xaRender(leg.verification || leg.reason || '—')}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  )
}
