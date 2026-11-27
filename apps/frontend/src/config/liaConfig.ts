/**
 * LIA runtime config — RETIRED.
 * All live flags forced false. Prefer import from config/xorusConfig.
 */

/** Always false — LIA retired 2026-11-17. VITE_XORUS_LIVE_TRADING is ignored. */
export { XORUS_LIVE_TRADING } from './xorusConfig'

export const LIA_MODE = 'paper' as const

export const LIA_GUARDS = {
  maxUsdPerTrade: 0,
  maxUsdPerDay: 0,
  bootstrapEgld: 0,
  allowlist: [] as const,
} as const

export const LIA_BADGE =
  'LIA retired · use xOrus paper desk · no autonomous execution' as const

export function assertPaperOnly(): void {}

export function assertLiveOrPaper(): void {}

export function isSupportedTradingAsset(_asset: {
  identifier: string
  type?: string
  decimals?: number
}): boolean {
  return false
}
