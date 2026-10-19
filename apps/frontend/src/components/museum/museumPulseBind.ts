/**
 * Bind musée Three.js → bus xartists:pulse (source unique usePulse).
 */
import type { PulseEnvironment } from '../../lib/pulseDemo'
import { mapPulseToMuseum, type MuseumPulseParams } from '../../lib/pulseMuseum'

export type ApplyPulse = (params: MuseumPulseParams) => void

export function subscribeMuseumPulse(room: string, apply: ApplyPulse): () => void {
  const onPulse = (e: Event) => {
    const d = (e as CustomEvent).detail as { env?: PulseEnvironment }
    if (d?.env) apply(mapPulseToMuseum(d.env, room))
  }
  window.addEventListener('xartists:pulse', onPulse)
  const cur = (window as unknown as { __XARTISTS_PULSE__?: PulseEnvironment }).__XARTISTS_PULSE__
  if (cur) apply(mapPulseToMuseum(cur, room))
  return () => window.removeEventListener('xartists:pulse', onPulse)
}
