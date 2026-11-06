/**
 * Fail-closed public Pulse adapter.
 * Both the frontend demo cycle and services/pulse-api's rotating samples are
 * synthetic. Neither may be broadcast as agent or market telemetry.
 * Re-enable only after a provenance-checked, timestamped read-only adapter exists.
 */
import type { PulseEnvironment } from '../lib/pulseDemo'

export type PulseSource = 'unavailable'

const UNVERIFIED: PulseEnvironment = {
  type: 'ENVIRONMENT_UPDATE',
  sentiment: 0,
  intensity: 'low',
  color_target: '#8b948b',
  vibe: 'unavailable',
  category: 'UNVERIFIED',
  context: 'No verified agent data',
}

export function usePulse() {
  // Compatibility neutral value only; not a signal and never emitted to the event bus.
  return { env: UNVERIFIED, source: 'unavailable' as const, connected: false, apiBase: '' }
}

/** No public events are delivered until the source contract is verified. */
export function onPulse(_cb: (env: PulseEnvironment, source: PulseSource) => void): () => void {
  return () => undefined
}
