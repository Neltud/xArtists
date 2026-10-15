/**
 * Dashboard source strip — live metrics + agent pack gates.
 */
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { useAgentAccess, useEmpireWallet } from '../store/empireStore'
import { getAppMode } from '../lib/appMode'
import { usePulse } from '../hooks/usePulse'

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/40 px-2 py-2">
      <p className="text-[9px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="text-sm font-semibold text-white tabular-nums">{value}</p>
    </div>
  )
}

function fmt(n: number | undefined | null): string {
  if (n == null || !Number.isFinite(n)) return '—'
  if (Math.abs(n) >= 1000) return n.toFixed(0)
  if (Math.abs(n) >= 1) return n.toFixed(2)
  return n.toFixed(4)
}

export default function DashboardSource({ className = '' }: { className?: string }) {
  const empire = useEmpireWallet()
  const access = useAgentAccess()
  const { env } = usePulse()
  const sentiment = typeof env?.sentiment === 'number' ? env.sentiment : 0
  const mode = getAppMode?.() ?? 'paper'
  const bullish = sentiment >= 0

  return (
    <div
      className={`w-full max-w-[640px] rounded-xl border border-cyan-500/30 bg-[#05050a] p-4 text-left ${className}`}
      data-dashboard-source
    >
      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
        <span className="text-[10px] uppercase tracking-widest text-cyan-300">
          LIVE · Command · {(mode ?? 'paper').toString().toUpperCase()}
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            bullish
              ? 'text-amber-300 border-amber-500/40 bg-amber-500/10'
              : 'text-rose-300 border-rose-500/40 bg-rose-500/10'
          }`}
        >
          {bullish ? 'BULLISH' : 'BEARISH'} {(sentiment * 100).toFixed(0)}%
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mb-4">
        <Metric label="EGLD" value={fmt(empire?.egldBalance)} />
        <Metric label="TRO" value={fmt(empire?.troBalance)} />
        <Metric label="Packs" value={String(access?.packs?.length ?? 0)} />
        <Metric label="Gate" value={access?.source ?? '—'} />
      </div>

      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Agents IA</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        {AGENT_PACKS.map(p => {
          const owned = Boolean(access?.packs?.includes(p.id as PackId))
          return (
            <div
              key={p.id}
              className={`rounded-lg border px-3 py-2 ${
                owned
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-white/8 bg-black/30 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{p.emoji || '◎'}</span>
                <span className="text-[12px] font-medium text-white">{p.label}</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5">{owned ? 'détenu' : 'verrouillé'}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
