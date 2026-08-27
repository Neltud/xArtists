import PageGuide from '../components/PageGuide'
import VoyageAgentPanel from '../components/VoyageAgentPanel'
import { Link } from 'react-router-dom'

export default function VoyageAgentPage() {
  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <PageGuide page="voyage" defaultOpen />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400/80">Pack thématique</p>
          <h1 className="text-3xl font-black text-white">Agent de Voyage</h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-xl">
            Signaux travel · culture · RWA hospitality — advisory paper. Pas de booking.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/agents" className="btn-secondary text-xs py-2 px-3">
            Tous les packs
          </Link>
          <Link to="/entity" className="btn-secondary text-xs py-2 px-3">
            Entité
          </Link>
          <Link to="/trading" className="btn-primary text-xs py-2 px-3">
            Board LIA
          </Link>
        </div>
      </div>
      <VoyageAgentPanel />
    </div>
  )
}
