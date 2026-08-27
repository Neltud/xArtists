import { Link } from 'react-router-dom'
import { VOYAGE_AGENT, AGENT_PACKS } from '../config/agentPacks'

const pack = AGENT_PACKS.find(p => p.id === 'voyage')

/**
 * Agent de voyage — sleeve thématique xArtists.
 * Advisory / signaux only en v1 (paper). Pas de booking réel.
 */
export default function VoyageAgentPanel() {
  return (
    <section
      className="card mb-8 border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-transparent to-purple-500/5"
      aria-labelledby="voyage-agent-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-amber-400/90 mb-1">Nouveau · thématique</p>
          <h2 id="voyage-agent-title" className="text-lg font-bold text-amber-100 flex items-center gap-2">
            <span aria-hidden>✈️</span> {VOYAGE_AGENT.name}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Signaux mobilité, culture et RWA séjour — alimentés par LIA / GSN travel. Pack NFT catalogue{' '}
            <strong className="text-amber-200/90">{pack?.priceEur.list ?? 14} €</strong> (corridor{' '}
            {pack?.priceEur.min}–{pack?.priceEur.max} €).
          </p>
        </div>
        <span className="badge-gray text-[10px]">paper · pas de booking réel</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-[10px] uppercase text-zinc-500 mb-2">Périmètre v1</p>
          <ul className="text-xs text-zinc-300 space-y-1">
            {VOYAGE_AGENT.v1_scope.map(s => (
              <li key={s}>· {s}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-[10px] uppercase text-zinc-500 mb-2">Hors scope v1</p>
          <ul className="text-xs text-zinc-500 space-y-1">
            {VOYAGE_AGENT.v1_not.map(s => (
              <li key={s}>· {s}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/agents" className="btn-primary text-sm">
          Voir pack Voyage
        </Link>
        <Link to="/sim" className="btn-secondary text-sm">
          Simulation Lab
        </Link>
        <a
          href="https://app.greensmoke.network/agents"
          target="_blank"
          rel="noreferrer"
          className="btn-secondary text-sm"
        >
          GSN travel ↗
        </a>
      </div>
    </section>
  )
}
