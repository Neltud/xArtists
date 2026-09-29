/** Bandeau Cerveau — mood Grok/LIA visible Corps */
import { useBrainMood } from '../hooks/useBrainMood'

const LABEL: Record<string, string> = {
  neutral: 'neutre',
  hype: 'hype',
  crash: 'risk-off',
  calm: 'calme',
  alert: 'alerte',
}

export default function BrainMoodStrip() {
  const p = useBrainMood()
  const pct = Math.round(((p.score + 1) / 2) * 100)

  return (
    <div
      className="hidden sm:flex items-center gap-2 px-3 py-1 text-[10px] border-b border-white/[0.04] bg-black/20"
      title={p.note}
    >
      <span className="uppercase tracking-wider text-zinc-600 font-semibold">Cerveau</span>
      <span
        className={`rounded-full px-2 py-0.5 font-medium ${
          p.mood === 'hype'
            ? 'bg-emerald-500/20 text-emerald-200'
            : p.mood === 'crash'
              ? 'bg-red-500/20 text-red-200'
              : p.mood === 'alert'
                ? 'bg-amber-500/20 text-amber-200'
                : 'bg-violet-500/15 text-violet-200'
        }`}
      >
        {LABEL[p.mood] || p.mood}
      </span>
      <span className="text-zinc-600 mono">{p.score.toFixed(2)}</span>
      <span className="flex-1 max-w-[6rem] h-1 rounded-full bg-white/5 overflow-hidden">
        <span
          className="block h-full rounded-full bg-violet-400/60 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="text-zinc-700">{p.source}</span>
    </div>
  )
}
