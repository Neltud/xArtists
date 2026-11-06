/** Unsourced synthetic paper ticks are disabled in the public command center. */
import type { AmbientSnapshot } from '../lib/ambientAura'

export default function MarketTape({ snap: _snap }: { snap?: AmbientSnapshot | null }) {
  return (
    <aside className="xa-truth-card" aria-label="État du ruban de signaux">
      <div className="xa-truth-card-heading">
        <span className="xa-truth-label">Tape · suspendu</span>
        <h3>Pas de ruban agent live</h3>
        <p>
          Les anciens ticks toutes les 4,2 secondes étaient générés localement.
          Aucune donnée de marché ou opération d'agent ne doit être déduite de ces ticks.
        </p>
      </div>
      <p className="xa-truth-footnote">Source vérifiée : indisponible · Paper-first · aucune exécution attestée.</p>
    </aside>
  )
}
