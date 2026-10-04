/** Task 3 — Compact aura indicator (paper stream proxy). */

const STYLES: Record<string, string> = {
  bull: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-100',
  bear: 'bg-rose-500/20 border-rose-400/40 text-rose-100',
  reward: 'bg-amber-500/20 border-amber-400/40 text-amber-100',
  stable: 'bg-cyan-500/20 border-cyan-400/40 text-cyan-100',
  risk: 'bg-orange-500/20 border-orange-400/40 text-orange-100',
}

export default function AuraBadge({
  mode,
  trend,
}: {
  mode: string
  trend?: string
}) {
  const cls = STYLES[mode] || 'bg-white/5 border-white/15 text-zinc-300'
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 ${cls}`}
      title="Aura paper — dérivée du pulse / stratégie, pas un ordre live"
    >
      <span
        className="h-2 w-2 rounded-full bg-current animate-pulse"
        aria-hidden
      />
      <span className="text-[11px] font-semibold uppercase tracking-wider">
        Aura {mode}
        {trend ? ` · ${trend}` : ''}
      </span>
    </div>
  )
}
