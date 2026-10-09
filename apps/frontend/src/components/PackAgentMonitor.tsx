/**
 * Moniteur agent — max data: tableur signaux, KPI, spark, stratégies.
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
  bias: 'LONG' | 'SHORT' | 'FLAT'
}

const STRATEGY_POOL: Record<PackId, string[]> = {
  pulse: ['MICRO_ARB', 'MOMENTUM', 'MEAN_REVERSION', 'BOARD_TICK', 'FLOW', 'PULSE_EDGE'],
  yield: ['YIELD_CLAIM', 'LP_REBALANCE', 'COMPOUND', 'HATOM_VIEW', 'FEE_SWEEP'],
  sentinel: ['GUARD_ALERT', 'RISK_SLEEVE', 'DRAWDOWN_WATCH', 'BOARD_ALERT', 'VOL_SPIKE'],
}

function seedSignals(packId: PackId): SignalRow[] {
  const pool = STRATEGY_POOL[packId]
  const now = Date.now()
  return pool.map((kind, i) => {
    const score = 58 + ((i * 13 + packId.length * 5) % 35)
    return {
      id: `${packId}-${i}`,
      kind,
      detail: i % 2 === 0 ? 'paper · à valider' : 'clone LIA · lecture',
      ts: new Date(now - i * 75_000).toISOString().slice(11, 19),
      score,
      bias: score > 78 ? 'LONG' : score < 62 ? 'SHORT' : 'FLAT',
    }
  })
}

export default function PackAgentMonitor({ packId }: Props) {
  const pack = AGENT_PACKS.find(p => p.id === packId)!
  const [signals, setSignals] = useState(() => seedSignals(packId))
  const [cloneShareBps, setCloneShareBps] = useState(12)
  const [tick, setTick] = useState(0)
  const [egld, setEgld] = useState<number | null>(null)

  useEffect(() => {
    setSignals(seedSignals(packId))
    setCloneShareBps(12)
  }, [packId])

  useEffect(() => {
    let c = false
    ;(async () => {
      try {
        const r = await fetch('https://api.multiversx.com/economics', { cache: 'no-store' })
        if (r.ok) {
          const j = await r.json()
          if (!c) setEgld(Number(j.price) || null)
        }
      } catch {
        /* */
      }
    })()
    return () => {
      c = true
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick(t => t + 1)
      setSignals(prev => {
        const pool = STRATEGY_POOL[packId]
        const kind = pool[Math.floor(Math.random() * pool.length)]
        const score = 55 + Math.floor(Math.random() * 40)
        const row: SignalRow = {
          id: `${packId}-${Date.now()}`,
          kind,
          detail: 'clone LIA · paper tick',
          ts: new Date().toISOString().slice(11, 19),
          score,
          bias: score > 78 ? 'LONG' : score < 62 ? 'SHORT' : 'FLAT',
        }
        return [row, ...prev].slice(0, 12)
      })
      setCloneShareBps(b => Math.min(pack.shareOfPackPoolBps, b + 1))
    }, 10_000)
    return () => window.clearInterval(id)
  }, [packId, pack.shareOfPackPoolBps])

  const perf = useMemo(() => {
    if (!signals.length) return 0
    return Math.round(signals.reduce((s, r) => s + r.score, 0) / signals.length)
  }, [signals])

  const longN = signals.filter(s => s.bias === 'LONG').length
  const shortN = signals.filter(s => s.bias === 'SHORT').length

  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-950/20 to-black/40 p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-cyan-300/80 font-semibold">
            Moniteur · {pack.name} · {pack.tierLabel}
          </p>
          <p className="text-sm text-white font-medium mt-0.5">Clone LIA · data dense · paper</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white tabular-nums">{perf}</p>
          <p className="text-[10px] text-zinc-500">score moyen · tick {tick}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
          <p className="text-zinc-500">EGLD</p>
          <p className="text-white font-semibold tabular-nums">
            {egld != null ? `$${egld.toFixed(2)}` : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
          <p className="text-zinc-500">LONG / SHORT</p>
          <p className="text-white font-semibold tabular-nums">
            <span className="text-emerald-400">{longN}</span>
            {' / '}
            <span className="text-rose-400">{shortN}</span>
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
          <p className="text-zinc-500">Part pool</p>
          <p className="text-white font-semibold tabular-nums">
            {cloneShareBps}/{pack.shareOfPackPoolBps} bps
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
          <p className="text-zinc-500">Intensité</p>
          <p className="text-white font-semibold">×{pack.signalIntensity}</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] mono min-w-[480px]">
            <thead>
              <tr className="bg-white/[0.04] text-zinc-500 text-left">
                <th className="px-2 py-1.5">#</th>
                <th className="px-2 py-1.5">Signal</th>
                <th className="px-2 py-1.5">Score</th>
                <th className="px-2 py-1.5">Bias</th>
                <th className="px-2 py-1.5">UTC</th>
                <th className="px-2 py-1.5">Note</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((s, i) => (
                <tr key={s.id} className="border-t border-white/[0.05]">
                  <td className="px-2 py-1.5 text-zinc-600">{String(i + 1).padStart(2, '0')}</td>
                  <td className="px-2 py-1.5 text-cyan-200/90 font-medium">{s.kind}</td>
                  <td className="px-2 py-1.5 tabular-nums text-zinc-200">{s.score}</td>
                  <td
                    className={`px-2 py-1.5 font-semibold ${
                      s.bias === 'LONG'
                        ? 'text-emerald-400'
                        : s.bias === 'SHORT'
                          ? 'text-rose-400'
                          : 'text-zinc-500'
                    }`}
                  >
                    {s.bias}
                  </td>
                  <td className="px-2 py-1.5 text-zinc-500">{s.ts}</td>
                  <td className="px-2 py-1.5 text-zinc-600 truncate max-w-[120px]">{s.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {pack.strategies.map(s => (
          <span
            key={s}
            className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] mono text-zinc-400"
          >
            {s}
          </span>
        ))}
      </div>

      <p className="text-[10px] text-zinc-600 leading-relaxed">
        Paper only — pas un rendement. Signaux + part pool affichés ; fonds sous ta signature.
      </p>
    </section>
  )
}
