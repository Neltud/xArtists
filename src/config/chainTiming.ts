/**
 * MultiversX chain timing — pre-Supernova (6s rounds) vs Supernova (600ms).
 *
 * Official (Aug 2026):
 * - Devnet: Supernova LIVE since 20 Aug (600ms rounds)
 * - Mainnet: node upgrade 1 Sep · activation 10 Sep 2026
 * - ABIs / addresses / gas model unchanged; timeouts calibrated on 6s are off by ~10×
 *
 * Flip `CHAIN_SUPERNOVA=1` (Node) or set VITE_SUPERNOVA=1 (Vite) after mainnet activation.
 * Until then defaults stay conservative (6s-era polling) so mainnet is not hammered.
 */

export type ChainTimingMode = 'pre_supernova' | 'supernova'

function envFlag(name: string): boolean {
  try {
    // Node / scripts
    if (typeof process !== 'undefined' && process.env?.[name]) {
      const v = String(process.env[name]).toLowerCase()
      return v === '1' || v === 'true' || v === 'yes'
    }
  } catch {
    /* ignore */
  }
  return false
}

/** True when Supernova-speed polling is desired (Devnet now, Mainnet from 10 Sep). */
export function isSupernovaMode(): boolean {
  return envFlag('CHAIN_SUPERNOVA') || envFlag('SUPERNOVA') || envFlag('VITE_SUPERNOVA')
}

export function chainTimingMode(): ChainTimingMode {
  return isSupernovaMode() ? 'supernova' : 'pre_supernova'
}

/**
 * Recommended defaults. Gas limits are NOT changed by Supernova.
 */
export const CHAIN_TIMING = {
  /** Protocol round time (informational) */
  roundMs: {
    pre_supernova: 6_000,
    supernova: 600,
  } as const,

  /**
   * Poll interval while waiting for TX status on the API.
   * Pre: ~half-round · Supernova: ~1–2 rounds without flooding the API.
   */
  txStatusPollMs: {
    pre_supernova: 3_000,
    supernova: 800,
  } as const,

  /** Overall wait for a single TX to finalize */
  txStatusTimeoutMs: {
    pre_supernova: 120_000,
    supernova: 45_000,
  } as const,

  /** Nonce stability / advance polling */
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

  /** Per-request HTTP timeout to API/gateway (network RTT, not block time) */
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
    fetchTimeoutMs: CHAIN_TIMING.fetchTimeoutMs,
  }
}
