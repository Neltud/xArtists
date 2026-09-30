/**
 * Live Bridge — paper vs live (Vite env).
 * Prefer VITE_APP_MODE; default paper for safety on Pages without secrets.
 */
export type AppMode = 'paper' | 'live'

export function getAppMode(): AppMode {
  try {
    const v = String(
      (import.meta as { env?: { VITE_APP_MODE?: string; MODE?: string } }).env?.VITE_APP_MODE ||
        '',
    )
      .toLowerCase()
      .trim()
    if (v === 'live' || v === 'mainnet') return 'live'
    if (v === 'paper' || v === 'demo' || v === 'simulation') return 'paper'
    // Heuristic: if any CODEHASH gate secret is injected at build, treat as live-capable
    const env = (import.meta as { env?: Record<string, string> }).env || {}
    if (
      env.VITE_TRO_STAKING_CODEHASH_OK === '1' ||
      env.VITE_MARKETPLACE_CODEHASH_OK === '1'
    ) {
      return 'live'
    }
  } catch {
    /* */
  }
  return 'paper'
}

export function isPaperMode(): boolean {
  return getAppMode() === 'paper'
}

export function isLiveMode(): boolean {
  return getAppMode() === 'live'
}
