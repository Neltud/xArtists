/**
 * Sign transport abstraction — Supernova-oriented.
 *
 * "direct" ≠ finalité chaîne 600ms. Cible : ouvrir la feuille de signature
 * xPortal / préparer la TX en ≤ ~600ms (nonce // ensure session).
 *
 * Modes:
 *  - wc     : WalletConnect session (multi-TX, restore)
 *  - hook   : Web Wallet redirect (toujours dispo)
 *  - direct : wc en priorité, pipeline parallélisé, fallback hook
 */

export type SignMode = 'direct' | 'wc' | 'hook'

const STORAGE = 'xartists_sign_mode'

export function getSignMode(): SignMode {
  try {
    const v = localStorage.getItem(STORAGE)
    if (v === 'wc' || v === 'hook' || v === 'direct') return v
  } catch {
    /* */
  }
  return 'direct'
}

export function setSignMode(mode: SignMode): void {
  try {
    localStorage.setItem(STORAGE, mode)
    window.dispatchEvent(new CustomEvent('xartists-sign-mode', { detail: { mode } }))
  } catch {
    /* */
  }
}

export type SignPipelinePhase =
  | 'idle'
  | 'ensure_session'
  | 'nonce'
  | 'build'
  | 'sheet'
  | 'broadcast'
  | 'done'
  | 'error'

/** Soft budget ms — log only, never block UX */
export const DIRECT_SHEET_BUDGET_MS = 600

export function markPipeline(phase: SignPipelinePhase, t0?: number): number {
  const now = performance.now()
  if (t0 != null && (phase === 'sheet' || phase === 'done')) {
    const dt = Math.round(now - t0)
    if (dt > DIRECT_SHEET_BUDGET_MS) {
      console.info(`[sign] ${phase} ${dt}ms (budget ${DIRECT_SHEET_BUDGET_MS}ms)`)
    } else {
      console.info(`[sign] ${phase} ${dt}ms ✓`)
    }
  }
  return now
}
