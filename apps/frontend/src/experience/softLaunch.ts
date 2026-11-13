/**
 * Soft-launch editorial navigation policy. Routes and aliases are deliberately
 * NOT gated here. Deep links remain accessible; ?lab=1 reveals the full
 * catalogue without granting payments, minting, signing or trading rights.
 */
import type { Module } from './modules'

/** User-facing starting surfaces (browse, informational or explicitly preview). */
export const CORE_MODULE_IDS = new Set([
  'museum',
  'market',
  'maison',
  'lia',
  'agents',
  'packs',
  'studio',
  'gallery-builder',
  'wallet',
  'account',
  'tro-crosschain',
  'status',
  'legal',
  'guide',
  'app',
])

export function isCoreModule(m: Module | { id: string }): boolean {
  return CORE_MODULE_IDS.has(m.id)
}

export function showLabModules(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (new URLSearchParams(window.location.search).get('lab') === '1') return true
    if (window.localStorage.getItem('xa_show_lab') === '1') return true
  } catch {
    /* private mode or unavailable storage: stay core-only */
  }
  return false
}

/** Presentation-only visibility. NEVER use this as a capability or auth gate. */
export function isSoftLaunchVisible(m: Module | {id:string}, lab = showLabModules()): boolean {
  return lab || isCoreModule(m)
}
