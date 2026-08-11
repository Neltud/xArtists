import { AGENT_PACKS } from '../config/agentPacks'
import { PACK_PRICE_EUR } from '../config/multichain'

export default function AgentPacksGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {AGENT_PACKS.map(p => (
        <article
          key={p.id}
          className="card border-purple-500/25 flex flex-col"
          aria-labelledby={`pack-${p.id}`}
        >
          <div className="flex items-start gap-3 mb-3">
            <span className="text-3xl" aria-hidden>
              {p.icon}
            </span>
            <div>
              <h3 id={`pack-${p.id}`} className={`font-black text-lg ${p.color}`}>
                {p.name}
              </h3>
              <p className="text-xs text-zinc-400">{p.tagline}</p>
            </div>
          </div>
          <p className="text-sm font-semibold text-white mb-2">
            {p.priceEur.default} €{' '}
            <span className="text-xs font-normal text-zinc-500">
              (fourchette {p.priceEur.min}–{p.priceEur.max} · LIA ajuste)
            </span>
          </p>
          <p className="text-[11px] text-zinc-500 mb-2">
            Stratégies : {p.strategies.join(' · ')}
          </p>
          <p className="text-[11px] text-zinc-500 mb-3">{p.activity}</p>
          <ul className="text-xs text-zinc-300 space-y-1 mb-3 flex-1">
            {p.entitlements.map(e => (
              <li key={e}>✓ {e}</li>
            ))}
          </ul>
          <p className="text-[10px] text-zinc-600 border-t border-zinc-800 pt-2">
            Risque {p.risk} · pas un APY · global packs {PACK_PRICE_EUR.min}–{PACK_PRICE_EUR.max} €
          </p>
        </article>
      ))}
    </div>
  )
}
