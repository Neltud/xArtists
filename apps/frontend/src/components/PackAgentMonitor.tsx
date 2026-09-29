/**
 * Moniteur agent IA pour une salle holder — clone LIA rewards (paper).
 * Pas d execution autonome de fonds utilisateur.
 */
import { useEffect, useMemo, useState } from 'react'
import type { PackId } from '../config/agentPacks'
import { AGENT_PACKS } from '../config/agentPacks'

type Props = { packId: PackId }

type SignalRow = {
  id: string
  kind: string
  detail: string
  ts: string
  score: number
}

const STRATEGY_POOL: Record<PackId, string[]> = {
  pulse: ['MICRO_ARB', 'MOMENTUM', 'MEAN_REVERSION', 'BOARD_TICK'],
  yield: ['YIELD_CLAIM', 'LP_REBALANCE', 'COMPOUND', 'HATOM_VIEW'],
  sentinel: ['GUARD_ALERT', 'RISK_SLEEVE', 'DRAWDOWN_WATCH', 'BOARD_ALERT'],
}

function seedSignals(packId: PackId): SignalRow[] {
  const pool = STRATEGY_POOL[packId]
  const now = Date.now()
  return pool.slice(0, 4).map((kind, i) => ({
    id: `${packId}-${i}`,
    kind,
    detail: i % 2 === 0 ? 'signal paper · a valider' : 'clone LIA · lecture seule',
    ts: new Date(now - i * 90_000).toISOString().slice(11, 19),
    score: 62 + ((i * 11 + packId.length * 3) % 28),
  }))
}

export default function PackAgentMonitor({ packId }: Props) {
  const pack = AGENT_PACKS.find(p => p.id === packId)!
  const [signals, setSignals] = useState(() => seedSignals(packId))
  const [cloneShareBps, setCloneShareBps] = useState(0)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    setSignals(seedSignals(packId))
    setCloneShareBps(0)
  }, [packId])

  // Paper heartbeat — pas de TX
  useEffect(() => {
    const id = window.setInterval(() => {
      setTick(t => t + 1)
      setSignals(prev => {
        const pool = STRATEGY_POOL[packId]
        const kind = pool[Math.floor(Math.random() * pool.length)]
        const row: SignalRow = {
          id: `${packId}-${Date.now()}`,
          kind,
          detail: 'clone LIA · paper reward tick',
          ts: new Date().toISOString().slice(11, 19),
          score: 55 + Math.floor(Math.random() * 40),
        }
        return [row, ...prev].slice(0, 8)
      })
      // Accrual paper de part pool (bps fictifs affichage)
      setCloneShareBps(b => Math.min(pack.shareOfPackPoolBps, b + 1))
    }, 12_000)
    return () => window.clearInterval(id)
  }, [packId, pack.shareOfPackPoolBps])

  const perf = useMemo(() => {
    if (!signals.length) return 0
    return Math.round(signals.reduce((s, r) => s + r.score, 0) / signals.length)
  }, [signals])

  return (
    <section className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-cyan-300/80 font-semibold">
            Moniteur agent · {pack.name}
          </p>
          <p className="text-sm text-white font-medium mt-0.5">
            Clone LIA · rewards paper
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-white tabular-nums">{perf}%</p>
          <p className="text-[10px] text-zinc-500">score paper · tick {tick}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
          <p className="text-zinc-500">Strategies</p>
          <p className="text-zinc-200 mt-0.5">{pack.strategies.join(' · ')}</p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
          <p className="text-zinc-500">Part pool (cap)</p>
          <p className="text-zinc-200 mt-0.5">
            {cloneShareBps} / {pack.shareOfPackPoolBps} bps paper
          </p>
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">Journal signaux</p>
        <ul className="space-y-1.5 max-h-48 overflow-y-auto">
          {signals.map(s => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-[11px]"
            >
              <div className="min-w-0">
                <span className="text-cyan-200/90 font-medium">{s.kind}</span>
                <span className="text-zinc-600 ml-2">{s.detail}</span>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-zinc-400 tabular-nums">{s.score}</span>
                <span className="text-zinc-600 ml-2 mono">{s.ts}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[10px] text-zinc-600 leading-relaxed">
        Paper only — pas un rendement. Clone LIA partage les <em>signaux</em> et un compteur de part
        pool ; les fonds restent sous ta signature.
      </p>
    </section>
  )
}
