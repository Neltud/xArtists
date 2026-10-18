/** Packs Agents — Pulse / Yield / Sentinel — soul-aligned UI + i18n. */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PackCheckout from '../components/PackCheckout'
import PackOpenTheater from '../components/PackOpenTheater'
import Pack3DCockpit from '../components/packs/Pack3DCockpit'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { PACK_COLLECTIONS } from '../config/packNftMetadata'
import { useI18n } from '../i18n/I18nContext'

const PACKS = AGENT_PACKS

const NAME_KEY: Record<PackId, string> = {
  pulse: 'packs.pulse.name',
  yield: 'packs.yield.name',
  sentinel: 'packs.sentinel.name',
}
const TAG_KEY: Record<PackId, string> = {
  pulse: 'packs.pulse.tagline',
  yield: 'packs.yield.tagline',
  sentinel: 'packs.sentinel.tagline',
}
const EUR: Record<PackId, number> = { pulse: 110, yield: 75, sentinel: 50 }

function limitsFor(id: PackId, lang: string): string[] {
  if (lang === 'fr') {
    if (id === 'pulse') return ['Pas un fonds · pas d’APY promis', 'Signature xPortal obligatoire']
    if (id === 'yield') return ['Pas TCA / LIA full', 'Hub limité · focus DeFi', 'Pas un fonds · pas d’APY promis']
    return ['Salle Sentinel uniquement', 'Alertes sparses', 'Pas TCA / trading HF']
  }
  if (id === 'pulse') return ['Not a fund · no promised APY', 'xPortal signature required']
  if (id === 'yield') return ['No full TCA / LIA', 'Limited hub · DeFi focus', 'Not a fund · no promised APY']
  return ['Sentinel room only', 'Sparse alerts', 'No TCA / HF trading']
}

export default function Agents() {
  const { t, lang } = useI18n()
  const [selected, setSelected] = useState<PackId | null>(null)
  const [theater, setTheater] = useState<PackId | null>(null)
  const active = PACKS.find(p => p && p.id === selected) || null
  const theaterPack = PACKS.find(p => p && p.id === theater) || null

  return (
    <div className="xa-page animate-fade-in space-y-8 pb-20 max-w-3xl mx-auto">
      <header className="xa-hero" style={{ paddingTop: '1.5rem', maxWidth: '100%' }}>
        <p className="xa-hero__kicker">{t('packs.title')}</p>
        <h1 className="xa-hero__title">Pulse · Yield · Sentinel</h1>
        <p className="xa-hero__lead">{t('packs.lead')}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {PACKS.map(p => {
          const col = PACK_COLLECTIONS[p.id]
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              className={`xa-card text-left w-full ${
                selected === p.id ? 'ring-1 ring-white/20' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <p className="text-[15px] font-semibold text-[var(--xa-text)]">{t(NAME_KEY[p.id])}</p>
                <span className="text-[9px] font-bold uppercase tracking-wide rounded-full px-1.5 py-0.5 border border-[var(--xa-border)] text-[var(--xa-text-muted)]">
                  {p.tierLabel}
                </span>
              </div>
              <p className="text-[10px] mono text-[var(--xa-text-muted)] mt-1">{col?.ticker}</p>
              <p className="text-[12px] text-[var(--xa-text-secondary)] mt-1.5 leading-snug">
                {t(TAG_KEY[p.id])}
              </p>
              <p className="mt-3 text-xl text-[var(--xa-text)] tabular-nums">
                {EUR[p.id]} €
                <span className="text-xs text-[var(--xa-text-muted)] ml-2">
                  · {p.priceEgld?.list ?? 10} EGLD
                </span>
              </p>
              <p className="text-[10px] text-[var(--xa-text-muted)] mt-1">
                ×{p.signalIntensity} · {p.features.actionsPerWeek}
              </p>
            </button>
          )
        })}
      </div>

      {active && (
        <section className="xa-card space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-[var(--xa-text)]">
              {t(NAME_KEY[active.id])}{' '}
              <span className="text-[10px] text-[var(--xa-text-muted)] font-normal">{active.tierLabel}</span>
            </h2>
            <p className="text-[11px] mono text-[var(--xa-text-muted)] mt-0.5">
              {PACK_COLLECTIONS[active.id]?.ticker}
            </p>
            <p className="text-[13px] text-[var(--xa-text-secondary)] mt-1">{t(TAG_KEY[active.id])}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-[12px]">
            <div>
              <p className="text-[10px] uppercase text-[var(--xa-text-muted)] mb-1">
                {lang === 'fr' ? 'Inclus' : 'Included'}
              </p>
              <ul className="space-y-1 text-[var(--xa-text-secondary)]">
                {active.entitlements.map(e => (
                  <li key={e}>✓ {e}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] uppercase text-[var(--xa-text-muted)] mb-1">
                {lang === 'fr' ? 'Limites' : 'Limits'}
              </p>
              <ul className="space-y-1 text-[var(--xa-text-muted)]">
                {limitsFor(active.id, lang).map(e => (
                  <li key={e}>— {e}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {active.strategies.map(s => (
              <span
                key={s}
                className="rounded-full border border-[var(--xa-border)] bg-black/40 px-2 py-0.5 text-[10px] mono text-[var(--xa-text-muted)]"
              >
                {s}
              </span>
            ))}
          </div>

          <Pack3DCockpit packId={active.id} showIntents={false} />
          <PackCheckout
            packId={active.id}
            onPaperDone={id => setTheater(id)}
            onClear={() => setSelected(null)}
          />
          <Link to="/my-packs" className="text-[12px] text-[var(--xa-accent)] underline">
            {lang === 'fr' ? 'Ouvrir mes salles →' : 'Open my rooms →'}
          </Link>
        </section>
      )}

      {theaterPack && <PackOpenTheater pack={theaterPack} open onClose={() => setTheater(null)} />}

      <p className="xa-disclaimer">{t('packs.disclaimer')}</p>

      <div className="flex flex-wrap gap-3 text-[12px]">
        <Link to="/sale" className="text-[var(--xa-text-secondary)] hover:text-[var(--xa-text)]">
          {t('sale.title')} →
        </Link>
        <Link to="/command-center" className="text-[var(--xa-text-secondary)] hover:text-[var(--xa-text)]">
          {t('cc.title')} →
        </Link>
        <Link to="/tca" className="text-[var(--xa-text-secondary)] hover:text-[var(--xa-text)]">
          TCA →
        </Link>
        <Link to="/lia" className="text-[var(--xa-text-secondary)] hover:text-[var(--xa-text)]">
          {t('lia.title')} →
        </Link>
      </div>
    </div>
  )
}
