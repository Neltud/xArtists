/**
 * Page produit miroir Whop — /packs/:packId
 * Achat unique + œuvre SFT Genesis (COMMERCIAL_MODEL). Membership TCA = produit distinct.
 */
import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import PackCheckout from '../components/PackCheckout'
import PackOpenTheater from '../components/PackOpenTheater'
import Pack3DCockpit from '../components/packs/Pack3DCockpit'
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

const WHOP_CHECKOUT: Record<PackId, string> = {
  pulse: 'https://whop.com/checkout/plan_ziaFs2H422RCR',
  yield: 'https://whop.com/checkout/plan_HMn3olyxL2hcV',
  sentinel: 'https://whop.com/checkout/plan_PHJkoYxSIDMub',
}

const WHOP_PRODUCT: Record<PackId, string> = {
  pulse: 'https://whop.com/xartists-niche-mastery/',
  yield: 'https://whop.com/tca-a9/',
  sentinel: 'https://whop.com/xartists-sentinel-platinum/',
}

function limitsFor(id: PackId): string[] {
  if (id === 'pulse') return ['Pas un fonds · pas d’APY promis', 'Signature xPortal obligatoire']
  if (id === 'yield')
    return ['Pas TCA / LIA full', 'Hub limité · focus DeFi', 'Pas un fonds · pas d’APY promis']
  return ['Salle Sentinel uniquement', 'Alertes sparses', 'Pas TCA / trading HF']
}

function PackHeroPlate({ id }: { id: PackId }) {
  const v = PACK_VISUAL[id]
  const layers =
    id === 'pulse'
      ? {
          base: 'linear-gradient(155deg, #0e120a 0%, #1a2210 38%, #0a0c08 100%)',
          veil: 'radial-gradient(ellipse 80% 60% at 28% 32%, rgba(232,245,168,.5), transparent 62%)',
        }
      : id === 'yield'
        ? {
            base: 'linear-gradient(165deg, #0c0d0c 0%, #171917 42%, #0a0b0a 100%)',
            veil: 'radial-gradient(ellipse 70% 55% at 68% 24%, rgba(200,204,196,.38), transparent 58%)',
          }
        : {
            base: 'linear-gradient(148deg, #0c0a12 0%, #16101c 40%, #09080e 100%)',
            veil: 'radial-gradient(ellipse 75% 65% at 50% 85%, rgba(167,139,250,.42), transparent 58%)',
          }
  return (
    <div
      className="relative aspect-square w-full max-w-md overflow-hidden rounded-2xl border mx-auto"
      style={{ borderColor: v.border, boxShadow: v.glow, background: layers.base }}
      aria-hidden
    >
      <div className="absolute inset-0" style={{ background: layers.veil }} />
      <div
        className="absolute inset-0 opacity-[0.35] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%270.45%27/%3E%3C/svg%3E")',
        }}
      />
      <div className="absolute bottom-3 left-3 right-3 flex justify-between text-[11px]">
        <span
          className="rounded-full border px-2 py-0.5 font-semibold uppercase tracking-wider"
          style={{ borderColor: v.border, color: v.accent, background: 'rgba(0,0,0,.5)' }}
        >
          {v.badge}
        </span>
        <span className="text-zinc-400 tabular-nums">SFT · œuvre</span>
      </div>
    </div>
  )
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
            ≈ {pack.priceEgld.list} EGLD · Rule1
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

      <PackHeroPlate id={id} />
      <p className="text-center text-[12px] text-[color:var(--xa-text-muted)]">
        {xaRender(vis.mediaMotif)} · {xaRender(col?.ticker || '')}
      </p>

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
        <h2 className="text-sm font-semibold">{xaLocalize('Whop (fiat catalogue)')}</h2>
        <p className="text-[12px] text-[color:var(--xa-text-muted)]">
          {xaLocalize(
            'Même prix one-time. Les droits on-chain / salle restent activés via la dApp après preuve de paiement.',
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={WHOP_CHECKOUT[id]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center rounded-xl border px-4 text-[13px] font-medium"
            style={{ borderColor: vis.border, color: vis.accent, background: vis.accentSoft }}
          >
            Whop · {pack.priceEur.list} € →
          </a>
          <a
            href={WHOP_PRODUCT[id]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-[color:var(--xa-border)] px-4 text-[13px] text-[color:var(--xa-text-secondary)]"
          >
            Fiche produit Whop →
          </a>
        </div>
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
