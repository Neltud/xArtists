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
    <div className="xa-page animate-fade-in space-y-8 pb-24 max-w-3xl mx-auto">
      <nav className="text-[12px] text-[color:var(--xa-text-muted)] flex flex-wrap gap-1 items-center">
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

      <header className="space-y-3">
        <p className="section-label">{xaRender('Genesis · NFT · achat unique · vente fermée')}</p>
        <h1 className="section-title display flex flex-wrap items-center gap-2">
          <span>{xaRender(pack.icon)}</span>
          <span>{xaRender(pack.name)}</span>
          <span
            className="text-[11px] font-semibold uppercase tracking-wider rounded-full border px-2 py-0.5"
            style={{ borderColor: vis.border, color: vis.accent, background: vis.accentSoft }}
          >
            {pack.tierLabel}
          </span>
        </h1>
        <p className="section-lead text-[color:var(--xa-text-secondary)]">{xaRender(pack.tagline)}</p>
        <div className="flex flex-wrap gap-3 items-baseline">
          <strong className="text-3xl tabular-nums text-[color:var(--xa-text)]">{target.targetEgld} EGLD</strong>
          <span className="text-[14px] text-[color:var(--xa-text-muted)]">
            Plafond cible, pas un devis. Relevé contrat du 08/11 : {AGENT_PACK_SC_SNAPSHOT.pricesEgld[id]} EGLD · vente fermée
          </span>
        </div>
        <p className="text-[12px] text-[color:var(--xa-text-muted)]">
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
        <p className="mt-2 text-center text-[12px] text-[color:var(--xa-text-muted)]">
          {xaRender(vis.mediaMotif)} · {xaRender(col?.ticker || '')} · recto peinture · verso HUD
        </p>
      </div>

      <section className="grid sm:grid-cols-2 gap-4 text-[13px]">
        <div className="card space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-[color:var(--xa-text-muted)]">
            {xaLocalize('Inclus')}
          </p>
          <ul className="space-y-1.5 text-[color:var(--xa-text-secondary)]">
            {pack.entitlements.map(e => (
              <li key={e}>✓ {xaRender(e)}</li>
            ))}
          </ul>
        </div>
        <div className="card space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-[color:var(--xa-text-muted)]">
            {xaLocalize('Limites')}
          </p>
          <ul className="space-y-1.5 text-[color:var(--xa-text-muted)]">
            {limitsFor(id).map(e => (
              <li key={e}>— {xaRender(e)}</li>
            ))}
          </ul>
        </div>
      </section>

      <p role="status" className="rounded-xl border border-amber-300/25 bg-amber-300/[0.06] px-4 py-3 text-[12px] text-[color:var(--xa-text-secondary)]">
        {xaRender('Packs Genesis : vente suspendue. 33 / 22 / 11 EGLD sont des plafonds de devis commerciaux, pas des prix écrits dans les contrats ni des montants à payer. La politique retenue est un devis EUR/EGLD frais à la signature (TTL prévu 180 secondes) mais sa base EUR n’est pas encore définie. Aucun paiement ni NFT livré.')}
      </p>

      <Pack3DCockpit packId={id} showIntents={false} />

      <section className="card space-y-3" style={{ borderColor: vis.border }}>
        <h2 className="text-sm font-semibold text-[color:var(--xa-text)]">Achat Genesis indisponible</h2>
        <p className="text-[12px] text-[color:var(--xa-text-muted)]">
          Une future acquisition nécessitera un wallet MultiversX, un devis frais et une signature distincte,
          ainsi qu’une preuve de livraison on-chain. Aucun paiement, simulation d’achat ou ordre n’est lancé ici.
        </p>
        <Link to="/offres" className="inline-flex min-h-[44px] items-center rounded-xl border border-[color:var(--xa-border)] px-4 text-[13px] text-[color:var(--xa-text-secondary)]">
          Voir les offres disponibles à la découverte
        </Link>
      </section>

      <section className="card space-y-2">
        <h2 className="text-sm font-semibold">Abonnements mainstream · services seulement</h2>
        <p className="text-[12px] text-[color:var(--xa-text-muted)]">
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

      <p className="text-[11px] text-[color:var(--xa-text-muted)] leading-relaxed">
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
