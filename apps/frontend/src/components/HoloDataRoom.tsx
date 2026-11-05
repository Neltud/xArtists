/**
 * Static pack overview. Deliberately does not render telemetry or animations:
 * until a timestamped, provenance-checked pack signal exists, motion would be misleading.
 */
import type { PackId } from '../config/agentPacks'
import { useI18n } from '../i18n/I18nContext'

type Props = {
  mode?: PackId | 'hub'
  sentiment?: number // Legacy callers: not verified agent telemetry.
  volatility?: number // Legacy callers: not verified agent telemetry.
  height?: number
}

const NAMES: Record<PackId | 'hub', string> = {
  pulse: 'Pulse',
  yield: 'Yield',
  sentinel: 'Sentinel',
  hub: 'LIA',
}

export default function HoloDataRoom({ mode = 'hub', height = 520 }: Props) {
  const { lang } = useI18n()
  const fr = lang === 'fr'
  const name = NAMES[mode] || NAMES.hub

  return (
    <section className="xa-truth-card xa-holo-static" style={{ minHeight: Math.min(height, 320) }} aria-label={fr ? 'État des signaux du pack' : 'Pack signal status'}>
      <div className="xa-truth-card-heading">
        <span className="xa-truth-label">{fr ? 'Vue statique · aucun signal live' : 'Static overview · no live signals'}</span>
        <h3>{name}</h3>
        <p>{fr
          ? 'Aucun flux d’agent authentifié et horodaté n’est actuellement relié à cette visualisation.'
          : 'No authenticated, timestamped agent feed is connected to this view.'}</p>
      </div>
      <div className="xa-truth-status-grid">
        <div><span>{fr ? 'Signaux de marché' : 'Market signals'}</span><strong>—</strong><small>{fr ? 'Non vérifiés' : 'Not verified'}</small></div>
        <div><span>{fr ? 'Actions de l’agent' : 'Agent actions'}</span><strong>—</strong><small>{fr ? 'Aucune exécution attestée' : 'No verified execution'}</small></div>
        <div><span>{fr ? 'Dernière mise à jour' : 'Last update'}</span><strong>—</strong><small>{fr ? 'Source indisponible' : 'No source available'}</small></div>
      </div>
      <p className="xa-truth-footnote">{fr
        ? 'Ancienne scène holographique suspendue : les oscillations et valeurs illustratives ne représentent pas LIA, le marché ni la blockchain. Mode paper-first.'
        : 'Previous holographic scene suspended: illustrative oscillations and values do not represent LIA, the market or blockchain. Paper-first mode.'}</p>
    </section>
  )
}
