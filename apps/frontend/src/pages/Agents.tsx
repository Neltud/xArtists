/** Packs IA — libellés clairs, sans « paper ». */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PackCheckout from '../components/PackCheckout'
import PackOpenTheater from '../components/PackOpenTheater'
import PackProductDisclaimer from '../components/PackProductDisclaimer'
import FeeTransparency from '../components/ui/FeeTransparency'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { canBuyAgent } from '../config/scStatus'
import { isLiveProven } from '../lib/explorerProof'
import { useI18n } from '../i18n/I18nContext'

const ONLY: PackId[] = ['pulse', 'yield', 'sentinel']
const PACKS = (AGENT_PACKS || []).filter(
  (p): p is (typeof AGENT_PACKS)[number] => !!p && ONLY.includes(p.id as PackId),
)

export default function Agents() {
  const { t } = useI18n()
  const [selected, setSelected] = useState<PackId | null>(null)
  const [theater, setTheater] = useState<PackId | null>(null)
  const active = PACKS.find(p => p && p.id === selected) || null
  const theaterPack = PACKS.find(p => p && p.id === theater) || null
  const mintLive = canBuyAgent() && isLiveProven('agents')

  return (
    <div className="animate-fade-in pb-14 max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <p className="section-label">Packs</p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="section-title display">Pulse · Yield · Sentinel</h1>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
              mintLive
                ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                : 'border-amber-500/35 text-amber-200 bg-amber-500/10'
            }`}
          >
            {mintLive ? 'LIVE' : 'BIENTÔT'}
          </span>
        </div>
        <p className="section-lead">
          Trois salles. Floor 10 EGLD. {t('packs.disclaimer')}
        </p>
        {!mintLive && (
          <p className="text-[12px] text-zinc-400 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            Le mint on-chain arrive ensuite. Tu peux déjà explorer les salles après activation sur cet
            appareil, ou suivre le Marketplace pour les NFT agents listés.
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
            className="card text-left card-play transition active:scale-[0.98] hover:border-violet-400/30"
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
          <PackCheckout
            packId={active.id}
            onPaperDone={id => setTheater(id)}
            onClear={() => setSelected(null)}
          />
          <Link to="/my-packs" className="text-[12px] text-cyan-400 underline">
            Ouvrir mes salles →
          </Link>
        </section>
      )}

      {theaterPack && <PackOpenTheater pack={theaterPack} open onClose={() => setTheater(null)} />}

      <div className="flex flex-wrap gap-3 text-[12px]">
        <Link to="/marketplace" className="text-cyan-400 hover:underline">
          Marketplace NFT →
        </Link>
        <Link to="/command-center" className="text-zinc-400 hover:underline">
          Command Center →
        </Link>
      </div>
    </div>
  )
}
