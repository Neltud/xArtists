import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * Agent roster — 3 packs with ownership + CTA.
 */
import { Link } from 'react-router-dom'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { useAgentAccess } from '../store/empireStore'

export default function AgentRoster() {
  const access = useAgentAccess()

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-white">{xaRender("Agents IA · roster")}</h2>
        <Link to="/agents" className="text-[11px] text-cyan-300 hover:underline">
          {xaRender("Catalogue packs → ")}</Link>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {xaRender(AGENT_PACKS.map(p => {
          const owned = access.packs.includes(p.id as PackId)
          return (
            <article
              key={p.id}
              className={`rounded-2xl border p-4 space-y-2 transition ${
                owned
                  ? 'border-emerald-500/35 bg-emerald-950/30 shadow-[0_0_24px_rgba(16,185,129,0.15)]'
                  : 'border-white/10 bg-black/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl" aria-hidden>
                  {xaRender(p.icon)}
                </span>
                <span
                  className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    owned
                      ? 'border-emerald-400/50 text-emerald-200'
                      : 'border-zinc-600 text-zinc-500'
                  }`}
                >
                  {xaRender(owned ? 'Owned' : 'Locked')}
                </span>
              </div>
              <h3 className={`font-bold ${p.color}`}>{xaRender(p.name)}</h3>
              <p className="text-[11px] text-zinc-400 leading-snug">{xaRender(p.tagline)}</p>
              <ul className="text-[10px] text-zinc-500 space-y-0.5">
                <li>{xaRender("Signal ")}{xaRender(p.signalIntensity)}{xaRender("/3 · risk ")}{xaRender(p.risk)}</li>
                <li>{xaRender("Floor ")}{xaRender(p.priceEgld.min)}–{xaRender(p.priceEgld.list)} {xaRender(" EGLD")}</li>
              </ul>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {xaRender(owned ? (
                  <>
                    <Link
                      to={`/room/${p.id}`}
                      className="btn-primary text-[10px] py-1 px-2"
                    >
                      {xaRender("Salle 3D ")}</Link>
                    <button
                      type="button"
                      className="btn-secondary text-[10px] py-1 px-2"
                      onClick={() => {
                        window.location.hash = `#/command-center`
                        // room switch via custom event
                        window.dispatchEvent(
                          new CustomEvent('xartists:cc-room', { detail: { room: p.id } }),
                        )
                      }}
                    >
                      {xaRender("CC room ")}</button>
                  </>
                ) : (
                  <Link to="/agents" className="btn-secondary text-[10px] py-1 px-2">
                    {xaRender("Obtenir ")}</Link>
                ))}
              </div>
            </article>
          )
        }))}
      </div>
    </section>
  )
}
