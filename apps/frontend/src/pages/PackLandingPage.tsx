/**
 * Page produit miroir Whop — /packs/:packId
 * Achat unique + œuvre SFT Genesis (COMMERCIAL_MODEL). Membership TCA = produit distinct.
 */
import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import PackCheckout from '../components/PackCheckout'
import PackOpenTheater from '../components/PackOpenTheater'
import Pack3DCockpit from '../components/packs/Pack3DCockpit'
import GenesisCard3D from '../components/packs/GenesisCard3D'
import {
  AGENT_PACKS,
  PACK_COMMERCIAL,
  PACK_EDITION,
  PACK_VISUAL,
  getPack,
  type PackId,
} from '../config/agentPacks'
import { PACK_COLLECTIONS } from '../config/packNftMetadata'
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
  const [theater, setTheater] = useState<PackId | null>(null)

  if (!pack || !packId || !['pulse', 'yield', 'sentinel'].includes(packId)) {
    return <Navigate to="/intelligence/agents" replace />
  }

  const id = pack.id
  const vis = PACK_VISUAL[id]
  const ed = PACK_EDITION[id]
  const col = PACK_COLLECTIONS[id]
  const theaterPack = AGENT_PACKS.find(p => p.id === theater) || null
  const sample =
    id === 'pulse' ? 47 : id === 'yield' ? 112 : 3

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
        <p className="section-label">{xaRender('Genesis · one-time · miroir Whop')}</p>
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
          <strong className="text-3xl tabular-nums text-[color:var(--xa-text)]">{pack.priceEur.list} €</strong>
          <span className="text-[14px] text-[color:var(--xa-text-muted)]">
            ≈ {pack.priceEgld.list} EGLD · estimation catalogue, non contractuelle
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
        {xaRender('Vitrine Genesis en mode aperçu : aucun prix affiché ne constitue un devis payable. Paiement et livraison NFT restent bloqués tant que les validations on-chain, API, banque et opérateur ne sont pas réunies.')}
      </p>

      <Pack3DCockpit packId={id} showIntents={false} />

      <section className="card space-y-3" style={{ borderColor: vis.border }}>
        <h2 className="text-sm font-semibold text-[color:var(--xa-text)]">{xaLocalize('Checkout dApp')}</h2>
        <p className="text-[12px] text-[color:var(--xa-text-muted)]">
          {xaLocalize(
            'Paiement one-time via access-api / PayBox. Mint SFT + My Packs après validation. Mode paper jusqu’au GO.',
          )}
        </p>
        <PackCheckout packId={id} onPaperDone={pid => setTheater(pid)} onClear={() => undefined} />
      </section>

      <section className="card space-y-2">
        <h2 className="text-sm font-semibold">{xaLocalize('Whop · abonnement TCA distinct')}</h2>
        <p className="text-[12px] text-[color:var(--xa-text-muted)]">
          {xaLocalize(
            'Les abonnements mensuels Whop donnent accès aux services du plan TCA. Ils ne sont pas un moyen de régler ce pack Genesis, ne comprennent pas ce NFT et ne livrent aucun droit on-chain Genesis.',
          )}
        </p>
        <p className="text-[12px] text-[color:var(--xa-text-muted)]">
          {xaLocalize('Le paiement et le mint Genesis sont soumis au statut de disponibilité et aux conditions du checkout dApp.')}
        </p>
        <a
          href="https://xartists.gitbook.io/xartists/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center rounded-xl border border-[color:var(--xa-border)] px-4 text-[13px] text-[color:var(--xa-text-secondary)]"
        >
          Guide officiel · offres &amp; disponibilité →
        </a>
      </section>

      <p className="text-[11px] text-[color:var(--xa-text-muted)] leading-relaxed">
        {xaLocalize(
          'Abonnement TCA Membership = produit Whop séparé (services périodiques, sans NFT Genesis). Packs = propriété durable.',
        )}{' '}
        <Link to="/intelligence/agents" className="text-[color:var(--xa-accent)] underline">
          {xaLocalize('Tous les packs')}
        </Link>
        {' · '}
        <Link to="/workspace/agents" className="text-[color:var(--xa-accent)] underline">
          My Packs
        </Link>
      </p>

      {theaterPack && <PackOpenTheater pack={theaterPack} open onClose={() => setTheater(null)} />}
    </div>
  )
}
