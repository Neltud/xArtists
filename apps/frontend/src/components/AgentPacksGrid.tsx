import { AGENT_PACKS, PACK_PRICING_POLICY } from '../config/agentPacks'

export default function AgentPacksGrid() {
  return (
    <div>
      <p className="text-xs text-zinc-500 mb-3">
        <strong className="text-zinc-300">Plus de signaux = plus cher</strong> —{' '}
        {PACK_PRICING_POLICY.ranking}. LIA ajuste pour la marge (corridor{' '}
        {PACK_PRICING_POLICY.corridor.min}–{PACK_PRICING_POLICY.corridor.max} €).
      </p>
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
            <p className="text-2xl font-black text-white mb-1">
              {p.priceEur.list} €
              <span className="text-xs font-normal text-zinc-500 ml-2">list</span>
            </p>
            <p className="text-[11px] text-amber-200/80 mb-2">
              Intensité signaux {'●'.repeat(p.signalIntensity)}
              {'○'.repeat(3 - p.signalIntensity)}
            </p>
            <p className="text-[11px] text-zinc-500 mb-2">
              Corridor {p.priceEur.min}–{p.priceEur.max} € · {p.strategies.join(' · ')}
            </p>
            <p className="text-[11px] text-zinc-500 mb-3">{p.activity}</p>
            <ul className="text-xs text-zinc-300 space-y-1 mb-3 flex-1">
              {p.entitlements.map(e => (
                <li key={e}>✓ {e}</li>
              ))}
            </ul>
            <p className="text-[10px] text-zinc-600 border-t border-zinc-800 pt-2">
              Risque {p.risk} · droit produit · pas un fonds · pas GSN
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}
