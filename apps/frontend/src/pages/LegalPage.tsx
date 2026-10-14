/**
 * Mentions legales — full i18n via useI18n.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageGuide from '../components/PageGuide'
import { LINKS, LIA_WALLET } from '../config/links'
import { LEGAL_ENTITY, siretLabel } from '../config/legalEntity'
import { LEGAL_FOOTER_DISCLAIMER } from '../components/FooterLegal'
import { useI18n } from '../i18n/I18nContext'

type Tab = 'mentions' | 'cgu' | 'privacy' | 'risk' | 'process' | 'terms'

export default function LegalPage() {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const [tab, setTab] = useState<Tab>('mentions')
  const year = useMemo(() => new Date().getFullYear(), [])
  const siret = siretLabel()
  const siretMissing = LEGAL_ENTITY.siretStatus !== 'ok'

  const TABS: { id: Tab; labelKey: string }[] = [
    { id: 'mentions', labelKey: 'legal.tab.mentions' },
    { id: 'terms', labelKey: 'legal.tab.terms' },
    { id: 'cgu', labelKey: 'legal.tab.cgu' },
    { id: 'privacy', labelKey: 'legal.tab.privacy' },
    { id: 'risk', labelKey: 'legal.tab.risk' },
    { id: 'process', labelKey: 'legal.tab.process' },
  ]

  useEffect(() => {
    const raw = params.get('tab') as Tab | null
    if (raw && TABS.some(x => x.id === raw)) setTab(raw)
    if (typeof window !== 'undefined' && window.location.pathname.includes('/legal/terms')) {
      setTab('terms')
    }
  }, [params])

  return (
    <div className="animate-fade-in space-y-5 pb-12 max-w-2xl">
      <PageGuide page="home" />
      <header className="space-y-1">
        <p className="section-label text-zinc-400">{t('legal.sectionLabel')}</p>
        <h1 className="page-title">{t('legal.title')}</h1>
        <p className="page-sub">{t('legal.subtitle')}</p>
      </header>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-zinc-400 leading-relaxed">
        {LEGAL_FOOTER_DISCLAIMER}
      </div>
      {siretMissing && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-[12px] text-amber-100/90">
          {t('legal.siretMissing')}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              tab === item.id
                ? 'border-white/25 bg-white/10 text-white'
                : 'border-white/10 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>
      <article className="card text-sm text-zinc-400 space-y-3 leading-relaxed">
        {tab === 'terms' && (
          <>
            <h2 className="text-base font-semibold text-white">{t('legal.terms.1.title')}</h2>
            <p>{t('legal.terms.1.body')}</p>
            <h2 className="text-base font-semibold text-white pt-2">{t('legal.terms.2.title')}</h2>
            <p>{t('legal.terms.2.body')}</p>
            <h2 className="text-base font-semibold text-white pt-2">{t('legal.terms.3.title')}</h2>
            <p>{t('legal.terms.3.body')}</p>
            <h2 className="text-base font-semibold text-white pt-2">{t('legal.terms.4.title')}</h2>
            <p>{t('legal.terms.4.body')}</p>
            <h2 className="text-base font-semibold text-white pt-2">{t('legal.terms.5.title')}</h2>
            <p>{t('legal.terms.5.body')}</p>
          </>
        )}
        {tab === 'mentions' && (
          <>
            <h2 className="text-base font-semibold text-white">{t('legal.mentions.editor')}</h2>
            <p>
              <strong className="text-zinc-200">{LEGAL_ENTITY.productName}</strong> —{' '}
              <strong className="text-zinc-200">{LEGAL_ENTITY.publisherName}</strong>.
            </p>
            <p>
              <span className="text-zinc-300">{LEGAL_ENTITY.legalForm}</span>
            </p>
            <p>
              SIRET:{' '}
              <span className={`font-mono text-[13px] ${siretMissing ? 'text-amber-300' : 'text-zinc-300'}`}>
                {siret}
              </span>
            </p>
            <p>
              {LEGAL_ENTITY.country}. {LEGAL_ENTITY.addressLine}.
            </p>
            <p>
              <a className="text-cyan-300/90 hover:underline" href={LINKS.github} target="_blank" rel="noreferrer">
                Neltud/xArtists
              </a>
            </p>
            <h2 className="text-base font-semibold text-white pt-2">{t('legal.mentions.hosting')}</h2>
            <p>
              {LEGAL_ENTITY.hoster}. {t('legal.mentions.hostingBody')} ({LEGAL_ENTITY.chain}).
            </p>
            <h2 className="text-base font-semibold text-white pt-2">{t('legal.mentions.contact')}</h2>
            <p>
              {LEGAL_ENTITY.contact}
              {LEGAL_ENTITY.contactEmail ? ` · ${LEGAL_ENTITY.contactEmail}` : ''}.
            </p>
            <p>
              {t('legal.mentions.liaWallet')}{' '}
              <code className="text-[11px] text-zinc-500 break-all">{LIA_WALLET}</code>
            </p>
            <p className="text-[11px] text-zinc-600">
              © {year} {LEGAL_ENTITY.publisherName} / {LEGAL_ENTITY.productName}.
            </p>
          </>
        )}
        {tab === 'cgu' && (
          <>
            <h2 className="text-base font-semibold text-white">{t('legal.cgu.title')}</h2>
            <p>{t('legal.cgu.intro')}</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-zinc-300">{t('legal.cgu.packs')}</strong>
              </li>
              <li>
                <strong className="text-zinc-300">{t('legal.cgu.lia')}</strong>
              </li>
              <li>{t('legal.cgu.sig')}</li>
              <li>{t('legal.cgu.noLiaWallet')}</li>
            </ul>
          </>
        )}
        {tab === 'privacy' && (
          <>
            <h2 className="text-base font-semibold text-white">{t('legal.privacy.title')}</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>{t('legal.privacy.1')}</li>
              <li>{t('legal.privacy.2')}</li>
              <li>{t('legal.privacy.3')}</li>
              <li>{t('legal.privacy.4')}</li>
            </ul>
          </>
        )}
        {tab === 'risk' && (
          <>
            <h2 className="text-base font-semibold text-white">{t('legal.risk.title')}</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>{t('legal.risk.1')}</li>
              <li>{t('legal.risk.2')}</li>
              <li>{t('legal.risk.3')}</li>
              <li>{t('legal.risk.4')}</li>
            </ul>
          </>
        )}
        {tab === 'process' && (
          <>
            <h2 className="text-base font-semibold text-white">{t('legal.process.title')}</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong className="text-zinc-300">{t('legal.process.1')}</strong>
              </li>
              <li>
                <strong className="text-zinc-300">{t('legal.process.2')}</strong>
              </li>
              <li>
                <strong className="text-zinc-300">{t('legal.process.3')}</strong>
              </li>
            </ol>
          </>
        )}
      </article>
      <p className="text-[11px] text-zinc-600">
        <Link to="/" className="text-cyan-300/90 hover:underline">
          {t('legal.nav.home')}
        </Link>
        {' · '}
        <Link to="/agents" className="text-cyan-300/90 hover:underline">
          {t('legal.nav.packs')}
        </Link>
      </p>
    </div>
  )
}
