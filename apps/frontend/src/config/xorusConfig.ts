/**
 * xOrus runtime config — paper-only. Replaces liaConfig for intelligence surfaces.
 * VITE_XORUS_LIVE_TRADING is ignored; live trading cannot be enabled from the xOrus desk.
 */

/** Always false — LIA live path retired. */
export const XORUS_LIVE_TRADING = false

export const XORUS_MODE = 'paper' as const

export const XORUS_GUARDS = {
  maxUsdPerTrade: 0,
  maxUsdPerDay: 0,
  bootstrapEgld: 0,
  allowlist: [] as const,
} as const

export const XORUS_BADGE =
  'xOrus paper desk · Sentinel veto · dual reports · no autonomous execution' as const

/** @deprecated */
export const LIA_BADGE = XORUS_BADGE

export function assertPaperOnly(): void {
  /* xOrus is always paper */
}
