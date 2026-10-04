/** Task 3 — Intelligence feed (paper intents + aura badge). */
import type { FeedItem } from '../../lia/intentFeed'

const AURA_CLASS: Record<string, string> = {
  bull: 'border-emerald-400/40 text-emerald-200',
  bear: 'border-rose-400/40 text-rose-200',
  reward: 'border-amber-400/40 text-amber-200',
  stable: 'border-cyan-400/40 text-cyan-200',
  risk: 'border-orange-400/40 text-orange-200',
}

export default function IntentFeed({ items }: { items: FeedItem[] }) {
  return (
    <section className="card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-violet-300/90 font-semibold">
            Intelligence feed · paper
          </p>
          <p className="text-[12px] text-zinc-500 mt-0.5">
            Intents du cycle de décision — aucune signature on-chain.
          </p>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun intent — clique Actualiser sur le hub ou Tick au Command Center.</p>
      ) : (
        <ul className="divide-y divide-white/5 max-h-64 overflow-y-auto">
          {[...items].reverse().map(it => (
            <li key={it.id} className="py-2.5 flex flex-wrap items-start justify-between gap-2 text-[12px]">
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-white">{it.action}</span>
                  <span className="text-zinc-500">{it.assetId}</span>
                  <span
                    className={`rounded-full border px-1.5 py-0.5 text-[10px] ${
                      AURA_CLASS[String(it.aura)] || 'border-white/15 text-zinc-400'
                    }`}
                  >
                    aura:{String(it.aura)}
                  </span>
                </div>
                <p className="text-zinc-500 truncate max-w-md" title={it.reason}>
                  {it.strategy.replace(/^STRAT_/, '')} · {it.reason}
                </p>
                <p className="text-[10px] text-zinc-600">
                  {new Date(it.at).toLocaleString()} · conf {(it.confidence * 100).toFixed(0)}%
                </p>
              </div>
              <span className="mono text-zinc-400 tabular-nums shrink-0">{it.amount || '—'}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
