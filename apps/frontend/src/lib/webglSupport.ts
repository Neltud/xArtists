/** Détection WebGL une seule fois. */
let cached: boolean | null = null

export function isWebGLAvailable(): boolean {
  if (cached !== null) return cached
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    cached = false
    return false
  }
  try {
    const c = document.createElement('canvas')
    const gl =
      c.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
      c.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
      c.getContext('experimental-webgl')
    cached = Boolean(gl)
    return cached
  } catch {
    cached = false
    return false
  }
}
