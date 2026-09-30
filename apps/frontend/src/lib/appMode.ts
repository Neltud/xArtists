/**
 * Live Bridge — paper vs live (Vite env + session safety switch).
 * VITE_LIVE_MODE=1 or VITE_APP_MODE=live enables live-capable build.
 * Runtime can force paper after TX failure (Phase 5 Safety Switch).
 */
export type AppMode = 'paper' | 'live'

const SESSION_PAPER_KEY = 'xartists_force_paper'

export function getEnvLiveCapable(): boolean {
  try {
    const env = (import.meta as { env?: Record<string, string> }).env || {}
    const liveFlag = String(env.VITE_LIVE_MODE || '').trim()
    if (liveFlag === '1' || liveFlag.toLowerCase() === 'true') return true
    const v = String(env.VITE_APP_MODE || '')
      .toLowerCase()
      .trim()
    if (v === 'live' || v === 'mainnet') return true
    if (v === 'paper' || v === 'demo' || v === 'simulation') return false
    // Heuristic: CODEHASH secrets at build ⇒ live-capable
    if (
      env.VITE_TRO_STAKING_CODEHASH_OK === '1' ||
      env.VITE_MARKETPLACE_CODEHASH_OK === '1' ||
      env.VITE_SLOT_CASINO_CODEHASH_OK === '1' ||
      env.VITE_SLOT_CODEHASH_OK === '1'
    ) {
      return true
    }
  } catch {
    /* */
  }
  return false
}

export function isSessionForcedPaper(): boolean {
  try {
    return sessionStorage.getItem(SESSION_PAPER_KEY) === '1'
  } catch {
    return false
  }
}

/** Safety Switch — force paper for this tab after hard TX failure */
export function forcePaperMode(reason?: string): void {
  try {
    sessionStorage.setItem(SESSION_PAPER_KEY, '1')
    if (reason) sessionStorage.setItem('xartists_force_paper_reason', reason.slice(0, 200))
    window.dispatchEvent(
      new CustomEvent('xartists:mode', { detail: { mode: 'paper', reason: reason || 'safety' } }),
    )
  } catch {
    /* */
  }
}

export function clearForcePaperMode(): void {
  try {
    sessionStorage.removeItem(SESSION_PAPER_KEY)
    sessionStorage.removeItem('xartists_force_paper_reason')
    window.dispatchEvent(new CustomEvent('xartists:mode', { detail: { mode: getAppMode() } }))
  } catch {
    /* */
  }
}

export function getForcePaperReason(): string | null {
  try {
    return sessionStorage.getItem('xartists_force_paper_reason')
  } catch {
    return null
  }
}

export function getAppMode(): AppMode {
  if (isSessionForcedPaper()) return 'paper'
  return getEnvLiveCapable() ? 'live' : 'paper'
}

export function isPaperMode(): boolean {
  return getAppMode() === 'paper'
}

export function isLiveMode(): boolean {
  return getAppMode() === 'live'
}
