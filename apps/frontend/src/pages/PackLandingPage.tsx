/**
 * Genesis NFT pack detail — /packs/:packId. Public discovery only.
 * Owner price targets are not a quote, executable checkout, or contract price.
 * Mainstream EUR service memberships are separate and do NOT include NFTs.
 */
import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Pack3DCockpit from '../components/packs/Pack3DCockpit'
import GenesisCard3D from '../components/packs/GenesisCard3D'
import {
  AGENT_PACK_SC_SNAPSHOT,
  PACK_COMMERCIAL,
  PACK_EDITION,
  PACK_VISUAL,
  getPack,
  type PackId,
} from '../config/agentPacks'
import { PACK_COLLECTIONS } from '../config/packNftMetadata'
import { GENESIS_TARGETS_BY_ID } from '../config/commercialTargets'
import { localizeChild as xaLocalize, renderChild as xaRender } from '../i18n/phraseRuntime'

function limitsFor(id: PackId): string[] {
  if (id === 'pulse') return ['Pas un fonds · pas d’APY promis', 'Signature xPortal obligatoire']
  if (id === 'yield')
    return ['Pas TCA / LIA full', 'Hub limité · focus DeFi', 'Pas un fonds · pas d’APY promis']
  return ['Salle Sentinel uniquement', 'Alertes sparses', 'Pas TCA / trading HF']
}

export default function PackLandingPage() {
  const { packId } = useParams<{ packId: string }>()
  const pack = useMemo(() => getPack(packId || ''), [packId])

  if (!pack || !packId || !['pulse', 'yield', 'sentinel'].includes(packId)) {
    return <Navigate to="/intelligence/agents" replace />
  }

  const id = pack.id
  const vis = PACK_VISUAL[id]
  const ed = PACK_EDITION[id]
  const col = PACK_COLLECTIONS[id]
  const sample =
    id === 'pulse' ? 47 : id === 'yield' ? 112 : 3
  const target = GENESIS_TARGETS_BY_ID[id]

  return (
    <div className="xa-page xa-pack-detail animate-fade-in mx-auto max-w-3xl space-y-9 px-4 pb-28 pt-5 sm:px-7 sm:pt-8">
      <nav aria-label="Fil d’Ariane" className="flex flex-wrap items-center gap-2 text-sm leading-6 text-[color:var(--xa-text-secondary)]">
        <Link to="/" className="hover:underline">
          xArtists
        </Link>
        <span aria-hidden>/</span>
        <Link to="/intelligence/agents" className="hover:underline">
          {xaLocalize('Packs')}
        </Link>
        <span aria-hidden>/</span>
        <span style={{ color: vis.accent }}>{pack.name}</span>
      </nav>

      <header className="xa-pack-header space-y-4">
        <p className="section-label">{xaRender('Genesis · NFT · achat unique · vente fermée')}</p>
        <h1 className="section-title display flex flex-wrap items-center gap-2">
          <span>{xaRender(pack.icon)}</span>
          <span>{xaRender(pack.name)}</span>
          <span
            className="xa-pack-tier rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            style={{ borderColor: vis.border, color: vis.accent, background: vis.accentSoft }}
          >
            {pack.tierLabel}
          </span>
        </h1>
        <p className="section-lead text-[color:var(--xa-text-secondary)]">{xaRender(pack.tagline)}</p>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <strong className="text-3xl tabular-nums text-[color:var(--xa-text)]">{target.targetEgld} EGLD</strong>
          <span className="max-w-xl text-sm leading-6 text-[color:var(--xa-text-secondary)]">
            Plafond cible, pas un devis. Relevé contrat du 08/11 : {AGENT_PACK_SC_SNAPSHOT.pricesEgld[id]} EGLD · vente fermée
          </span>
        </div>
        <p className="text-sm leading-6 text-[color:var(--xa-text-secondary)]">
          {xaRender(ed.seriesName)} · max{' '}
          <span className="tabular-nums font-semibold" style={{ color: vis.accent }}>
            {ed.maxSupply}
          </span>{' '}
          · {xaRender(PACK_COMMERCIAL.billing.replace('_', '-'))} · droits durables (pas d’abonnement sur
          ce pack)
        </p>
      </header>

      <div className="mx-auto w-full max-w-sm px-2">
        <GenesisCard3D id={id} sampleEdition={sample} />
        <p className="mt-3 text-center text-sm leading-6 text-[color:var(--xa-text-secondary)]">
          {xaRender(vis.mediaMotif)} · {xaRender(col?.ticker || '')} · recto peinture · verso HUD
        </p>
      </div>

      <section className="grid gap-4 text-sm leading-6 sm:grid-cols-2">
        <div className="card xa-pack-info-card space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--xa-text-secondary)]">
            {xaLocalize('Inclus')}
          </p>
          <ul className="space-y-1.5 text-[color:var(--xa-text-secondary)]">
            {pack.entitlements.map(e => (
              <li key={e}>✓ {xaRender(e)}</li>
            ))}
          </ul>
        </div>
        <div className="card xa-pack-info-card space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--xa-text-secondary)]">
            {xaLocalize('Limites')}
          </p>
          <ul className="space-y-1.5 text-[color:var(--xa-text-muted)]">
            {limitsFor(id).map(e => (
              <li key={e}>— {xaRender(e)}</li>
            ))}
          </ul>
        </div>
      </section>

      <p role="status" className="xa-pack-status rounded-xl border border-amber-400/60 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
        {xaRender('Packs Genesis : vente suspendue. 33 / 22 / 11 EGLD sont des plafonds de devis commerciaux, pas des prix écrits dans les contrats ni des montants à payer. La politique retenue est un devis EUR/EGLD frais à la signature (TTL prévu 180 secondes) mais sa base EUR n’est pas encore définie. Aucun paiement ni NFT livré.')}
      </p>

      <Pack3DCockpit packId={id} showIntents={false} />

      <section className="card xa-pack-info-card space-y-3">
        <h2 className="text-base font-semibold text-[color:var(--xa-text)]">Achat Genesis indisponible</h2>
        <p className="text-sm leading-7 text-[color:var(--xa-text-secondary)]">
          Une future acquisition nécessitera un wallet MultiversX, un devis frais et une signature distincte,
          ainsi qu’une preuve de livraison on-chain. Aucun paiement, simulation d’achat ou ordre n’est lancé ici.
        </p>
        <Link to="/offres" className="xa-pack-discover inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[color:var(--xa-border-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--xa-text)]">
          Voir les offres disponibles à la découverte
        </Link>
      </section>

      <section className="card xa-pack-info-card space-y-3">
        <h2 className="text-sm font-semibold">Abonnements mainstream · services seulement</h2>
        <p className="text-sm leading-7 text-[color:var(--xa-text-secondary)]">
          Trois mensualités Stripe prévues : 3,79 €, 5,79 € et 9,79 € TTC.
          Elles sont accessibles sans wallet après authentification, ne contiennent aucun NFT,
          ne déclenchent aucun mint et ne donnent aucun pack Genesis. Souscription fermée.
        </p>
        <a
          href="https://xartists.gitbook.io/xartists/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center rounded-xl border border-[color:var(--xa-border)] px-4 text-[13px] text-[color:var(--xa-text-secondary)]"
        >
          Guide officiel · offres &amp; disponibilité
        </a>
      </section>

      <p className="text-sm leading-7 text-[color:var(--xa-text-secondary)]">
        {xaLocalize(
          'Abonnements Stripe mainstream = services périodiques sans NFT, distincts des œuvres Genesis. Aucun paiement n’est actif.',
        )}{' '}
        <Link to="/intelligence/agents" className="text-[color:var(--xa-accent)] underline">
          {xaLocalize('Tous les packs')}
        </Link>
        {' · '}
        <Link to="/workspace/agents" className="text-[color:var(--xa-accent)] underline">
          My Packs
        </Link>
      </p>

    </div>
  )
}
