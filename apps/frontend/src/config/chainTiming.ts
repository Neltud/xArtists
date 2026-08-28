/**
 * MultiversX chain timing (frontend).
 *
 * Pre-Supernova mainnet: 6s rounds. Supernova: 600ms (Devnet LIVE since 20 Aug 2026;
 * node upgrade 1 Sep 2026; mainnet activation 10 Sep 2026). ABIs / addresses / gas unchanged.
 *
 * Mode resolution (first match):
 *   VITE_SUPERNOVA=1|true|yes  → force supernova polls
 *   VITE_SUPERNOVA=0|false|off → force pre_supernova
 *   otherwise                  → auto from API `refreshRate` (probeChainTiming)
 *
 * Until the probe returns, defaults stay conservative (6s-era) so mainnet is not hammered.
 */

export type ChainTimingMode = 'pre_supernova' | 'supernova'

/** refreshRate ≤ this (ms) ⇒ Supernova-speed polls. Devnet reports 600. */
export const SUPERNOVA_REFRESH_RATE_MAX_MS = 1_000

let detectedMode: ChainTimingMode | null = null

function envRaw(): string {
  return String(import.meta.env.VITE_SUPERNOVA ?? '').trim().toLowerCase()
}

function envForceSupernova(): boolean {
  const v = envRaw()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

function envForcePre(): boolean {
  const v = envRaw()
  return v === '0' || v === 'false' || v === 'off' || v === 'no'
}

export function detectedChainTiming(): ChainTimingMode | null {
  return detectedMode
}

/** Pure helper — also used by tests / probe. */
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

export function isSupernovaMode(): boolean {
  if (envForcePre()) return false
  if (envForceSupernova()) return true
  return detectedMode === 'supernova'
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

/**
 * Read MultiversX `/stats.refreshRate` and cache the mode.
 * Safe to call multiple times; failures leave conservative defaults.
 */
export async function probeChainTiming(
  apiBase = (import.meta.env.VITE_MVX_API as string | undefined) || 'https://api.multiversx.com',
): Promise<ChainTimingMode> {
  if (envForcePre() || envForceSupernova()) return chainTimingMode()
  try {
    const ctrl = new AbortController()
    const t = window.setTimeout(() => ctrl.abort(), 8_000)
    const res = await fetch(`${String(apiBase).replace(/\/$/, '')}/stats`, {
      signal: ctrl.signal,
      cache: 'no-store',
    })
    window.clearTimeout(t)
    if (!res.ok) return chainTimingMode()
    const j = (await res.json()) as { refreshRate?: number }
    const rr = Number(j?.refreshRate)
    if (!Number.isFinite(rr) || rr <= 0) return chainTimingMode()
    return applyStatsRefreshRate(rr)
  } catch {
    return chainTimingMode()
  }
}
