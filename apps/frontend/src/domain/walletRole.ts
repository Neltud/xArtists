/**
 * Wallet roles — User signs explicitly; LIA Ops is PAPER by default.
 */

export type WalletRole = 'user' | 'lia_ops'

export function isWalletRole(v: unknown): v is WalletRole {
  return v === 'user' || v === 'lia_ops'
}

/** Live value-moving paths require human User role. */
export function requiresHumanSignature(role: WalletRole): boolean {
  return role === 'user'
}

/** LIA Ops must not satisfy human confirmation for production execution. */
export function isLiaOpsPaperOnly(role: WalletRole, liveTradingEnabled: boolean): boolean {
  if (role !== 'lia_ops') return false
  return !liveTradingEnabled
}
