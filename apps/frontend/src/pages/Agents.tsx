/** Packs — no .id crash, no tech leak. */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PackCheckout from '../components/PackCheckout'
import PackOpenTheater from '../components/PackOpenTheater'
import PackProductDisclaimer from '../components/PackProductDisclaimer'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'

const ONLY: PackId[] = ['pulse', 'yield', 'sentinel']
const PACKS = (AGENT_PACKS || []).filter(
  (p): p is (typeof AGENT_PACKS)[number] => !!p && ONLY.includes(p.id as PackId),
)

export default function Agents() {
  const [selected, setSelected] = useState<PackId | null>(null)
  const [theater, setTheater] = useState<PackId | null>(null)
  const active = PACKS.find(p => p && p.id === selected) || null
  const theaterPack = PACKS.find(p => p && p.id === theater) || null

  return (
    <div className="animate-fade-in pb-14 max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <p className="section-label">Packs · produits limités</p>
        <h1 className="section-title display">Pulse · Yield · Sentinel</h1>
        <p className="section-lead">
          Trois salles. Floor 10 EGLD. Pas un fond d’investissement.
        </p>
      </header>
      <PackProductDisclaimer />
      <div className="grid sm:grid-cols-3 gap-3">
        {PACKS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelected(p.id)}
            className="card text-left card-play"
          >
            <p className="text-[15px] font-semibold text-white">
              {p.icon} {p.name}
            </p>
            <p className="text-[12px] text-zinc-500 mt-1 line-clamp-2">{p.tagline}</p>
            <p className="mt-3 text-xl text-white">{p.priceEgld?.list ?? 10} EGLD</p>
          </button>
        ))}
      </div>
      {active && (
        <section className="card space-y-3">
          <h2 className="text-sm font-semibold text-white">
            {active.icon} {active.name}
          </h2>
          <PackCheckout packId={active.id} onPaperDone={id => setTheater(id)} onClear={() => setSelected(null)} />
          <Link to="/my-packs" className="text-[12px] text-cyan-400 underline">
            Ouvrir la salle →
          </Link>
        </section>
      )}
      {theaterPack && (
        <PackOpenTheater pack={theaterPack} open onClose={() => setTheater(null)} />
      )}
    </div>
  )
}
