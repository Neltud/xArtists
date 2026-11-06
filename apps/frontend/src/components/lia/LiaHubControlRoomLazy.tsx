/** Public LIA control room: verified, timestamped snapshots only.
 * Immersive holograms are suspended until their telemetry has provenance.
 */
import LiaMobileOverview from './LiaMobileOverview'

export default function LiaHubControlRoomLazy() {
  return (
    <section className="min-w-0 space-y-3" aria-label="LIA public control room">
      <p role="status" className="xa-truth-footnote">
        Vue holographique suspendue : aucun flux de pack authentifié, horodaté et vérifié n'est branché.
        Les relevés LIA ci-dessous sont des instantanés publiés, pas un flux de trading live.
      </p>
      <LiaMobileOverview />
    </section>
  )
}
