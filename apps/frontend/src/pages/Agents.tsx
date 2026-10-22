import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/** Packs Agents — Pulse / Yield / Sentinel + cockpit signaux LIA. */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PackCheckout from '../components/PackCheckout'
import PackOpenTheater from '../components/PackOpenTheater'
import Pack3DCockpit from '../components/packs/Pack3DCockpit'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { PACK_COLLECTIONS } from '../config/packNftMetadata'

const PACKS = AGENT_PACKS

/** Limites honnêtes par tier (pas de champ notIncluded sur le type). */
function limitsFor(id: PackId): string[] {
  if (id === 'pulse') return ['Pas un fonds · pas d’APY promis', 'Signature xPortal obligatoire']
  if (id === 'yield')
    return ['Pas TCA / LIA full', 'Hub limité · focus DeFi', 'Pas un fonds · pas d’APY promis']
  return ['Salle Sentinel uniquement', 'Alertes sparses', 'Pas TCA / trading HF']
}

export default function Agents() {
  const [selected, setSelected] = useState<PackId | null>(null)
  const [theater, setTheater] = useState<PackId | null>(null)
  const active = PACKS.find(p => p && p.id === selected) || null
  const theaterPack = PACKS.find(p => p && p.id === theater) || null

  return (
    <div className="animate-fade-in space-y-6 pb-20 max-w-3xl mx-auto">
      <header className="space-y-2">
        <p className="section-label">{xaRender("Packs")}</p>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h1 className="section-title display">{xaRender("Pulse · Yield · Sentinel")}</h1>
        </div>
        <p className="section-lead">
          {xaRender("Entitlements d&apos;accès (signaux / salles) — pas un fonds, pas d&apos;APY promis. Prix officiels on-chain : 10 / 5 / 2.5 EGLD. ")}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {xaRender(PACKS.map(p => {
          const col = PACK_COLLECTIONS[p.id]
          return (
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
                  {xaRender(p.icon)} {xaRender(p.name)}
                </p>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wide rounded-full px-1.5 py-0.5 border ${
                    p.tier === 'full'
                      ? 'border-emerald-400/50 text-emerald-300 bg-emerald-500/15'
                      : 'border-white/15 text-zinc-400 bg-white/5'
                  }`}
                >
                  {xaRender(p.tierLabel)}
                </span>
              </div>
              <p className="text-[10px] mono text-cyan-300/80 mt-1">{xaRender(col?.ticker)}</p>
              <p className="text-[12px] text-zinc-400 mt-1.5 leading-snug">{xaRender(p.tagline)}</p>
              <p className="mt-3 text-xl text-white tabular-nums">{xaRender(p.priceEgld?.list ?? 10)} {xaRender(" EGLD")}</p>
              <p className="text-[10px] text-zinc-500 mt-1">
                {xaRender("Signaux ×")}{xaRender(p.signalIntensity)} · {xaRender(p.features.actionsPerWeek)}
              </p>
            </button>
          )
        }))}
      </div>

      {xaRender(active && (
        <section className={`card space-y-4 border ${active.borderClass}`}>
          <div>
            <h2 className="text-sm font-semibold text-white">
              {xaRender(active.icon)} {xaRender(active.name)}{xaRender(' ')}
              <span className="text-[10px] text-zinc-400 font-normal">{xaRender(active.tierLabel)}</span>
            </h2>
            <p className="text-[11px] mono text-cyan-300/80 mt-0.5">
              {xaRender(PACK_COLLECTIONS[active.id]?.ticker)}
            </p>
            <p className="text-[13px] text-zinc-400 mt-1">{xaRender(active.activity)}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-[12px]">
            <div>
              <p className="text-[10px] uppercase text-zinc-500 mb-1">{xaRender("Inclus")}</p>
              <ul className="space-y-1 text-zinc-300">
                {xaRender(active.entitlements.map(e => (
                  <li key={e}>✓ {xaRender(e)}</li>
                )))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] uppercase text-zinc-500 mb-1">{xaRender("Limites")}</p>
              <ul className="space-y-1 text-zinc-500">
                {xaRender(limitsFor(active.id).map(e => (
                  <li key={e}>— {xaRender(e)}</li>
                )))}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {xaRender(active.strategies.map(s => (
              <span
                key={s}
                className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] mono text-zinc-400"
              >
                {xaRender(s)}
              </span>
            )))}
          </div>

          <Pack3DCockpit packId={active.id} showIntents={false} />
          <PackCheckout
            packId={active.id}
            onPaperDone={id => setTheater(id)}
            onClear={() => setSelected(null)}
          />
          <Link to="/my-packs" className="text-[12px] text-cyan-400 underline">
            {xaRender("Ouvrir mes salles → ")}</Link>
        </section>
      ))}

      {xaRender(theaterPack && <PackOpenTheater pack={theaterPack} open onClose={() => setTheater(null)} />)}

      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-[11px] text-zinc-500 space-y-1">
        <p className="font-medium text-zinc-400">{xaRender("Rappel flux")}</p>
        <p>{xaRender("1. Choisir pack → 2. Wallet erd1 → 3. Payer ou aperçu appareil → 4. Salle / CC selon tier")}</p>
        <p>{xaRender("Pulse débloque hub CC + TCA + LIA full. Yield / Sentinel = salle dédiée seulement.")}</p>
      </div>

      <div className="flex flex-wrap gap-3 text-[12px]">
        <Link to="/market?tab=digital" className="text-cyan-400 hover:underline">
          {xaRender("Marketplace NFT & Packs → ")}</Link>
        <Link to="/command-center" className="text-zinc-400 hover:underline">
          {xaRender("Command Center → ")}</Link>
        <Link to="/tca" className="text-zinc-400 hover:underline">
          {xaRender("TCA (Pulse) → ")}</Link>
        <Link to="/lia" className="text-zinc-400 hover:underline">
          {xaRender("LIA Hub → ")}</Link>
      </div>
    </div>
  )
}
