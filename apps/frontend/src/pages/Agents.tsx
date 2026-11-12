import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/** Packs Agents — Genesis limited · œuvres série Tuduri. */
import { useEffect, useRef, useState } from 'react'
import IntelligencePath from '../components/intelligence/IntelligencePath'
import { useI18n } from '../i18n/I18nContext'
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
  const { lang } = useI18n()
  const fr = lang === 'fr'
  const genesisRef = useRef<HTMLDetailsElement>(null)
  const [showPacks, setShowPacks] = useState(false)
  const [selected, setSelected] = useState<PackId | null>(null)
  const active = PACKS.find(p => p && p.id === selected) || null

  useEffect(() => {
    const q = params.get('pack')
    if (q === 'pulse' || q === 'yield' || q === 'sentinel') {
      setSelected(q)
      setShowPacks(true)
      if(genesisRef.current)genesisRef.current.open=true
    }
  }, [params])

  return (
    <div className="xa-page xa-agents-discovery animate-fade-in mx-auto max-w-4xl space-y-8 px-4 pb-28 pt-6 sm:px-7">
      <IntelligencePath />
      <header className="xa-intelligence-hero">
        <p className="xa-intelligence-eyebrow">{fr ? '02 · Qui fait quoi ?' : '02 · Who does what?'}</p>
        <h1>{fr ? 'Les agents xOrus, simplement' : 'xOrus agents, made clear'}</h1>
        <p>{fr
          ? 'Trois domaines à comprendre : observer des signaux, explorer les données et surveiller les risques. Il s’agit de rôles présentés en mode paper, pas de robots qui achètent ou vendent pour vous.'
          : 'Three areas to understand: observe signals, explore data, and assess risks. These are paper-mode roles, not bots buying or selling on your behalf.'}</p>
        <p role="status" className="xa-intelligence-status">{fr
          ? 'Mode lecture et simulation. Aucun trading automatique, aucun rendement, aucun achat requis.'
          : 'Read-only and simulation mode. No automated trades, promised returns or purchase required.'}</p>
      </header>
      <section className="space-y-4" aria-label={fr ? 'Les trois rôles' : 'Three agent roles'}>
        <h2 className="text-xl font-semibold">{fr ? 'Que pouvez-vous découvrir ?' : 'What can you explore?'}</h2>
        <div className="xa-intelligence-cards">
          <article className="xa-intelligence-card">
            <p className="xa-intelligence-eyebrow">Pulse · 01</p>
            <h3>{fr ? 'Observer les signaux' : 'Observe signals'}</h3>
            <p>{fr ? 'Comprendre ce qu’un signal de marché décrit, quand il a été publié et ce qui manque pour le vérifier.' : 'Learn what a signal describes, when it was published, and what is still unverified.'}</p>
            <Link to="/xorus">{fr ? 'Voir les signaux xOrus' : 'View xOrus signals'}</Link>
          </article>
          <article className="xa-intelligence-card">
            <p className="xa-intelligence-eyebrow">Yield · 02</p>
            <h3>{fr ? 'Explorer les données' : 'Explore the data'}</h3>
            <p>{fr ? 'Lire des exemples et comprendre les limites des indicateurs, sans les confondre avec une performance réelle.' : 'Read examples and understand indicator limits without mistaking them for real performance.'}</p>
            <Link to="/lab?view=simulation">{fr ? 'Essayer une simulation' : 'Try a simulation'}</Link>
          </article>
          <article className="xa-intelligence-card">
            <p className="xa-intelligence-eyebrow">Sentinel · 03</p>
            <h3>{fr ? 'Identifier les risques' : 'Understand risks'}</h3>
            <p>{fr ? 'Distinguer des données fraîches, anciennes ou absentes et découvrir pourquoi une action non prouvée reste bloquée.' : 'Distinguish fresh, stale and missing data, and see why unverified actions remain blocked.'}</p>
            <Link to="/xorus">{fr ? 'Consulter l’état de xOrus' : 'Check xOrus status'}</Link>
          </article>
        </div>
      </section>
      <details ref={genesisRef} className="xa-intelligence-advanced" onToggle={event=>setShowPacks(event.currentTarget.open)}>
        <summary>{fr ? 'Catalogue Genesis NFT (distinct des agents)' : 'Genesis NFT catalogue (separate from the agents)'}</summary>
        <p className="xa-intelligence-note mt-3 mb-4">{fr
          ? 'Les éditions Pulse, Yield et Sentinel ci-dessous sont des projets de packs NFT. Elles ne donnent aucune preuve de trading actif. Ventes suspendues ; informations historiques conservées pour vérification.'
          : 'Pulse, Yield and Sentinel below are NFT pack concepts, not proof of live automated trading. Sales are suspended; dated records remain available for verification.'}</p>
        {showPacks && <div className="space-y-8">
      <header className="space-y-4 border-b border-[color:var(--xa-border)] pb-7">
        <p className="section-label">{xaRender('Genesis · Limited')}</p>
        <h1 className="section-title display">{xaRender('Pulse · Yield · Sentinel')}</h1>
        <p className="section-lead text-[color:var(--xa-text-secondary)]">
          {xaRender(
            'Packs Genesis NFT en découverte — pas un fonds, pas d’APY promis. Objectifs/plafonds Pulse 33, Yield 22, Sentinel 11 EGLD ; prix de contrat différents. Les ventes et livraisons restent suspendues.',
          )}
        </p>
        <div role="status" className="xa-agent-notice rounded-xl border border-amber-400/60 bg-amber-50 p-4 text-sm leading-7 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
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
        <div className="flex flex-wrap gap-2 text-xs text-[color:var(--xa-text-muted)]">
          <span className="rounded-full border border-[color:var(--xa-border)] px-2 py-0.5">{xaRender('Pulse 333')}</span>
          <span className="rounded-full border border-[color:var(--xa-border)] px-2 py-0.5">{xaRender('Yield 500')}</span>
          <span className="rounded-full border border-[color:var(--xa-border)] px-2 py-0.5">{xaRender('Sentinel 777')}</span>
          <span className="rounded-full border border-[color:var(--xa-accent)]/30 bg-[color:var(--xa-accent-soft)] px-2 py-0.5 text-[color:var(--xa-accent)]">
            {xaRender('Découverte · aucun paiement ni NFT livré')}
          </span>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
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
                  className="card xa-agent-choice w-full min-h-[220px] text-left card-play transition-colors"
                  aria-pressed={isSel}
                  style={{ borderColor: isSel ? vis.border : undefined }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[15px] font-semibold text-[color:var(--xa-text)]">
                      {xaRender(p.icon)} {xaRender(p.name)}
                    </p>
                    <span
                      className="xa-agent-tier rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
                      style={{ borderColor: vis.border, color: vis.accent, background: vis.accentSoft }}
                    >
                      {xaRender(p.tierLabel)}
                    </span>
                  </div>
                  <p className="mt-2 break-all font-mono text-xs leading-5 text-[color:var(--xa-text-secondary)]">{xaRender(col?.ticker)}</p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--xa-text-secondary)]">{xaRender(p.tagline)}</p>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-xl tabular-nums text-[color:var(--xa-text)]">
                        {xaRender(GENESIS_TARGETS_BY_ID[p.id].targetEgld)}{' '}
                        <span className="text-sm text-[color:var(--xa-text-muted)]">{xaRender('EGLD · plafond cible')}</span>
                      </p>
                      <p className="text-sm mt-1 text-[color:var(--xa-text-secondary)]">
                        {xaRender(`Relevé SC 08/11 : ${AGENT_PACK_SC_SNAPSHOT.pricesEgld[p.id]} EGLD · vente fermée`)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums" style={{ color: vis.accent }}>
                        {xaRender(String(ed.maxSupply))}
                      </p>
                      <p className="text-xs uppercase tracking-wider text-[color:var(--xa-text-muted)]">{xaRender('max')}</p>
                    </div>
                  </div>
                  <p className="text-xs mt-2 text-[color:var(--xa-text-muted)]">
                    {xaRender('Signaux ×')}
                    {xaRender(String(p.signalIntensity))} · {xaRender(p.features.actionsPerWeek)}
                  </p>
                </button>
                <p className="text-xs text-[color:var(--xa-text-muted)]">
                  {xaRender(`NFT indexés : ${AGENT_PACK_MEDIA_SNAPSHOT.packs[p.id].indexed} · URI média valides : ${AGENT_PACK_MEDIA_SNAPSHOT.packs[p.id].nonEmptyMediaUris}`)}
                </p>
                <Link
                  to={`/packs/${p.id}`}
                  className="block text-center text-xs text-[color:var(--xa-accent)] underline"
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
            className="card xa-agent-selected space-y-5"
            style={{ borderColor: PACK_VISUAL[active.id].border }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[color:var(--xa-text)]">
                  {xaRender(active.icon)} {xaRender(active.name)}{' '}
                  <span className="text-xs font-normal text-[color:var(--xa-text-muted)]">{xaRender(active.tierLabel)}</span>
                </h2>
                <p className="text-xs mono mt-0.5 text-[color:var(--xa-text-muted)]">
                  {xaRender(PACK_COLLECTIONS[active.id]?.ticker)} · {xaRender(active.seriesName)}
                </p>
                <p className="text-[13px] mt-1 text-[color:var(--xa-text-secondary)]">{xaRender(active.activity)}</p>
                <p className="text-xs mt-1 text-[color:var(--xa-text-muted)]">
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
                <p className="text-xs uppercase tracking-widest text-[color:var(--xa-text-muted)]">
                  {xaRender('édition max')}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs uppercase text-[color:var(--xa-text-muted)] mb-1">{xaRender('Inclus')}</p>
                <ul className="space-y-1 text-[color:var(--xa-text-secondary)]">
                  {xaRender(active.entitlements.map(e => (
                    <li key={e}>✓ {xaRender(e)}</li>
                  )))}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase text-[color:var(--xa-text-muted)] mb-1">{xaRender('Limites')}</p>
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
                    className="rounded-full border border-[color:var(--xa-border)] px-2 py-0.5 text-xs mono text-[color:var(--xa-text-muted)]"
                  >
                    {xaRender(s)}
                  </span>
                )),
              )}
            </div>

            <Pack3DCockpit packId={active.id} showIntents={false} />
            <p role="status" className="xa-agent-notice rounded-xl border border-amber-400/60 bg-amber-50 p-4 text-sm leading-7 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">Vente NFT indisponible : prix contractuels non alignés, base EUR du devis non définie, politique 2 (devis frais à la signature) non mise en service. Aucun wallet, checkout, paiement ou mint déclenché par cette fiche.</p>
            <div className="flex flex-wrap gap-3 text-sm">
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


      <div className="rounded-xl border border-[color:var(--xa-border)] bg-[color:var(--xa-surface)] px-4 py-4 text-sm leading-7 text-[color:var(--xa-text-secondary)] space-y-2">
        <p className="font-medium text-[color:var(--xa-text-secondary)]">{xaRender('Rappel flux')}</p>
        <p>{xaRender('Parcours prévu (non actif) : choisir un pack → signer via wallet → paiement vérifié → NFT livré → accès confirmé.')}</p>
        <p>{xaRender('Pulse débloque hub CC + TCA + LIA full. Yield / Sentinel = salle dédiée.')}</p>
      </div>
        </div>}
      </details>
    </div>
  )
}
