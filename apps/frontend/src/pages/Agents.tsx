import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/** Packs Agents — Genesis limited · œuvres série Tuduri. */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PackCheckout from '../components/PackCheckout'
import PackOpenTheater from '../components/PackOpenTheater'
import Pack3DCockpit from '../components/packs/Pack3DCockpit'
import { AGENT_PACKS, PACK_EDITION, PACK_VISUAL, type PackId } from '../config/agentPacks'
import { PACK_COLLECTIONS } from '../config/packNftMetadata'

const PACKS = AGENT_PACKS

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
    <div className="xa-page animate-fade-in space-y-6 pb-20 max-w-4xl mx-auto">
      <header className="space-y-2 border-b border-[color:var(--xa-border)] pb-5">
        <p className="section-label">{xaRender('Genesis · Limited')}</p>
        <h1 className="section-title display">{xaRender('Pulse · Yield · Sentinel')}</h1>
        <p className="section-lead text-[color:var(--xa-text-secondary)]">
          {xaRender(
            'Entitlements d’accès (signaux / salles) — pas un fonds, pas d’APY promis. Séries plafonnées. 110 / 75 / 50 € · ≈ 33 / 22,5 / 15 EGLD (ref. 100 € ≈ 30 EGLD).',
          )}
        </p>
        <div className="flex flex-wrap gap-2 text-[11px] text-[color:var(--xa-text-muted)]">
          <span className="rounded-full border border-[color:var(--xa-border)] px-2 py-0.5">{xaRender('Pulse 333')}</span>
          <span className="rounded-full border border-[color:var(--xa-border)] px-2 py-0.5">{xaRender('Yield 500')}</span>
          <span className="rounded-full border border-[color:var(--xa-border)] px-2 py-0.5">{xaRender('Sentinel 777')}</span>
          <span className="rounded-full border border-[color:var(--xa-accent)]/30 bg-[color:var(--xa-accent-soft)] px-2 py-0.5 text-[color:var(--xa-accent)]">
            {xaRender('Sandbox · mint simulé')}
          </span>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {xaRender(
          PACKS.map(p => {
            const col = PACK_COLLECTIONS[p.id]
            const vis = PACK_VISUAL[p.id]
            const ed = PACK_EDITION[p.id]
            const isSel = selected === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p.id)}
                className="card text-left card-play transition active:scale-[0.98]"
                style={{ borderColor: isSel ? vis.border : undefined, boxShadow: isSel ? vis.glow : undefined }}
              >
                <div className="flex items-center justify-between gap-1">
                  <p className="text-[15px] font-semibold text-[color:var(--xa-text)]">
                    {xaRender(p.icon)} {xaRender(p.name)}
                  </p>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wide rounded-full px-1.5 py-0.5 border"
                    style={{ borderColor: vis.border, color: vis.accent, background: vis.accentSoft }}
                  >
                    {xaRender(p.tierLabel)}
                  </span>
                </div>
                <p className="text-[10px] mono mt-1 text-[color:var(--xa-text-muted)]">{xaRender(col?.ticker)}</p>
                <p className="text-[12px] mt-1.5 leading-snug text-[color:var(--xa-text-secondary)]">{xaRender(p.tagline)}</p>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-xl tabular-nums text-[color:var(--xa-text)]">
                      {xaRender(String(p.priceEur.list))}{' '}
                      <span className="text-sm text-[color:var(--xa-text-muted)]">{xaRender('€')}</span>
                    </p>
                    <p className="text-[10px] text-[color:var(--xa-text-muted)]">
                      {xaRender('≈ ')}{xaRender(String(p.priceEgld.list))} {xaRender('EGLD')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-semibold tabular-nums" style={{ color: vis.accent }}>
                      {xaRender(String(ed.maxSupply))}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-[color:var(--xa-text-muted)]">{xaRender('max')}</p>
                  </div>
                </div>
                <p className="text-[10px] mt-2 text-[color:var(--xa-text-muted)]">
                  {xaRender('Signaux ×')}
                  {xaRender(String(p.signalIntensity))} · {xaRender(p.features.actionsPerWeek)}
                </p>
              </button>
            )
          }),
        )}
      </div>

      {xaRender(
        active && (
          <section
            className="card space-y-4"
            style={{ borderColor: PACK_VISUAL[active.id].border, boxShadow: PACK_VISUAL[active.id].glow }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[color:var(--xa-text)]">
                  {xaRender(active.icon)} {xaRender(active.name)}{' '}
                  <span className="text-[10px] font-normal text-[color:var(--xa-text-muted)]">{xaRender(active.tierLabel)}</span>
                </h2>
                <p className="text-[11px] mono mt-0.5 text-[color:var(--xa-text-muted)]">
                  {xaRender(PACK_COLLECTIONS[active.id]?.ticker)} · {xaRender(active.seriesName)}
                </p>
                <p className="text-[13px] mt-1 text-[color:var(--xa-text-secondary)]">{xaRender(active.activity)}</p>
                <p className="text-[11px] mt-1 text-[color:var(--xa-text-muted)]">
                  {xaRender('Œuvre :')} {xaRender(PACK_VISUAL[active.id].mediaMotif)}
                </p>
              </div>
              <div
                className="rounded-xl border px-3 py-2 text-center"
                style={{
                  borderColor: PACK_VISUAL[active.id].border,
                  background: PACK_VISUAL[active.id].accentSoft,
                }}
              >
                <p className="text-lg font-bold tabular-nums" style={{ color: PACK_VISUAL[active.id].accent }}>
                  {xaRender(String(active.maxSupply))}
                </p>
                <p className="text-[9px] uppercase tracking-widest text-[color:var(--xa-text-muted)]">
                  {xaRender('édition max')}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-[12px]">
              <div>
                <p className="text-[10px] uppercase text-[color:var(--xa-text-muted)] mb-1">{xaRender('Inclus')}</p>
                <ul className="space-y-1 text-[color:var(--xa-text-secondary)]">
                  {xaRender(active.entitlements.map(e => (
                    <li key={e}>✓ {xaRender(e)}</li>
                  )))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] uppercase text-[color:var(--xa-text-muted)] mb-1">{xaRender('Limites')}</p>
                <ul className="space-y-1 text-[color:var(--xa-text-muted)]">
                  {xaRender(limitsFor(active.id).map(e => (
                    <li key={e}>— {xaRender(e)}</li>
                  )))}
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {xaRender(
                active.strategies.map(s => (
                  <span
                    key={s}
                    className="rounded-full border border-[color:var(--xa-border)] px-2 py-0.5 text-[10px] mono text-[color:var(--xa-text-muted)]"
                  >
                    {xaRender(s)}
                  </span>
                )),
              )}
            </div>

            <Pack3DCockpit packId={active.id} showIntents={false} />
            <PackCheckout packId={active.id} onPaperDone={id => setTheater(id)} onClear={() => setSelected(null)} />
            <Link to="/workspace/agents" className="text-[12px] text-[color:var(--xa-accent)] underline">
              {xaRender('Mes packs →')}
            </Link>
          </section>
        ),
      )}

      {xaRender(theaterPack && <PackOpenTheater pack={theaterPack} open onClose={() => setTheater(null)} />)}

      <div className="rounded-xl border border-[color:var(--xa-border)] px-3 py-3 text-[11px] text-[color:var(--xa-text-muted)] space-y-1">
        <p className="font-medium text-[color:var(--xa-text-secondary)]">{xaRender('Rappel flux')}</p>
        <p>{xaRender('1. Choisir pack → 2. Wallet erd1 → 3. Payer (serveur) → 4. Salle / CC selon tier')}</p>
        <p>{xaRender('Pulse débloque hub CC + TCA + LIA full. Yield / Sentinel = salle dédiée.')}</p>
      </div>
    </div>
  )
}
