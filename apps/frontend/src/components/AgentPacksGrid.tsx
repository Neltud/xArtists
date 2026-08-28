import { Link } from 'react-router-dom'
import { AGENT_PACKS, PACK_PRICING_POLICY } from '../config/agentPacks'
import { canBuyAgent } from '../config/scStatus'

export default function AgentPacksGrid() {
  const mintLive = canBuyAgent()

  return (
    <div>
      <p className="text-xs text-zinc-500 mb-3">
        <strong className="text-zinc-300">Packs IA uniquement</strong> — Pulse · Yield · Sentinel.{' '}
        {PACK_PRICING_POLICY.ranking}.{' '}
        <Link to="/tours" className="text-rose-300 underline">
          Tours artistiques
        </Link>{' '}
        = service culturel séparé.
        {!mintLive && (
          <span className="text-amber-300/90"> Mint on-chain pending codeHash.</span>
        )}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {AGENT_PACKS.map(p => (
          <article
            key={p.id}
            className="card flex flex-col border-purple-500/25"
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
              Intensité {'●'.repeat(p.signalIntensity)}
              {'○'.repeat(3 - p.signalIntensity)}
            </p>
            <p className="text-[11px] text-zinc-500 mb-2">{p.strategies.join(' · ')}</p>
            <p className="text-[11px] text-zinc-500 mb-3">{p.activity}</p>
            <ul className="text-xs text-zinc-300 space-y-1 mb-3 flex-1">
              {p.entitlements.map(e => (
                <li key={e}>✓ {e}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 mt-auto">
              <Link to="/my-packs" className="btn-secondary text-xs py-2 px-3 flex-1 text-center">
                My Packs
              </Link>
              <Link to="/trading" className="btn-secondary text-xs py-2 px-3 text-center">
                Board
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
