/** Glassmorphism loader for indexer / signals async fetches. */
export default function GlassLoader({
  label = 'Chargement…',
  compact,
}: {
  label?: string
  compact?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md ${
        compact ? 'px-3 py-2' : 'px-5 py-8'
      }`}
      role="status"
      aria-live="polite"
    >
      <span
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-300"
        aria-hidden
      />
      <span className="text-[12px] text-zinc-400">{label}</span>
    </div>
  )
}
