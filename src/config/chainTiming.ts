/**
 * MultiversX chain timing — pre-Supernova (6s rounds) vs Supernova (600ms).
 *
 * Official (Aug 2026):
 * - Devnet: Supernova LIVE since 20 Aug (600ms rounds)
 * - Mainnet: node upgrade 1 Sep · activation 10 Sep 2026
 * - ABIs / addresses / gas model unchanged; timeouts calibrated on 6s are off by ~10×
 *
 * Flags:
 *   CHAIN_SUPERNOVA=1 | SUPERNOVA=1 | VITE_SUPERNOVA=1 → force supernova
 *   …=0|false|off → force pre
 *   unset → auto from last applyStatsRefreshRate() / probe (default conservative)
 */

export type ChainTimingMode = 'pre_supernova' | 'supernova'

export const SUPERNOVA_REFRESH_RATE_MAX_MS = 1_000

let detectedMode: ChainTimingMode | null = null

function envFlag(name: string): string {
  try {
    if (typeof process !== 'undefined' && process.env?.[name]) {
      return String(process.env[name]).trim().toLowerCase()
    }
  } catch {
    /* ignore */
  }
  return ''
}

function combinedEnv(): string {
  return envFlag('CHAIN_SUPERNOVA') || envFlag('SUPERNOVA') || envFlag('VITE_SUPERNOVA')
}

function envForceSupernova(): boolean {
  const v = combinedEnv()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

function envForcePre(): boolean {
  const v = combinedEnv()
  return v === '0' || v === 'false' || v === 'off' || v === 'no'
}

export function modeFromRefreshRate(refreshRateMs: number): ChainTimingMode {
  if (Number.isFinite(refreshRateMs) && refreshRateMs > 0 && refreshRateMs <= SUPERNOVA_REFRESH_RATE_MAX_MS) {
    return 'supernova'
  }
  return 'pre_supernova'
}

export function applyStatsRefreshRate(refreshRateMs: number): ChainTimingMode {
  detectedMode = modeFromRefreshRate(refreshRateMs)
  return detectedMode
}

export function detectedChainTiming(): ChainTimingMode | null {
  return detectedMode
}

/** True when Supernova-speed polling is desired (Devnet now, Mainnet from 10 Sep). */
export function isSupernovaMode(): boolean {
  if (envForcePre()) return false
  if (envForceSupernova()) return true
  return detectedMode === 'supernova'
}

export function chainTimingMode(): ChainTimingMode {
  return isSupernovaMode() ? 'supernova' : 'pre_supernova'
}

/**
 * Recommended defaults. Gas limits are NOT changed by Supernova.
 */
export const CHAIN_TIMING = {
  roundMs: {
    pre_supernova: 6_000,
    supernova: 600,
  } as const,
  txStatusPollMs: {
    pre_supernova: 3_000,
    supernova: 800,
  } as const,
  txStatusTimeoutMs: {
    pre_supernova: 120_000,
    supernova: 45_000,
  } as const,
  noncePollMs: {
    pre_supernova: 1_500,
    supernova: 500,
  } as const,
  nonceAdvancePollMs: {
    pre_supernova: 2_000,
    supernova: 600,
  } as const,
  nonceStableTimeoutMs: {
    pre_supernova: 45_000,
    supernova: 20_000,
  } as const,
  nonceAdvanceTimeoutMs: {
    pre_supernova: 120_000,
    supernova: 45_000,
  } as const,
  mintStatusPollMs: {
    pre_supernova: 3_000,
    supernova: 1_500,
  } as const,
  fetchTimeoutMs: 12_000,
} as const

export function timingDefaults() {
  const mode = chainTimingMode()
  return {
    mode,
    roundMs: CHAIN_TIMING.roundMs[mode],
    txStatusPollMs: CHAIN_TIMING.txStatusPollMs[mode],
    txStatusTimeoutMs: CHAIN_TIMING.txStatusTimeoutMs[mode],
    noncePollMs: CHAIN_TIMING.noncePollMs[mode],
    nonceAdvancePollMs: CHAIN_TIMING.nonceAdvancePollMs[mode],
    nonceStableTimeoutMs: CHAIN_TIMING.nonceStableTimeoutMs[mode],
    nonceAdvanceTimeoutMs: CHAIN_TIMING.nonceAdvanceTimeoutMs[mode],
    mintStatusPollMs: CHAIN_TIMING.mintStatusPollMs[mode],
    fetchTimeoutMs: CHAIN_TIMING.fetchTimeoutMs,
  }
}
