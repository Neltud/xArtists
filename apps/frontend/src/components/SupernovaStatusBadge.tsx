/** Badge live Supernova — stats API MultiversX */
import { useSupernovaStats } from '../hooks/useSupernovaStats'
import { SUPERNOVA_HUB } from '../config/supernova'

export default function SupernovaStatusBadge({ className = '' }: { className?: string }) {
  const { stats, label, isSupernova, loading } = useSupernovaStats(45_000)

  return (
    <a
      href={SUPERNOVA_HUB}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${
        isSupernova
          ? 'border-cyan-400/35 bg-cyan-950/40 text-cyan-200 hover:border-cyan-300/50'
          : 'border-amber-500/30 bg-amber-950/30 text-amber-100'
      } ${className}`}
      title={stats ? `blocks ${stats.blocks.toLocaleString()} · txs ${stats.transactions.toLocaleString()}` : ''}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isSupernova ? 'bg-cyan-400 animate-pulse' : 'bg-amber-400'}`}
        aria-hidden
      />
      {loading && !stats ? 'Network…' : label}
    </a>
  )
}
