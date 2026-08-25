/**
 * MultiversX chain timing (frontend mirror).
 * See `src/config/chainTiming.ts` for full notes.
 *
 * Enable Supernova-speed polls: `VITE_SUPERNOVA=1` in env / CI after mainnet activation (10 Sep 2026).
 * Devnet testing: set the flag anytime.
 */

export type ChainTimingMode = 'pre_supernova' | 'supernova'

export function isSupernovaMode(): boolean {
  const v = String(import.meta.env.VITE_SUPERNOVA ?? '').toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

export function chainTimingMode(): ChainTimingMode {
  return isSupernovaMode() ? 'supernova' : 'pre_supernova'
}

export const CHAIN_TIMING = {
  roundMs: { pre_supernova: 6_000, supernova: 600 } as const,
  txStatusPollMs: { pre_supernova: 3_000, supernova: 800 } as const,
  txStatusTimeoutMs: { pre_supernova: 120_000, supernova: 45_000 } as const,
  noncePollMs: { pre_supernova: 1_500, supernova: 500 } as const,
  nonceAdvancePollMs: { pre_supernova: 2_000, supernova: 600 } as const,
  nonceStableTimeoutMs: { pre_supernova: 45_000, supernova: 20_000 } as const,
  nonceAdvanceTimeoutMs: { pre_supernova: 120_000, supernova: 45_000 } as const,
  /** Stripe/mint webhook poll (backend lag, not block time) */
  mintStatusPollMs: { pre_supernova: 3_000, supernova: 1_500 } as const,
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
