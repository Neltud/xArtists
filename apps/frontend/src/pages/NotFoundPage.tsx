/** True 404 — legacy aliases handled separately in App. */
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

export default function NotFoundPage() {
  const { t, lang } = useI18n()
  const isFr = lang === 'fr'

  return (
    <div className="xa-page animate-fade-in mx-auto max-w-lg px-4 py-20 text-center">
      <p className="xa-hero__kicker">404</p>
      <h1 className="xa-hero__title" style={{ fontSize: '2rem' }}>
        {t('error.notFound') || (isFr ? 'Page introuvable' : 'Page not found')}
      </h1>
      <p className="xa-hero__lead text-center">
        {isFr
          ? 'Cette URL n’existe pas ou a été déplacée. Les anciennes routes sont redirigées automatiquement.'
          : 'This URL does not exist or moved. Legacy routes redirect automatically.'}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/" className="xa-btn-primary">
          {t('nav.home')}
        </Link>
        <Link to="/museum" className="xa-btn-secondary">
          {t('nav.museum')}
        </Link>
        <Link to="/agents" className="xa-btn-secondary">
          {t('nav.packs')}
        </Link>
      </div>
    </div>
  )
}
