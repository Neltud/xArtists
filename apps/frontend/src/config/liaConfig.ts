/**
 * LIA runtime config — paper-first, non-custodial.
 * LIA_LIVE_TRADING reste forcé à 0 : aucune signature PEM autonome.
 */

/** Toujours false en build client — pas d’override env pour le live autonome. */
export const LIA_LIVE_TRADING = false as const

export const LIA_MODE = 'paper' as const

/** Caps documentés (UI / paper) — pas d’exécution agent. */
export const LIA_GUARDS = {
  maxUsdPerTrade: 15,
  maxUsdPerDay: 40,
  allowlist: ['EGLD', 'USDC-c76f1f', 'TRO-94c925'] as const,
} as const

export const LIA_BADGE =
  '🛡️ Copilote Algorithmique Non-Custodial · Exécution signée par l’utilisateur' as const

export function assertPaperOnly(): void {
  if (LIA_LIVE_TRADING) {
    throw new Error('LIA live trading is disabled in this build')
  }
}
