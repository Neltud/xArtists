/** Packs — paper checkout clair · SC mint quand preuve explorer. */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PackCheckout from '../components/PackCheckout'
import PackOpenTheater from '../components/PackOpenTheater'
import PackProductDisclaimer from '../components/PackProductDisclaimer'
import FeeTransparency from '../components/ui/FeeTransparency'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { canBuyAgent } from '../config/scStatus'
import { isLiveProven } from '../lib/explorerProof'
import { MAINNET_ADDRESSES } from '../config/contracts'

const ONLY: PackId[] = ['pulse', 'yield', 'sentinel']
const PACKS = (AGENT_PACKS || []).filter(
  (p): p is (typeof AGENT_PACKS)[number] => !!p && ONLY.includes(p.id as PackId),
)

export default function Agents() {
  const [selected, setSelected] = useState<PackId | null>(null)
  const [theater, setTheater] = useState<PackId | null>(null)
  const active = PACKS.find(p => p && p.id === selected) || null
  const theaterPack = PACKS.find(p => p && p.id === theater) || null
  const mintLive = canBuyAgent() && isLiveProven('agents')

  return (
    <div className="animate-fade-in pb-14 max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <p className="section-label">Packs · produits limités</p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="section-title display">Pulse · Yield · Sentinel</h1>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
              mintLive
                ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                : 'border-amber-500/35 text-amber-200 bg-amber-500/10'
            }`}
          >
            {mintLive ? 'LIVE' : 'PAPER'}
          </span>
        </div>
        <p className="section-lead">
          Trois salles. Floor 10 EGLD. Pas un fond d&apos;investissement.
        </p>
        {!mintLive && (
          <p className="text-[12px] text-amber-200/85 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2">
            Mint on-chain pas encore prouvé sur explorer. Checkout paper / fiat OK — aucun SC mint
            user jusqu&apos;à 1 TX réussie.
          </p>
        )}
      </header>

      <PackProductDisclaimer />
      <FeeTransparency kind="packs" />

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

      {theaterPack && <PackOpenTheater pack={theaterPack} open onClose={() => setTheater(null)} />}

      <p className="text-[10px] text-zinc-600 mono break-all">
        SC agents {MAINNET_ADDRESSES.agents_marketplace}
      </p>
    </div>
  )
}
