/** Museum Pulse binding is suspended: synthetic frontend and API cycles are not telemetry. */
import type { MuseumPulseParams } from '../../lib/pulseMuseum'

export type ApplyPulse = (params: MuseumPulseParams) => void

export function subscribeMuseumPulse(_room: string, _apply: ApplyPulse): () => void {
  // Fail closed: no bus subscription until an authenticated signal adapter exists.
  return () => undefined
}
