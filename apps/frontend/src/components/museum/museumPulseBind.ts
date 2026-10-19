/**
 * Bind musée Three.js → bus xartists:pulse (sound / haptic hooks).
 */
export function bindMuseumPulse(detail: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('xartists:pulse', { detail: { source: 'museum', ...detail } }))
}
