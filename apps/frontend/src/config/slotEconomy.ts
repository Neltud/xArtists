/**
 * Slot public mainnet-paper — EGLD · USDC uniquement.
 * Progressive: une part de chaque mise alimente le jackpot.
 * Grand jackpot 9/9 = toute la cagnotte progressive.
 * SC claim OFF — paper ledger (localStorage).
 */

export type SlotAsset = 'EGLD' | 'USDC'

export const SLOT_ASSETS: SlotAsset[] = ['EGLD', 'USDC']

/** Part user des gains table (hors progressive) */
export const SLOT_USER_WIN_BPS = 8500
export const SLOT_LIA_WIN_RAKE_BPS = 1500

/** % de chaque mise qui va dans la cagnotte progressive */
export const SLOT_PROGRESSIVE_CONTRIB_BPS = 2500 // 25 %

/** Seed cagnotte au reset après grand jackpot */
export const SLOT_PROGRESSIVE_SEED: Record<SlotAsset, number> = {
  EGLD: 0.5,
  USDC: 50,
}

export type SlotAssetConfig = {
  spinCost: number
  startBank: number
  payouts: {
    line3: number
    collection: number
    pair: number
    diagonal: number
    /** Bonus fixe en plus de la progressive sur 9/9 */
    grandBonus: number
  }
  decimals: number
}

export const SLOT_ASSET_CONFIG: Record<SlotAsset, SlotAssetConfig> = {
  EGLD: {
    spinCost: 0.05,
    startBank: 2,
    payouts: {
      line3: 0.4,
      collection: 0.2,
      pair: 0.06,
      diagonal: 0.35,
      grandBonus: 0.25,
    },
    decimals: 4,
  },
  USDC: {
    spinCost: 1,
    startBank: 100,
    payouts: {
      line3: 40,
      collection: 20,
      pair: 6,
      diagonal: 35,
      grandBonus: 25,
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
}

function roundAsset(n: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.round(n * f) / f
}

export function formatSlotAmount(n: number, asset: SlotAsset): string {
  const d = SLOT_ASSET_CONFIG[asset].decimals
  return `${n.toFixed(d)} ${asset}`
}

export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(0)} %`
}

const PROG_KEY = 'xartists_slot_progressive_v2'

export function loadProgressive(asset: SlotAsset): number {
  try {
    const raw = localStorage.getItem(PROG_KEY)
    if (!raw) return SLOT_PROGRESSIVE_SEED[asset]
    const j = JSON.parse(raw) as Record<string, number>
    const v = Number(j[asset])
    if (!Number.isFinite(v) || v < 0) return SLOT_PROGRESSIVE_SEED[asset]
    return v
  } catch {
    return SLOT_PROGRESSIVE_SEED[asset]
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

/** Répartition après spin : mise → progressive + LIA ; gains table ou grand 9/9. */
export function settleSpin(opts: {
  asset: SlotAsset
  tableGross: number
  isGrand: boolean
  progressiveBefore: number
}): { split: SlotSplit; progressiveAfter: number } {
  const cfg = SLOT_ASSET_CONFIG[opts.asset]
  const d = cfg.decimals
  const spin = cfg.spinCost
  const toProgressive = roundAsset((spin * SLOT_PROGRESSIVE_CONTRIB_BPS) / 10_000, d)
  const spinToLia = roundAsset(spin - toProgressive, d)

  let progressive = roundAsset(opts.progressiveBefore + toProgressive, d)
  let progressivePaid = 0
  let grossWin = opts.tableGross

  if (opts.isGrand) {
    progressivePaid = progressive
    grossWin = roundAsset(progressive + cfg.payouts.grandBonus, d)
    progressive = SLOT_PROGRESSIVE_SEED[opts.asset]
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
    },
  }
}
