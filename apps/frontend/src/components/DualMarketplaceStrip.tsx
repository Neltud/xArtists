import { Link } from 'react-router-dom'
import { canListBuyNft, canBuyAgent } from '../config/scStatus'

/** Product clarity: Art/RWA market vs Agents IA market — fail-closed until codeHash. */
export default function DualMarketplaceStrip() {
  const artLive = canListBuyNft()
  const agentsLive = canBuyAgent()

  return (
    <section className="mb-8 grid gap-3 sm:grid-cols-2" aria-label="Deux marketplaces">
      <Link
        to="/marketplace"
        className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 to-[#12121a] p-4 sm:p-5 hover:border-violet-400/50 transition-colors"
      >
        <p className="text-[10px] uppercase tracking-widest text-violet-300/80 mb-1">Marketplace A</p>
        <h2 className="text-lg font-black text-white">Arts · RWA · NFT</h2>
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
          Studio → Galerie → List/Buy/Bid. Œuvres numériques et phygital. Fees → treasury fondation.
        </p>
        <span className="inline-block mt-3 text-xs font-semibold text-violet-300">
          {artLive ? 'Ouvrir le market art →' : 'Consultation · on-chain après codeHash →'}
        </span>
      </Link>
      <Link
        to="/agents"
        className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-950/30 to-[#12121a] p-4 sm:p-5 hover:border-teal-400/50 transition-colors"
      >
        <p className="text-[10px] uppercase tracking-widest text-teal-300/80 mb-1">Marketplace B</p>
        <h2 className="text-lg font-black text-white">Agents IA · Packs LIA</h2>
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
          Clone LIA en NFT limité (5–25 €) · stake · 3 profils. Revenu passif selon règles pack — pas GreenSmoke.
        </p>
        <span className="inline-block mt-3 text-xs font-semibold text-teal-300">
          {agentsLive ? 'Ouvrir les agents →' : 'Packs paper · SC agents non déployé →'}
        </span>
      </Link>
    </section>
  )
}
