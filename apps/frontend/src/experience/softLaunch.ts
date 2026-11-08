/**
 * Soft-launch IA: only core surfaces in group/directory by default.
 * Lab modules remain routed (aliases work) but hidden from browse UI
 * unless ?lab=1 or localStorage xa_show_lab=1.
 */
import type { Module } from './modules'

/** Soft-launch perimeter: Genesis packs + museum + market + LIA paper + essentials */
export const CORE_MODULE_IDS = new Set([
  'world-rights',
  'museum',
  'maison',
  'dao',
  'auction',
  'rwa',
  'market',
  'agents',
  'lia',
  'studio',
  'tro-crosschain',
  'wallet',
  'packs',
  'app',
  'legal',
  'staking',
  'portfolio',
  'guide',
  'payments',
  'status',
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
    /* ignore */
  }
  return false
}
