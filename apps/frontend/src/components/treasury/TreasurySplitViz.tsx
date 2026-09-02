/** T6 Transparency — policy split 40/30/20/10 */
const SLICES = [
  { id: 'mission', label: 'Mission', pct: 40, color: 'bg-purple-500' },
  { id: 'reserve', label: 'Reserve', pct: 30, color: 'bg-blue-500' },
  { id: 'reward', label: 'Reward', pct: 20, color: 'bg-emerald-500' },
  { id: 'ops', label: 'Ops', pct: 10, color: 'bg-amber-500' },
]

export default function TreasurySplitViz() {
  return (
    <div className="card border-white/10 mb-4">
      <h3 className="text-sm font-bold mb-2">Treasury split (policy)</h3>
      <p className="text-[11px] text-gray-500 mb-3">
        Post fee collection · 40/30/20/10 · on-chain after treasury-splitter deploy
      </p>
      <div className="flex h-3 rounded-full overflow-hidden border border-white/10 mb-3">
        {SLICES.map((s) => (
          <div key={s.id} className={s.color} style={{ width: `${s.pct}%` }} title={`${s.label} ${s.pct}%`} />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-2 text-xs">
        {SLICES.map((s) => (
          <li key={s.id} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${s.color}`} />
            <span className="text-gray-400">{s.label}</span>
            <span className="ml-auto font-semibold mono">{s.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
