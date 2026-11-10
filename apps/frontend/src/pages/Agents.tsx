import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/** Packs Agents — Genesis limited · œuvres série Tuduri. */
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Pack3DCockpit from '../components/packs/Pack3DCockpit'
import { AGENT_PACKS, AGENT_PACK_SC_SNAPSHOT, AGENT_PACK_MEDIA_SNAPSHOT, PACK_EDITION, PACK_VISUAL, type PackId } from '../config/agentPacks'
import { PACK_COLLECTIONS } from '../config/packNftMetadata'
import { GENESIS_TARGETS_BY_ID } from '../config/commercialTargets'

const PACKS = AGENT_PACKS

function limitsFor(id: PackId): string[] {
  if (id === 'pulse') return ['Pas un fonds · pas d’APY promis', 'Signature xPortal obligatoire']
  if (id === 'yield')
    return ['Pas TCA / LIA full', 'Hub limité · focus DeFi', 'Pas un fonds · pas d’APY promis']
  return ['Salle Sentinel uniquement', 'Alertes sparses', 'Pas TCA / trading HF']
}

export default function Agents() {
  const [params] = useSearchParams()
  const [selected, setSelected] = useState<PackId | null>(null)
  const active = PACKS.find(p => p && p.id === selected) || null

  useEffect(() => {
    const q = params.get('pack')
    if (q === 'pulse' || q === 'yield' || q === 'sentinel') setSelected(q)
  }, [params])

  return (
    <div className="xa-page animate-fade-in space-y-6 pb-20 max-w-4xl mx-auto">
      <header className="space-y-2 border-b border-[color:var(--xa-border)] pb-5">
        <p className="section-label">{xaRender('Genesis · Limited')}</p>
        <h1 className="section-title display">{xaRender('Pulse · Yield · Sentinel')}</h1>
        <p className="section-lead text-[color:var(--xa-text-secondary)]">
          {xaRender(
            'Packs Genesis NFT en découverte — pas un fonds, pas d’APY promis. Objectifs/plafonds Pulse 33, Yield 22, Sentinel 11 EGLD ; prix de contrat différents. Les ventes et livraisons restent suspendues.',
          )}
        </p>
        <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3 text-xs leading-relaxed text-[color:var(--xa-text-secondary)]">
          <p className="font-semibold text-[color:var(--xa-text)]">
            {xaRender('Médias NFT mainnet non prêts · achats suspendus')}
          </p>
          <p className="mt-1">
            {xaRender(`Relevé public du ${AGENT_PACK_MEDIA_SNAPSHOT.observedDate} (non temps réel) : ${AGENT_PACK_MEDIA_SNAPSHOT.indexedTotal} NFT Pulse/Yield/Sentinel indexés, ${AGENT_PACK_MEDIA_SNAPSHOT.mediaReadyTotal} URI média renseignée. Pulse #005 non émis.`)}
          </p>
          <a href="https://api.multiversx.com/collections/XAIPLS-2cf72b/nfts?size=20"
            target="_blank" rel="noopener noreferrer"
            className="mt-1 inline-block underline underline-offset-2 text-[color:var(--xa-accent)]">
            {xaRender('Contrôler les NFT Pulse sur MultiversX')}
          </a>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-[color:var(--xa-text-muted)]">
          <span className="rounded-full border border-[color:var(--xa-border)] px-2 py-0.5">{xaRender('Pulse 333')}</span>
          <span className="rounded-full border border-[color:var(--xa-border)] px-2 py-0.5">{xaRender('Yield 500')}</span>
          <span className="rounded-full border border-[color:var(--xa-border)] px-2 py-0.5">{xaRender('Sentinel 777')}</span>
          <span className="rounded-full border border-[color:var(--xa-accent)]/30 bg-[color:var(--xa-accent-soft)] px-2 py-0.5 text-[color:var(--xa-accent)]">
            {xaRender('Découverte · aucun paiement ni NFT livré')}
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
              <div key={p.id} className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSelected(p.id)}
                  className="card text-left card-play transition active:scale-[0.98] w-full"
                  style={{ borderColor: isSel ? vis.border : undefined, boxShadow: isSel ? vis.glow : undefined }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[15px] font-semibold text-[color:var(--xa-text)]">
                      {xaRender(p.icon)} {xaRender(p.name)}
                    </p>
                    <span
                      className="text-[11px] font-bold uppercase tracking-wide rounded-full px-2 py-1 border"
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
                        {xaRender(GENESIS_TARGETS_BY_ID[p.id].targetEgld)}{' '}
                        <span className="text-sm text-[color:var(--xa-text-muted)]">{xaRender('EGLD · plafond cible')}</span>
                      </p>
                      <p className="text-[12px] mt-1 text-[color:var(--xa-text-secondary)]">
                        {xaRender(`Relevé SC 08/11 : ${AGENT_PACK_SC_SNAPSHOT.pricesEgld[p.id]} EGLD · vente fermée`)}
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
                <p className="text-[11px] text-[color:var(--xa-text-muted)]">
                  {xaRender(`NFT indexés : ${AGENT_PACK_MEDIA_SNAPSHOT.packs[p.id].indexed} · URI média valides : ${AGENT_PACK_MEDIA_SNAPSHOT.packs[p.id].nonEmptyMediaUris}`)}
                </p>
                <Link
                  to={`/packs/${p.id}`}
                  className="block text-center text-[11px] text-[color:var(--xa-accent)] underline"
                >
                  {xaLocalize('Page produit →')}
                </Link>
              </div>
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
            <p role="status" className="rounded-xl border border-amber-500/25 p-3 text-xs text-[color:var(--xa-text-secondary)]">Vente NFT indisponible : prix contractuels non alignés, base EUR du devis non définie, politique 2 (devis frais à la signature) non mise en service. Aucun wallet, checkout, paiement ou mint déclenché par cette fiche.</p>
            <div className="flex flex-wrap gap-3 text-[12px]">
              <Link to={`/packs/${active.id}`} className="text-[color:var(--xa-accent)] underline">
                {xaRender('Page produit →')}
              </Link>
              <Link to="/workspace/agents" className="text-[color:var(--xa-accent)] underline">
                {xaRender('Mes packs →')}
              </Link>
            </div>
          </section>
        ),
      )}


      <div className="rounded-xl border border-[color:var(--xa-border)] px-3 py-3 text-[11px] text-[color:var(--xa-text-muted)] space-y-1">
        <p className="font-medium text-[color:var(--xa-text-secondary)]">{xaRender('Rappel flux')}</p>
        <p>{xaRender('Parcours prévu (non actif) : choisir un pack → signer via wallet → paiement vérifié → NFT livré → accès confirmé.')}</p>
        <p>{xaRender('Pulse débloque hub CC + TCA + LIA full. Yield / Sentinel = salle dédiée.')}</p>
      </div>
    </div>
  )
}
