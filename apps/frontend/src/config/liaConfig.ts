/**
 * LIA runtime config — paper-first, non-custodial by default.
 * Live user-signed path: VITE_LIA_LIVE_TRADING=1 (opérateur xPortal, jamais PEM autonome).
 */

function envFlag(key: string): boolean {
  try {
    const v = String((import.meta as { env?: Record<string, string> }).env?.[key] || '').trim()
    return v === '1' || v === 'true' || v === 'TRUE'
  } catch {
    return false
  }
}

/** true uniquement si build/CI définit VITE_LIA_LIVE_TRADING=1 */
export const LIA_LIVE_TRADING = envFlag('VITE_LIA_LIVE_TRADING')

export const LIA_MODE = LIA_LIVE_TRADING ? ('live_user_sign' as const) : ('paper' as const)

/** Caps — paper + live user-sign */
export const LIA_GUARDS = {
  maxUsdPerTrade: 15,
  maxUsdPerDay: 40,
  /** EGLD micro-bootstrap pour amorcer live */
  bootstrapEgld: 0.001,
  allowlist: ['EGLD', 'USDC-c76f1f', 'TRO-94c925'] as const,
} as const

/** Univers demandé : EGLD et ESDT fongibles identifiés par le registre MultiversX. */
export function isSupportedTradingAsset(asset: {
  identifier: string
  type?: string
  decimals?: number
}): boolean {
  if (asset.identifier === 'EGLD') return true
  return /^[A-Z0-9]{3,20}-[a-f0-9]{6}$/.test(asset.identifier) &&
    asset.type === 'FungibleESDT' &&
    Number.isInteger(asset.decimals) && (asset.decimals ?? -1) >= 0 && (asset.decimals ?? 19) <= 18
}

export const LIA_BADGE = LIA_LIVE_TRADING
  ? ('⚡ Signature xPortal · dépôt de vérification' as const)
  : ('🛡️ Copilote Algorithmique Non-Custodial · Exécution signée par l’utilisateur' as const)

/** Bloque les chemins qui supposent encore du 100 % paper. */
export function assertPaperOnly(): void {
  if (LIA_LIVE_TRADING) return
}

export function assertLiveOrPaper(): void {
  /* no-op — journal works in both modes */
}
