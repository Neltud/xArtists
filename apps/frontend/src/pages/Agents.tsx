/**
 * Packs — UNE seule grille Pulse · Yield · Sentinel + checkout pour le pack choisi.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import AgentPacksGrid from '../components/AgentPacksGrid'
import PackCheckout from '../components/PackCheckout'
import PageGuide from '../components/PageGuide'
import InfoTip from '../components/InfoTip'
import type { PackId } from '../config/agentPacks'

export default function Agents() {
  const [buyId, setBuyId] = useState<PackId | null>(null)

  return (
    <div className="animate-fade-in space-y-5 pb-10 max-w-4xl">
      <PageGuide page="agents" />

      <header className="space-y-1">
        <p className="section-label text-emerald-400/80">Agents</p>
        <h1 className="page-title">Packs</h1>
        <p className="page-sub inline-flex flex-wrap items-center gap-1">
          Pulse · Yield · Sentinel — une offre, trois niveaux
          <InfoTip>
            <strong className="text-white block mb-1">Pas de doublon</strong>
            <span className="text-zinc-400">
              Une seule liste. Le NFT d’entitlement est la forme on-chain du pack, pas un 2ᵉ catalogue.
              Tours = culture, hors packs.
            </span>
          </InfoTip>
        </p>
      </header>

      <AgentPacksGrid
        onBuy={id => {
          setBuyId(id)
          requestAnimationFrame(() => {
            document.getElementById('pack-checkout')?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
          })
        }}
      />

      <div id="pack-checkout">
        <PackCheckout packId={buyId} onClear={() => setBuyId(null)} />
      </div>

      <p className="text-[11px] text-zinc-600">
        <Link to="/my-packs" className="text-violet-300/90 hover:underline">
          My Packs
        </Link>
        {' · '}
        <Link to="/tours" className="text-violet-300/90 hover:underline">
          Art Tours
        </Link>
      </p>
    </div>
  )
}
