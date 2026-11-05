/**
 * Truthful public cockpit. No fabricated consensus, model votes, TRO price,
 * confidence score, target price, impact sentiment or simulated real-time feed.
 */
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import IntentXPortalPanel from '../../command-center/IntentXPortalPanel'

type Props = {
  packId?: string
  compact?: boolean
  className?: string
  showIntents?: boolean
}

export default function Pack3DCockpit({
  packId,
  compact = false,
  className = '',
  showIntents = true,
}: Props) {
  const { lang } = useI18n()
  const fr = lang === 'fr'
  return (
    <div className={className}>
      <section className="xa-truth-card" aria-label={fr ? 'Console des signaux' : 'Signals console'}>
        <div className="xa-truth-card-heading">
          <span className="xa-truth-label">{fr ? 'LIA · mode paper-first' : 'LIA · paper-first mode'}</span>
          <h3>{packId ? `Pack ${packId}` : 'LIA'} · {fr ? 'État vérifié' : 'Verified status'}</h3>
          <p>{fr
            ? 'Aucun consensus multi-modèle ni ordre live confirmé. Les anciens scores, cours $TRO approximatifs et avis IA simulés ne sont plus affichés.'
            : 'No confirmed multi-model consensus or live order. Previous scores, estimated $TRO prices and synthetic AI opinions are no longer displayed.'}</p>
        </div>
        <div className="xa-truth-status-grid">
          <div><span>{fr ? 'Signal agent attesté' : 'Verified agent signal'}</span><strong>—</strong><small>{fr ? 'Pas de source vérifiée' : 'No verified source'}</small></div>
          <div><span>{fr ? 'Consensus' : 'Consensus'}</span><strong>—</strong><small>{fr ? 'Non disponible' : 'Unavailable'}</small></div>
          <div><span>$TRO</span><strong>—</strong><small>{fr ? 'Aucun prix déduit d’EGLD' : 'No inferred EGLD price'}</small></div>
        </div>
        {!compact && <p className="xa-truth-footnote">{fr
          ? 'Gouvernance : le pouvoir de vote dépend exclusivement du montant de $TRO staké. Les fonctionnalités d’agent sont soumises aux permissions DAO et à des contrôles opérationnels distincts.'
          : 'Governance: voting power depends exclusively on staked $TRO. Agent capabilities require DAO permissions and separate operational checks.'}</p>}
        <div className="xa-truth-links">
          <Link to="/dao">{fr ? 'Gouvernance DAO' : 'DAO governance'}</Link>
          <Link to="/staking">{fr ? 'Staking $TRO' : '$TRO staking'}</Link>
        </div>
      </section>
      {showIntents && <div className="xa-truth-intents">
        <p className="xa-truth-footnote">{fr
          ? 'Module d’intentions distinct · affichage paper-first, pas une preuve d’exécution live.'
          : 'Separate intent module · paper-first display, not proof of live execution.'}</p>
        <IntentXPortalPanel />
      </div>}
    </div>
  )
}
