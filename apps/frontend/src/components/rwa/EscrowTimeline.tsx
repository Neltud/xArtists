/** T7 RWA — presentational state machine. No funds until SC live. */
const STEPS = ['INITIATED', 'LOCKED', 'SHIPPED', 'DELIVERED', 'VERIFIED', 'SETTLED'] as const
export type EscrowStep = (typeof STEPS)[number]

export default function EscrowTimeline({
  current = 'INITIATED',
  disputed = false,
}: {
  current?: EscrowStep
  disputed?: boolean
}) {
  const idx = STEPS.indexOf(current)
  return (
    <div className="card border-white/10 mb-4">
      <h3 className="text-sm font-bold mb-2">RWA escrow timeline</h3>
      {disputed && (
        <p className="text-xs text-red-400 mb-2" role="alert">
          DISPUTED — cooling / resolution path
        </p>
      )}
      <ol className="flex flex-wrap gap-1 text-[10px] sm:text-xs">
        {STEPS.map((s, i) => {
          const done = i <= idx && !disputed
          const active = i === idx && !disputed
          return (
            <li
              key={s}
              className={`px-2 py-1 rounded border ${
                active
                  ? 'border-purple-400 bg-purple-500/20 text-purple-100'
                  : done
                    ? 'border-emerald-500/30 text-emerald-300'
                    : 'border-white/10 text-gray-500'
              }`}
            >
              {s}
            </li>
          )
        })}
      </ol>
      <p className="text-[10px] text-gray-500 mt-2">
        Pre-mainnet UI · SC rwa-escrow-bridge not live — no user funds
      </p>
    </div>
  )
}
