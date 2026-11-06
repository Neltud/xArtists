/** Public Pulse/Yield/Sentinel status; no synthetic numbers or moving proxy bars. */
import { Link } from 'react-router-dom'

type Props = {
  room?: 'hub' | 'pulse' | 'yield' | 'sentinel'
  paper?: boolean
  sentiment?: number // deprecated: unverified caller input
  volatility?: number // deprecated: unverified caller input
  interactive?: boolean
  pulseSpeed?: number
  color?: [number, number, number]
  colorRgb?: [number, number, number]
}

const LABELS = {
  hub: 'LIA · Command Center',
  pulse: 'Pulse · marché',
  yield: 'Yield · liquidité',
  sentinel: 'Sentinel · risque',
}

export default function CommandWall({ room = 'hub' }: Props) {
  return (
    <section className="xa-truth-card" aria-label="État vérifié des packs">
      <div className="xa-truth-card-heading">
        <span className="xa-truth-label">Paper-first · aucune télémétrie agent live vérifiée</span>
        <h3>{LABELS[room]}</h3>
        <p>
          Les anciennes jauges de sentiment, volatilité, volume, APR et confiance
          étaient des proxys illustratifs. Elles sont suspendues afin de ne pas
          suggérer de trading actif ou de performance attestée.
        </p>
      </div>
      <div className="xa-truth-status-grid">
        <div><span>Signaux agents</span><strong>—</strong><small>Flux authentifié indisponible</small></div>
        <div><span>Mesures du pack</span><strong>—</strong><small>Aucune mesure certifiée</small></div>
        <div><span>Transactions live</span><strong>—</strong><small>Pas de preuve d'exécution · mode paper</small></div>
      </div>
      <p className="xa-truth-footnote">
        Les relevés MultiversX et les instantanés LIA horodatés sont consultables
        séparément. Ils ne certifient pas de signaux ni d'ordres pour ce pack.
      </p>
      <div className="xa-truth-links">
        <Link to="/lia">Consulter les sources LIA</Link>
        <Link to="/go-live">Statut public</Link>
      </div>
    </section>
  )
}
