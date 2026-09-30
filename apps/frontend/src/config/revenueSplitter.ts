/**
 * Revenue splitter — protocol honesty for pack sales.
 * On-chain: treasury_splitter SC (CODEHASH gated).
 * Off-chain: same ratios for paper accounting.
 */

import { TREASURY_SPLITTER_ADDRESS, canUseTreasury } from './scStatus'
import type { PackId } from './agentPacks'
import { AGENT_PACKS } from './agentPacks'

/** Basis points of pack sale → destinations (sum 10_000) */
export type SplitLeg = {
  id: string
  label: string
  bps: number
  note?: string
}

/** Default protocol split for a pack sale (EGLD/fiat equivalent) */
export const PACK_SALE_SPLIT: SplitLeg[] = [
  { id: 'artists', label: 'Artists / creators', bps: 4500, note: 'Pool revente + studios' },
  { id: 'protocol', label: 'Protocol / LIA ops', bps: 2500, note: 'Infra · gas · board' },
  { id: 'treasury', label: 'Treasury DAO', bps: 1500, note: 'treasury_splitter SC' },
  { id: 'pack_pool', label: 'Pack signal pool', bps: 1000, note: 'Pulse/Yield/Sentinel pools' },
  { id: 'burn_buffer', label: 'Burn / buyback buffer', bps: 500, note: 'Optional TRO pressure' },
]

export function assertSplitSum(legs: SplitLeg[] = PACK_SALE_SPLIT): number {
  return legs.reduce((s, l) => s + l.bps, 0)
}

export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`
}

export function amountFromBps(total: number, bps: number): number {
  return (total * bps) / 10_000
}

export function packPoolShare(packId: PackId): number {
  return AGENT_PACKS.find(p => p.id === packId)?.shareOfPackPoolBps ?? 0
}

export function splitterStatus() {
  return {
    address: TREASURY_SPLITTER_ADDRESS,
    live: canUseTreasury(),
    label: canUseTreasury()
      ? 'LIVE · receiveAndSplit gated CODEHASH'
      : 'Adresse connue · paper accounting until VITE_TREASURY_CODEHASH_OK',
  }
}

/** Human-readable breakdown for a list price */
export function projectSale(totalEgld: number, packId?: PackId) {
  const legs = PACK_SALE_SPLIT.map(l => ({
    ...l,
    amount: amountFromBps(totalEgld, l.bps),
  }))
  const poolShare = packId ? packPoolShare(packId) : null
  return {
    totalEgld,
    legs,
    sumBps: assertSplitSum(),
    packPoolShareBps: poolShare,
    splitter: splitterStatus(),
  }
}
