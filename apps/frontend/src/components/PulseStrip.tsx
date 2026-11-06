/** Public pulse display is fail-closed until a timestamped, authenticated feed exists. */
import { usePulse } from '../hooks/usePulse'

export default function PulseStrip() {
  const { source } = usePulse()
  return (
    <section className="xa-truth-card" aria-label="État du flux Pulse">
      <div className="xa-truth-card-heading">
        <span className="xa-truth-label">The Pulse · source {source}</span>
        <h3>Signal indisponible</h3>
        <p>Cycle de démonstration suspendu. Aucun score, indicateur pulsant ou sentiment n'est présenté comme une donnée d'agent ou de marché live.</p>
      </div>
      <p className="xa-truth-footnote">Données vérifiées : — · lecture seule · paper-first.</p>
    </section>
  )
}
