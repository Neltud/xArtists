/**
 * Brain cycle snapshot — EV, meta swarm, optional DecisionProof (paper).
 */
import { useEffect, useState } from 'react'

const RAW = 'https://raw.githubusercontent.com/Neltud/xArtists/main/data/lia_brain_cycle.json'

interface BrainCycle {
  ts?: string
  paper?: boolean
  ev?: {
    expected_value?: number
    probability_of_profit?: number
    max_loss?: number
    is_viable?: boolean
  }
  meta?: {
    volatility?: number
    primary?: string
    secondary?: string
  }
  portfolio?: {
    current_vol_proxy?: number
    rebalance?: boolean
    plan?: string
  }
  conquest?: {
    net_profit?: number
    viable?: boolean
    source?: string
    dest?: string
  }
  decision_proof?: {
    verification?: string
    proof?: {
      decision_id?: string
      action_name?: string
      amount?: number
      paper?: boolean
    }
  }
  note?: string
}

export default function BrainCyclePanel() {
  const [data, setData] = useState<BrainCycle | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      try {
        const r = await fetch(`${RAW}?t=${Date.now()}`, { cache: 'no-store' })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const j = (await r.json()) as BrainCycle
        if (!c) setData(j)
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : 'offline')
      }
    })()
    return () => {
      c = true
    }
  }, [])

  const ev = data?.ev
  const proof = data?.decision_proof

  return (
    <section className="card mb-6 border-indigo-500/25">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <h2 className="text-lg font-bold text-indigo-200">Brain cycle · EV + DecisionProof</h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Monte-Carlo · Meta Predator/Harvester · preuve paper (pas un SNARK live)
          </p>
        </div>
        {data?.ts && (
          <span className="text-[10px] text-zinc-500">
            {new Date(data.ts).toLocaleString('fr-FR')}
          </span>
        )}
      </div>

      {err && !data && (
        <p className="text-xs text-amber-400">
          Pas de cycle publié — <code className="text-[10px]">python -m lia.brain.cycle</code>
        </p>
      )}

      {data && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg border border-white/5 bg-black/30 p-3">
            <p className="text-[10px] uppercase text-zinc-500">EV</p>
            <p className="font-mono font-semibold mt-1">
              {ev?.expected_value != null ? `$${ev.expected_value.toFixed(2)}` : '—'}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              P(profit){' '}
              {ev?.probability_of_profit != null
                ? `${(ev.probability_of_profit * 100).toFixed(1)}%`
                : '—'}
            </p>
            <span
              className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full border ${
                ev?.is_viable
                  ? 'border-green-500/40 text-green-300'
                  : 'border-zinc-600 text-zinc-400'
              }`}
            >
              {ev?.is_viable ? 'viable' : 'rejected'}
            </span>
          </div>

          <div className="rounded-lg border border-white/5 bg-black/30 p-3">
            <p className="text-[10px] uppercase text-zinc-500">Meta swarm</p>
            <p className="font-semibold mt-1 text-purple-200">{data.meta?.primary || '—'}</p>
            <p className="text-[11px] text-zinc-500">scale back {data.meta?.secondary || '—'}</p>
            <p className="text-[11px] text-zinc-500 mt-1">
              vol {data.meta?.volatility != null ? data.meta.volatility.toFixed(2) : '—'}
            </p>
          </div>

          <div className="rounded-lg border border-white/5 bg-black/30 p-3">
            <p className="text-[10px] uppercase text-zinc-500">Portfolio</p>
            <p className="font-semibold mt-1">{data.portfolio?.plan || '—'}</p>
            <p className="text-[11px] text-zinc-500">
              exposure {data.portfolio?.current_vol_proxy?.toFixed(2) ?? '—'} ·{' '}
              {data.portfolio?.rebalance ? 'rebalance' : 'hold'}
            </p>
          </div>

          <div className="rounded-lg border border-white/5 bg-black/30 p-3">
            <p className="text-[10px] uppercase text-zinc-500">DecisionProof</p>
            {proof ? (
              <>
                <p className="font-semibold mt-1 text-teal-200">{proof.verification || '—'}</p>
                <p className="text-[10px] text-zinc-500 mono truncate mt-1" title={proof.proof?.decision_id}>
                  {proof.proof?.action_name || '—'} · {(proof.proof?.decision_id || '').slice(0, 12)}…
                </p>
                <span className="text-[10px] text-amber-300/90">paper commitment</span>
              </>
            ) : (
              <p className="text-zinc-500 mt-1 text-xs">Aucun (EV non viable)</p>
            )}
          </div>
        </div>
      )}

      {data?.conquest && (
        <p className="text-[11px] text-zinc-500 mt-3">
          Conquest {data.conquest.source}→{data.conquest.dest} · net $'
          {data.conquest.net_profit?.toFixed?.(2) ?? data.conquest.net_profit} ·{' '}
          {data.conquest.viable ? 'viable' : 'skip'}
        </p>
      )}
    </section>
  )
}
