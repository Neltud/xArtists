/**
 * Slot paper economy — répartition gains user / LIA.
 * Aucun transfer on-chain tant que SC slot OFF.
 *
 * Règles:
 * - Coût de chaque spin → 100 % ledger LIA (house intake)
 * - Gains bruts → USER_WIN_BPS au user, reste rake LIA
 * - Pas un investissement ; paper / démo uniquement
 */

/** Spin cost en TRO paper */
export const SLOT_SPIN_COST = 5

/** Part user des gains bruts (8500 = 85 %) */
export const SLOT_USER_WIN_BPS = 8500

/** Rake LIA sur gains bruts (1500 = 15 %) */
export const SLOT_LIA_WIN_RAKE_BPS = 1500

/** Bank de départ user (paper) */
export const SLOT_START_BANK = 500

export type SlotSplit = {
  grossWin: number
  userCredit: number
  liaRake: number
  spinToLia: number
}

/** Applique la table de répartition sur un gain brut (après spin déjà payé). */
export function splitSlotWin(grossWin: number): SlotSplit {
  const g = Math.max(0, Math.floor(grossWin))
  const userCredit = Math.floor((g * SLOT_USER_WIN_BPS) / 10_000)
  const liaRake = g - userCredit
  return {
    grossWin: g,
    userCredit,
    liaRake,
    spinToLia: SLOT_SPIN_COST,
  }
}

export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(0)} %`
}
