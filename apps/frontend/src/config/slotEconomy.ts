/**
 * Slot paper economy — EGLD · USDC · USDT (pas de TRO).
 * Split: user 85 % des gains bruts · LIA 15 % rake · coût spin → LIA.
 * Aucun transfer on-chain (SC slot OFF).
 */

export type SlotAsset = 'EGLD' | 'USDC' | 'USDT'

export const SLOT_ASSETS: SlotAsset[] = ['EGLD', 'USDC', 'USDT']

/** Part user des gains bruts (8500 = 85 %) */
export const SLOT_USER_WIN_BPS = 8500

/** Rake LIA sur gains bruts (1500 = 15 %) */
export const SLOT_LIA_WIN_RAKE_BPS = 1500

export type SlotAssetConfig = {
  spinCost: number
  startBank: number
  /** Gains bruts paper */
  payouts: {
    jackpot: number
    collection: number
    pair: number
    diagonal: number
  }
  decimals: number
}

export const SLOT_ASSET_CONFIG: Record<SlotAsset, SlotAssetConfig> = {
  EGLD: {
    spinCost: 0.05,
    startBank: 2,
    payouts: {
      jackpot: 0.8,
      collection: 0.24,
      pair: 0.06,
      diagonal: 0.4,
    },
    decimals: 4,
  },
  USDC: {
    spinCost: 1,
    startBank: 100,
    payouts: {
      jackpot: 80,
      collection: 24,
      pair: 6,
      diagonal: 40,
    },
    decimals: 2,
  },
  USDT: {
    spinCost: 1,
    startBank: 100,
    payouts: {
      jackpot: 80,
      collection: 24,
      pair: 6,
      diagonal: 40,
    },
    decimals: 2,
  },
}

export type SlotSplit = {
  grossWin: number
  userCredit: number
  liaRake: number
  spinToLia: number
  asset: SlotAsset
}

function roundAsset(n: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.round(n * f) / f
}

/** Applique la table de répartition sur un gain brut (après spin déjà payé). */
export function splitSlotWin(
  grossWin: number,
  asset: SlotAsset,
): SlotSplit {
  const cfg = SLOT_ASSET_CONFIG[asset]
  const g = Math.max(0, grossWin)
  const userCredit = roundAsset((g * SLOT_USER_WIN_BPS) / 10_000, cfg.decimals)
  const liaRake = roundAsset(g - userCredit, cfg.decimals)
  return {
    grossWin: roundAsset(g, cfg.decimals),
    userCredit,
    liaRake,
    spinToLia: cfg.spinCost,
    asset,
  }
}

export function formatSlotAmount(n: number, asset: SlotAsset): string {
  const d = SLOT_ASSET_CONFIG[asset].decimals
  return `${n.toFixed(d)} ${asset}`
}

export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(0)} %`
}
