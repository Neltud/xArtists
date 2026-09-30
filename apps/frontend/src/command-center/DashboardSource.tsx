/**
 * Hidden / offscreen dashboard source for projection (or DOM preview).
 * Data-driven from empireStore + optional pulse label.
 */
import { useEmpireStore, useAgentAccess } from '../store/empireStore'

type Props = {
  sentiment?: number
  className?: string
}

export default function DashboardSource({ sentiment = 0, className = '' }: Props) {
  const empire = useEmpireStore()
  const access = useAgentAccess()
  const bullish = sentiment >= 0

  return (
    <div
      className={`w-[512px] h-[288px] rounded-lg border border-cyan-500/30 bg-[#05050a] p-4 text-left ${className}`}
      data-dashboard-source
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] uppercase tracking-widest text-cyan-300">LIVE · Command</span>
        <span
          className={`text-[10px] font-bold ${bullish ? 'text-amber-300' : 'text-rose-400'}`}
        >
          {bullish ? 'BULLISH' : 'BEARISH'} {(sentiment * 100).toFixed(0)}%
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <Metric label="EGLD" value={empire.wallet.egldBalance ?? '—'} />
        <Metric label="TRO" value={empire.wallet.troBalance ?? '—'} />
        <Metric label="Packs" value={String(access.packs.length)} />
      </div>
      <div className="h-16 flex items-end gap-1 px-1">
        {Array.from({ length: 16 }).map((_, i) => {
          const h = 20 + Math.abs(Math.sin(i * 0.7 + sentiment * 3)) * 40
          return (
            <div
              key={i}
              className="flex-1 rounded-t"
              style={{
                height: `${h}%`,
                background: bullish
                  ? `linear-gradient(to top, #22d3ee, #fbbf24)`
                  : `linear-gradient(to top, #7f1d1d, #f43f5e)`,
                opacity: 0.85,
              }}
            />
          )
        })}
      </div>
      <p className="mt-2 text-[9px] mono text-zinc-600 truncate">
        {empire.wallet.address || 'no wallet'} · gate {access.source}
      </p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/40 py-2">
      <p className="text-[9px] text-zinc-500 uppercase">{label}</p>
      <p className="text-sm font-semibold text-white tabular-nums truncate px-1">{value}</p>
    </div>
  )
}
