import { useEffect, useState } from 'react'

type Action = {
  imbalance?: { source_chain?: string; target_chain?: string; asset?: string; imbalance_score?: number }
  cost_usd_stub?: number
  potential_gain_stub?: number
  profitable?: boolean
  executed?: boolean
  reason?: string
}

/** Paper liquidity cycle readout for Trading / ops. */
export default function LiquidityPanel() {
  const [actions, setActions] = useState<Action[]>([])
  const [updated, setUpdated] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const urls = [
      `${import.meta.env.BASE_URL}data/liquidity_cycle.json`,
      'https://raw.githubusercontent.com/Neltud/xArtists/main/data/liquidity_cycle.json',
    ]
    ;(async () => {
      for (const url of urls) {
        try {
          const r = await fetch(`${url}?t=${Date.now()}`)
          if (!r.ok) continue
          const j = await r.json()
          if (cancelled) return
          setActions(Array.isArray(j.actions) ? j.actions : [])
          setUpdated(j.updated || null)
          return
        } catch {
          /* next */
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="card border-cyan-500/20 mb-6">
      <h3 className="text-sm font-bold text-cyan-200 mb-1">Liquidity Orchestrator (paper)</h3>
      <p className="text-[11px] text-zinc-500 mb-3">
        Cycle rebalance — aucune bridge live. {updated && <>MAJ {new Date(updated).toLocaleString('fr-FR')}</>}
      </p>
      {actions.length === 0 && <p className="text-xs text-zinc-600">Aucune action paper chargée.</p>}
      <ul className="space-y-2">
        {actions.map((a, i) => (
          <li
            key={i}
            className="text-xs rounded-lg border border-white/5 bg-black/30 px-3 py-2 flex flex-wrap gap-2 justify-between"
          >
            <span className="text-zinc-300">
              {a.imbalance?.asset} {a.imbalance?.source_chain} → {a.imbalance?.target_chain}
            </span>
            <span className={a.profitable ? 'text-emerald-400' : 'text-zinc-500'}>
              {a.profitable ? 'profitable (stub)' : 'skip'} · exec={String(a.executed)}
            </span>
            <span className="w-full text-zinc-600">{a.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
