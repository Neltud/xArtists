/** Legacy direct entrypoint: no WebGL, moving charts or synthetic telemetry. */
import HoloDataRoom from '../HoloDataRoom'

export default function LiaHubControlRoom() {
  return (
    <section className="grid gap-4 md:grid-cols-3" aria-label="État statique des packs LIA">
      <HoloDataRoom mode="pulse" height={240} />
      <HoloDataRoom mode="yield" height={240} />
      <HoloDataRoom mode="sentinel" height={240} />
    </section>
  )
}
