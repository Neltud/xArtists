/**
 * Accueil protocol-grade — stats + hero + modules (soul-aligned).
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { requestOpenConnect } from '../lib/walletEvents'
import { useWallet } from '../context/WalletContext'
import { useI18n } from '../i18n/I18nContext'

const API = 'https://api.multiversx.com'

const MODULES = [
  { to: '/agents', titleKey: 'nav.packs', blurbKey: 'packs.lead', price: '110 · 75 · 50 €' },
  { to: '/command-center', titleKey: 'cc.title', blurbKey: 'cc.subtitle', price: null },
  { to: '/market', titleKey: 'market.title', blurbKey: 'home.card.gallery.blurb', price: null },
  { to: '/museum', titleKey: 'nav.museum', blurbKey: 'home.card.gallery.blurb', price: null },
  { to: '/lia', titleKey: 'lia.title', blurbKey: 'lia.subtitle', price: null },
  { to: '/tca', titleKey: 'home.card.tca.title', blurbKey: 'home.card.tca.blurb', price: null },
] as const

export default function Dashboard() {
  const { t } = useI18n()
  const { connected } = useWallet()
  const [egld, setEgld] = useState<number | null>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      try {
        const r = await fetch(`${API}/economics`, { cache: 'no-store' })
        if (!r.ok) return
        const j = await r.json()
        const p = Number(j.price || j.egldPrice || 0)
        if (!c && p > 0) setEgld(p)
      } catch {
        /* offline */
      }
    })()
    return () => {
      c = true
    }
  }, [])

  const troApprox = egld != null ? egld * 0.002 : null

  return (
    <div className="xa-page animate-fade-in space-y-10 pb-24">
      {/* Stats strip */}
      <div className="xa-stats-strip">
        <div className="xa-stat">
          <span className="xa-stat__value">{egld != null ? `$${egld.toFixed(2)}` : '—'}</span>
          <span className="xa-stat__label">EGLD</span>
        </div>
        <div className="xa-stat">
          <span className="xa-stat__value">{troApprox != null ? `$${troApprox.toFixed(3)}` : '—'}</span>
          <span className="xa-stat__label">$TRO (approx.)</span>
        </div>
        <div className="xa-stat">
          <span className="xa-stat__value">3</span>
          <span className="xa-stat__label">{t('home.stat.packs')}</span>
        </div>
        <div className="xa-stat">
          <span className="xa-stat__value" style={{ fontSize: '1.1rem' }}>
            {t('home.stat.modeValue')}
          </span>
          <span className="xa-stat__label">{t('home.stat.mode')}</span>
        </div>
      </div>

      {/* Hero */}
      <section className="xa-hero">
        <p className="xa-hero__kicker">{t('home.kicker')}</p>
        <h1 className="xa-hero__title">{t('home.title')}</h1>
        <p className="xa-hero__lead">{t('home.lead')}</p>
        <div className="flex flex-wrap gap-3">
          <Link to="/agents" className="xa-btn-primary">
            {t('home.cta.packs')}
          </Link>
          <Link to="/museum" className="xa-btn-secondary">
            {t('home.cta.gallery')}
          </Link>
          {!connected && (
            <button type="button" onClick={requestOpenConnect} className="xa-btn-secondary">
              {t('common.connect')}
            </button>
          )}
        </div>
      </section>

      {/* Module grid */}
      <section>
        <p className="section-label mb-4">{t('home.plan')}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map(m => (
            <Link key={m.to} to={m.to} className="xa-card block no-underline">
              <h2 className="text-base font-semibold text-[var(--xa-text)] mb-1">{t(m.titleKey)}</h2>
              <p className="text-sm text-[var(--xa-text-secondary)] leading-relaxed line-clamp-3">
                {t(m.blurbKey)}
              </p>
              {m.price && (
                <p className="mt-3 text-xs font-medium text-[var(--xa-accent)]">{m.price}</p>
              )}
            </Link>
          ))}
        </div>
      </section>

      <p className="xa-disclaimer">{t('packs.disclaimer')}</p>
    </div>
  )
}
