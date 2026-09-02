/**
 * Sprint 2 — Agrégateur de routes (best path paper).
 * Compare sources de référence ; DEX réels = xExchange / OneDex (liens), pas custody.
 */
import {
  exchangeRate,
  listReferencePools,
  type PoolSnapshot,
} from './liquidityService'
import type { SwapQuotePreview } from '../types/intent'

export type DexId = 'xExchange' | 'OneDex' | 'reference'

export interface RouteCandidate {
  dex: DexId
  route: string[]
  rate: number
  priceImpactBps: number
  amountOutHuman: number
  score: number
}

function impactBps(amountInUsd: number, liqUsd?: number): number {
  if (!liqUsd || liqUsd <= 0) return 80
  const ratio = amountInUsd / liqUsd
  return Math.min(500, Math.round(ratio * 10_000))
}

/**
 * Meilleure route paper entre deux actifs.
 */
export async function findBestRoute(
  assetFrom: string,
  assetTo: string,
  amountInHuman: number
): Promise<{ best: RouteCandidate | null; candidates: RouteCandidate[]; pools: PoolSnapshot[] }> {
  const pools = await listReferencePools()
  const direct = exchangeRate(pools, assetFrom, assetTo)
  const candidates: RouteCandidate[] = []

  if (direct && direct.rate > 0) {
    const out = amountInHuman * direct.rate
    const usdApprox = amountInHuman * (direct.pool?.price || 1)
    const impact = impactBps(usdApprox, direct.pool?.liquidityUsd)
    candidates.push({
      dex: 'xExchange',
      route: [assetFrom, assetTo],
      rate: direct.rate,
      priceImpactBps: impact,
      amountOutHuman: out * (1 - impact / 10_000),
      score: out * (1 - impact / 10_000),
    })
    // Simulated alternate venue slightly worse
    candidates.push({
      dex: 'OneDex',
      route: [assetFrom, assetTo],
      rate: direct.rate * 0.997,
      priceImpactBps: impact + 15,
      amountOutHuman: out * 0.997 * (1 - (impact + 15) / 10_000),
      score: out * 0.997 * (1 - (impact + 15) / 10_000),
    })
  }

  // Multi-hop via EGLD
  if (assetFrom.toUpperCase() !== 'EGLD' && assetTo.toUpperCase() !== 'EGLD') {
    const a = exchangeRate(pools, assetFrom, 'EGLD')
    const b = exchangeRate(pools, 'EGLD', assetTo)
    if (a && b && a.rate > 0 && b.rate > 0) {
      const out = amountInHuman * a.rate * b.rate
      const impact = 40
      candidates.push({
        dex: 'xExchange',
        route: [assetFrom, 'EGLD', assetTo],
        rate: a.rate * b.rate,
        priceImpactBps: impact,
        amountOutHuman: out * (1 - impact / 10_000),
        score: out * (1 - impact / 10_000) * 0.99,
      })
    }
  }

  candidates.sort((x, y) => y.score - x.score)
  return { best: candidates[0] ?? null, candidates, pools }
}

export async function quoteSwapPreview(
  assetFrom: string,
  assetTo: string,
  amountInHuman: string
): Promise<SwapQuotePreview | null> {
  const n = Number(String(amountInHuman).replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) return null
  const { best } = await findBestRoute(assetFrom, assetTo, n)
  if (!best) return null
  return {
    assetFrom,
    assetTo,
    amountInHuman: String(n),
    amountOutHuman: best.amountOutHuman.toPrecision(8),
    rate: best.rate,
    dex: best.dex,
    priceImpactBps: best.priceImpactBps,
    route: best.route,
    stale: false,
    paper: true,
  }
}

export const aggregatorService = {
  findBestRoute,
  quoteSwapPreview,
}
