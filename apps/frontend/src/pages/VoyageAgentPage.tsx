import { Link } from 'react-router-dom'
import VoyageAgentPanel from '../components/VoyageAgentPanel'
import PageGuide from '../components/PageGuide'
import AgentPacksGrid from '../components/AgentPacksGrid'

/** Page dédiée Agent de Voyage — signals paper + pack. */
export default function VoyageAgentPage() {
  return (
    <div className="animate-fade-in pb-20 md:pb-0">
      <PageGuide page="agents" />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-amber-400/80 mb-1">Agents · thématique</p>
          <h1 className="text-2xl sm:text-3xl font-black text-amber-100">✈️ Agent de Voyage</h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-xl">
            Pack Voyage + destinations paper + signaux culture/RWA. Pas un tour-operator on-chain.
          </p>
        </div>
        <Link to="/agents" className="btn-secondary text-sm">
          ← Tous les agents
        </Link>
      </div>

      <VoyageAgentPanel />

      <section className="mt-8">
        <h2 className="text-sm font-bold text-zinc-300 mb-3">Comparer les packs</h2>
        <AgentPacksGrid />
      </section>

      <p className="text-xs text-zinc-600 text-center mt-8">
        data/voyage_agent.json · Model C · paper only · SC mint when live
      </p>
    </div>
  )
}
