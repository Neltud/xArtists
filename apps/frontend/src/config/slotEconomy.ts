/**
 * Slot public — EGLD · USDC. Paper progressive + bet mults.
 */

export type SlotAsset = 'EGLD' | 'USDC'

export const SLOT_ASSETS: SlotAsset[] = ['EGLD', 'USDC']

export const SLOT_BET_MULTS = [1, 2, 5, 10] as const
export type SlotBetMult = (typeof SLOT_BET_MULTS)[number]

export const SLOT_BONUS = {
  costMult: 50,
  freeSpins: 8,
  winMult: 2,
} as const

export const SLOT_USER_WIN_BPS = 7000
export const SLOT_LIA_WIN_RAKE_BPS = 3000
export const SLOT_PROGRESSIVE_CONTRIB_BPS = 3500

export const SLOT_PROGRESSIVE_SEED: Record<SlotAsset, number> = {
  EGLD: 1.0,
  USDC: 100,
}

export type SlotAssetConfig = {
  spinCost: number
  startBank: number
  payouts: {
    line3: number
    collection: number
    pair: number
    diagonal: number
    grandBonus: number
  }
  decimals: number
}

export const SLOT_ASSET_CONFIG: Record<SlotAsset, SlotAssetConfig> = {
  EGLD: {
    spinCost: 0.1,
    startBank: 1.5,
    payouts: {
      line3: 0.35,
      collection: 0.08,
      pair: 0.03,
      diagonal: 0.28,
      grandBonus: 0.5,
    },
    decimals: 4,
  },
  USDC: {
    spinCost: 2,
    startBank: 50,
    payouts: {
      line3: 7,
      collection: 1.5,
      pair: 0.5,
      diagonal: 5.5,
      grandBonus: 10,
    },
    decimals: 2,
  },
}

export type SlotSplit = {
  grossWin: number
  userCredit: number
  liaRake: number
  spinToLia: number
  toProgressive: number
  progressivePaid: number
  isGrand: boolean
  asset: SlotAsset
  betMult: number
  inBonus: boolean
}

function roundAsset(n: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.round(n * f) / f
}

function cfgOf(asset: SlotAsset): SlotAssetConfig {
  return SLOT_ASSET_CONFIG[asset] || SLOT_ASSET_CONFIG.EGLD
}

export function formatSlotAmount(n: number, asset: SlotAsset): string {
  const d = cfgOf(asset).decimals
  const v = Number.isFinite(n) ? n : 0
  return `${v.toFixed(d)} ${asset}`
}

export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(0)} %`
}

export function spinCostFor(asset: SlotAsset, betMult: number): number {
  const cfg = cfgOf(asset)
  return roundAsset(cfg.spinCost * betMult, cfg.decimals)
}

export function bonusCostFor(asset: SlotAsset, betMult: number): number {
  const cfg = cfgOf(asset)
  return roundAsset(cfg.spinCost * SLOT_BONUS.costMult * betMult, cfg.decimals)
}

const PROG_KEY = 'xartists_slot_progressive_v3'

export function loadProgressive(asset: SlotAsset): number {
  try {
    const raw = localStorage.getItem(PROG_KEY)
    if (!raw) return SLOT_PROGRESSIVE_SEED[asset] ?? 0
    const j = JSON.parse(raw) as Record<string, number>
    const v = Number(j[asset])
    if (!Number.isFinite(v) || v < 0) return SLOT_PROGRESSIVE_SEED[asset] ?? 0
    return v
  } catch {
    return SLOT_PROGRESSIVE_SEED[asset] ?? 0
  }
}

export function saveProgressive(asset: SlotAsset, amount: number): void {
  try {
    const raw = localStorage.getItem(PROG_KEY)
    const j = raw ? (JSON.parse(raw) as Record<string, number>) : {}
    j[asset] = amount
    localStorage.setItem(PROG_KEY, JSON.stringify(j))
  } catch {
    /* ignore */
  }
}

export function settleSpin(opts: {
  asset: SlotAsset
  tableGross: number
  isGrand: boolean
  progressiveBefore: number
  betMult?: number
  inBonus?: boolean
}): { split: SlotSplit; progressiveAfter: number } {
  const cfg = cfgOf(opts.asset)
  const d = cfg.decimals
  const betMult = opts.betMult ?? 1
  const inBonus = !!opts.inBonus
  const spin = spinCostFor(opts.asset, betMult)
  const progBase = inBonus ? cfg.spinCost * betMult : spin
  const toProgressive = roundAsset((progBase * SLOT_PROGRESSIVE_CONTRIB_BPS) / 10_000, d)
  const spinToLia = inBonus ? 0 : roundAsset(spin - toProgressive, d)

  let progressive = roundAsset((opts.progressiveBefore || 0) + toProgressive, d)
  let progressivePaid = 0
  let table = opts.tableGross * betMult
  if (inBonus) table = roundAsset(table * SLOT_BONUS.winMult, d)
  let grossWin = table

  if (opts.isGrand) {
    progressivePaid = progressive
    grossWin = roundAsset(
      progressive + cfg.payouts.grandBonus * betMult * (inBonus ? SLOT_BONUS.winMult : 1),
      d,
    )
    progressive = SLOT_PROGRESSIVE_SEED[opts.asset] ?? 0
  }

  const userCredit = roundAsset((grossWin * SLOT_USER_WIN_BPS) / 10_000, d)
  const liaRake = roundAsset(grossWin - userCredit, d)

  return {
    progressiveAfter: progressive,
    split: {
      grossWin: roundAsset(grossWin, d),
      userCredit,
      liaRake,
      spinToLia,
      toProgressive,
      progressivePaid,
      isGrand: opts.isGrand,
      asset: opts.asset,
      betMult,
      inBonus,
    },
  }
}
