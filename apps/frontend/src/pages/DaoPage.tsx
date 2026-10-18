/** DAO — gouvernance + pouvoir de vote — protocol UI. */
import { Link } from 'react-router-dom'
import DaoGovernance from '../components/DaoGovernance'
import { useI18n } from '../i18n/I18nContext'

export default function DaoPage() {
  const { t, lang } = useI18n()
  const isFr = lang === 'fr'

  return (
    <div className="xa-page animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="xa-hero" style={{ paddingTop: '1.25rem', maxWidth: '100%' }}>
        <p className="xa-hero__kicker">{t('dao.kicker') || 'DAO'}</p>
        <h1 className="xa-hero__title">{t('dao.title') || 'Governance'}</h1>
        <p className="xa-hero__lead">
          {t('dao.lead') ||
            (isFr
              ? 'Propositions et pouvoir de vote des holders / LP.'
              : 'Proposals and voting power for holders / LP.')}
        </p>
      </header>
      <DaoGovernance />
      <div className="flex flex-wrap gap-2 text-sm">
        <Link to="/staking" className="xa-btn-secondary text-sm">
          {t('staking.title')}
        </Link>
        <Link to="/tro" className="xa-btn-secondary text-sm">
          $TRO
        </Link>
        <Link to="/lp" className="xa-btn-secondary text-sm">
          LP
        </Link>
      </div>
      <p className="xa-disclaimer">
        {isFr
          ? 'Gouvernance on-chain. Pas un produit d’investissement.'
          : 'On-chain governance. Not an investment product.'}
      </p>
    </div>
  )
}
