/**
 * Public pack monitor: no seeded scores, random ticks or invented trade-direction rows.
 * A verified signal adapter can be added later only with provenance and timestamps.
 */
import type { PackId } from '../config/agentPacks'
import { AGENT_PACKS } from '../config/agentPacks'
import { useI18n } from '../i18n/I18nContext'

export default function PackAgentMonitor({ packId }: { packId: PackId }) {
  const pack = AGENT_PACKS.find(p => p.id === packId)
  const { lang } = useI18n()
  const fr = lang === 'fr'

  return (
    <section className="xa-truth-card" aria-label={fr ? 'Suivi des agents' : 'Agent monitoring'}>
      <div className="xa-truth-card-heading">
        <span className="xa-truth-label">{fr ? 'Suivi transparent · paper-first' : 'Transparent monitoring · paper-first'}</span>
        <h3>{pack?.name || packId}</h3>
        <p>{fr
          ? 'Aucun score, signal d’achat/vente, volume ou événement d’agent ne peut être certifié pour ce pack à ce stade.'
          : 'No score, buy/sell signal, volume or agent event is certified for this pack at this time.'}</p>
      </div>
      <div className="xa-truth-status-grid">
        <div><span>{fr ? 'Flux agent validé' : 'Verified agent feed'}</span><strong>—</strong><small>{fr ? 'Indisponible' : 'Unavailable'}</small></div>
        <div><span>{fr ? 'Dernière action confirmée' : 'Last confirmed action'}</span><strong>—</strong><small>{fr ? 'Aucune donnée certifiée' : 'No certified data'}</small></div>
        <div><span>{fr ? 'Performance' : 'Performance'}</span><strong>—</strong><small>{fr ? 'Non calculable' : 'Not available'}</small></div>
      </div>
      {pack?.strategies?.length ? <div className="xa-truth-strategies">
        <p>{fr ? 'Fonctions envisagées (non actives)' : 'Planned capabilities (not active)'}</p>
        <div>{pack.strategies.map(strategy => <span key={strategy}>{strategy}</span>)}</div>
      </div> : null}
      <p className="xa-truth-footnote">{fr
        ? 'Les données de test générées périodiquement ont été retirées. Aucun ordre, staking, swap ou mint live n’est activé ici.'
        : 'Periodically generated test data has been removed. No live order, staking, swap or mint is activated here.'}</p>
    </section>
  )
}
