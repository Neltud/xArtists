import { Link } from 'react-router-dom'
import LightningAgentPanel from '../components/LightningAgentPanel'
import PageGuide from '../components/PageGuide'

export default function LightningAgentPage() {
  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <PageGuide page="agents" />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-orange-400/80">Cross-chain agent finance</p>
          <h1 className="text-3xl font-black">Lightning · Agent Wallet</h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-xl">
            Bitcoin Lightning pour agents IA (MCP). MultiversX reste le rail principal NFT / $TRO / LIA board.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/agents" className="btn-secondary text-xs py-2 px-3">
            Packs MVX
          </Link>
          <Link to="/agents/voyage" className="btn-secondary text-xs py-2 px-3">
            Voyage
          </Link>
          <Link to="/entity" className="btn-secondary text-xs py-2 px-3">
            Entité
          </Link>
        </div>
      </header>
      <LightningAgentPanel />
      <section className="card text-xs text-zinc-500 space-y-2">
        <p className="font-semibold text-zinc-300">Pour Vellum / ops</p>
        <ol className="list-decimal pl-4 space-y-1">
          <li>Installer le MCP sur l’hôte agent (pas dans le navigateur utilisateur).</li>
          <li>
            <code className="text-zinc-400">register_operator</code> / <code className="text-zinc-400">lw register</code>{' '}
            — sauvegarder recovery hors git.
          </li>
          <li>Budget sats/jour + flag LIGHTNING_AGENT_LIVE avant paiements auto.</li>
          <li>Ne jamais fusionner les clés Lightning avec le wallet MultiversX LIA ops.</li>
        </ol>
      </section>
    </div>
  )
}
