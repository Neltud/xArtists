/**
 * Dashboard metrics — reactive to empireStore + agent packs + pulse sentiment.
 * Used as DOM preview + source of truth for ProjectionBridge numbers.
 */
import { useEmpireStore, useAgentAccess } from '../store/empireStore'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { getAppMode } from '../lib/appMode'

type Props = {
  sentiment?: number
  className?: string
}

export default function DashboardSource({ sentiment = 0, className = '' }: Props) {
  const empire = useEmpireStore()
  const access = useAgentAccess()
  const mode = getAppMode()
  const bullish = sentiment >= 0

  return (
    <div
      className={`w-full max-w-[640px] rounded-xl border border-cyan-500/30 bg-[#05050a] p-4 text-left ${className}`}
      data-dashboard-source
    >
      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
        <span className="text-[10px] uppercase tracking-widest text-cyan-300">
          LIVE · Command · {mode.toUpperCase()}
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
        <Metric label="EGLD" value={fmt(empire.wallet.egldBalance)} />
        <Metric label="TRO" value={fmt(empire.wallet.troBalance)} />
        <Metric label="Packs" value={String(access.packs.length)} />
        <Metric label="Gate" value={access.source} />
      </div>

      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Agents IA</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        {AGENT_PACKS.map(p => {
          const owned = access.packs.includes(p.id as PackId)
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
                <span className="text-lg">{p.icon}</span>
                <div className="min-w-0">
                  <p className={`text-xs font-bold ${p.color}`}>{p.name}</p>
                  <p className="text-[9px] text-zinc-500 truncate">{p.tagline}</p>
                </div>
              </div>
              <p className="text-[9px] mt-1 text-zinc-500">
                signal {p.signalIntensity}/3 · {owned ? 'OWNED' : 'locked'}
              </p>
            </div>
          )
        })}
      </div>

      <div className="h-20 flex items-end gap-1 px-0.5">
        {Array.from({ length: 20 }).map((_, i) => {
          const h = 18 + Math.abs(Math.sin(i * 0.55 + sentiment * 3)) * 55
          return (
            <div
              key={i}
              className="flex-1 rounded-t min-w-[4px]"
              style={{
                height: `${h}%`,
                background: bullish
                  ? `linear-gradient(to top, #22d3ee, #fbbf24)`
                  : `linear-gradient(to top, #7f1d1d, #f43f5e)`,
                opacity: 0.9,
              }}
            />
          )
        })}
      </div>

      <p className="mt-2 text-[9px] mono text-zinc-600 truncate">
        {(empire.wallet.address || 'no wallet').slice(0, 28)} · flags stake=
        {empire.flags.canStakeTro ? '1' : '0'} market={empire.flags.canListBuyNft ? '1' : '0'}
      </p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/40 py-2 px-1">
      <p className="text-[9px] text-zinc-500 uppercase">{label}</p>
      <p className="text-sm font-semibold text-white tabular-nums truncate">{value}</p>
    </div>
  )
}

function fmt(v: string | null | undefined): string {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (!Number.isFinite(n)) return String(v).slice(0, 10)
  return n >= 100 ? n.toFixed(2) : n.toFixed(4)
}
