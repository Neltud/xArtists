import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/** DAO — gouvernance + pouvoir de vote. */
import { Link } from 'react-router-dom'
import DaoGovernance from '../components/DaoGovernance'
import { useI18n } from '../i18n/I18nContext'

export default function DaoPage() {
  const { t } = useI18n()
  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto pb-16">
      <header className="space-y-1">
        <p className="section-label">{xaRender(t('dao.kicker'))}</p>
        <h1 className="section-title display text-2xl">{xaRender(t('dao.title'))}</h1>
        <p className="text-sm text-zinc-400">{xaRender(t('dao.lead'))}</p>
      </header>
      <DaoGovernance />
      <div className="flex flex-wrap gap-2 text-sm">
        <Link to="/staking" className="btn-secondary text-sm">
          {xaRender("Staking & Yield ")}</Link>
        <Link to="/tro" className="btn-secondary text-sm">
          {xaRender("Tokenomics $TRO ")}</Link>
      </div>
    </div>
  )
}
