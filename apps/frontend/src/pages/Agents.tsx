/** Packs IA — Pulse complet vs Yield/Sentinel limités. */
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
          <strong className="text-emerald-300/90">Pulse = pack complet</strong>. Yield et Sentinel sont{' '}
          <strong className="text-zinc-300">limités</strong> (DeFi / guard). Floor 10 EGLD. {t('packs.disclaimer')}
        </p>
      </header>

      <PackProductDisclaimer />
      <FeeTransparency kind="packs" />

      <div className="grid sm:grid-cols-3 gap-3">
        {PACKS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelected(p.id)}
            className={`card text-left card-play transition active:scale-[0.98] hover:border-violet-400/30 border ${
              p.borderClass || 'border-white/10'
            } ${selected === p.id ? 'ring-1 ring-violet-400/40' : ''}`}
          >
            <div className="flex items-center justify-between gap-1">
              <p className="text-[15px] font-semibold text-white">
                {p.icon} {p.name}
              </p>
              <span
                className={`text-[9px] font-bold uppercase tracking-wide rounded-full px-1.5 py-0.5 border ${
                  p.tier === 'full'
                    ? 'border-emerald-400/50 text-emerald-300 bg-emerald-500/15'
                    : 'border-white/15 text-zinc-400 bg-white/5'
                }`}
              >
                {p.tierLabel}
              </span>
            </div>
            <p className="text-[12px] text-zinc-400 mt-1.5 leading-snug">{p.tagline}</p>
            <p className="mt-3 text-xl text-white tabular-nums">{p.priceEgld?.list ?? 10} EGLD</p>
            <p className="text-[10px] text-zinc-500 mt-1">
              Signaux ×{p.signalIntensity} · {p.features.actionsPerWeek}
            </p>
          </button>
        ))}
      </div>

      {active && (
        <section className={`card space-y-4 border ${active.borderClass}`}>
          <div>
            <h2 className="text-sm font-semibold text-white">
              {active.icon} {active.name}{' '}
              <span className="text-[10px] text-zinc-400 font-normal">{active.tierLabel}</span>
            </h2>
            <p className="text-[13px] text-zinc-400 mt-1">{active.activity}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-[12px]">
            <div>
              <p className="text-[10px] uppercase text-zinc-500 mb-1">Inclus</p>
              <ul className="space-y-1 text-zinc-300">
                {active.entitlements.map(e => (
                  <li key={e}>✓ {e}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] uppercase text-zinc-500 mb-1">Non inclus / limites</p>
              <ul className="space-y-1 text-zinc-500">
                {[...active.notIncluded, ...(active.limits || [])].map(e => (
                  <li key={e}>— {e}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {active.strategies.map(s => (
              <span
                key={s}
                className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] mono text-zinc-400"
              >
                {s}
              </span>
            ))}
          </div>

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

      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-[11px] text-zinc-500 space-y-1">
        <p className="font-medium text-zinc-400">Rappel flux</p>
        <p>1. Choisir pack → 2. Wallet erd1 → 3. Payer ou aperçu appareil → 4. Salle / CC selon tier</p>
        <p>Pulse débloque hub CC + TCA + LIA full. Yield / Sentinel = salle dédiée seulement.</p>
      </div>

      <div className="flex flex-wrap gap-3 text-[12px]">
        <Link to="/marketplace" className="text-cyan-400 hover:underline">
          Marketplace NFT →
        </Link>
        <Link to="/command-center" className="text-zinc-400 hover:underline">
          Command Center →
        </Link>
        <Link to="/tca" className="text-zinc-400 hover:underline">
          TCA (Pulse) →
        </Link>
        <Link to="/lia" className="text-zinc-400 hover:underline">
          LIA Hub →
        </Link>
      </div>
    </div>
  )
}
