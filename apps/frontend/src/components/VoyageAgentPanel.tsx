import { Link } from 'react-router-dom'
import { VOYAGE_AGENT, AGENT_PACKS } from '../config/agentPacks'

/** Agent de voyage — pack thématique + signaux GSN travel (advisory v1). */
export default function VoyageAgentPanel() {
  const pack = AGENT_PACKS.find(p => p.id === 'voyage')

  return (
    <section
      className="mb-8 rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-950/30 via-[#0d0d14] to-transparent p-5"
      aria-labelledby="voyage-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h2 id="voyage-title" className="text-lg font-bold text-amber-200 flex items-center gap-2">
            <span aria-hidden>✈️</span> {VOYAGE_AGENT.name}
          </h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-xl">
            Sleeve thématique <strong className="text-amber-100/90">travel / culture / RWA hospitality</strong>.
            v1 = signaux & badge NFT — <em>pas</em> de réservation réelle ni custodie voyage.
          </p>
        </div>
        <span className="badge-gray text-[10px]">pack · {pack?.priceEur.list ?? 14} € list</span>
      </div>

      <ul className="grid sm:grid-cols-2 gap-2 text-xs text-zinc-300 mb-4">
        {VOYAGE_AGENT.v1_scope.map(s => (
          <li key={s} className="flex gap-2 rounded-lg bg-black/30 border border-white/5 px-3 py-2">
            <span className="text-amber-400/90">✓</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-zinc-500 mb-3">
        Hors scope v1 : {VOYAGE_AGENT.v1_not.join(' · ')}
      </p>

      <div className="flex flex-wrap gap-2">
        <Link to="/agents" className="btn-primary text-sm">
          Voir pack Voyage →
        </Link>
        <a
          href="https://app.greensmoke.network/agents"
          target="_blank"
          rel="noreferrer"
          className="btn-secondary text-sm"
        >
          GSN travel feed ↗
        </a>
      </div>
    </section>
  )
}
