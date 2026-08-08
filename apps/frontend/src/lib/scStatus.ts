/**
 * On-chain SC readiness for UI gates.
 * Known empty marketplace address must never receive user funds.
 */

/** Historical placeholder — empty account on mainnet (codeHash null) */
export const KNOWN_EMPTY_MARKETPLACE =
  'erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t'

export function envMarketplace(): string {
  return (import.meta.env.VITE_MARKETPLACE_ADDRESS as string | undefined)?.trim() || ''
}

export function envAgentsMarketplace(): string {
  return (import.meta.env.VITE_AGENTS_MARKETPLACE_ADDRESS as string | undefined)?.trim() || ''
}

export function isMarketplaceLive(): boolean {
  const a = envMarketplace()
  if (!a || !a.startsWith('erd1')) return false
  if (a.toLowerCase() === KNOWN_EMPTY_MARKETPLACE.toLowerCase()) return false
  // Explicit opt-in after verify_marketplace_codehash
  const flag = (import.meta.env.VITE_MARKETPLACE_CODEHASH_OK as string | undefined) === '1'
  return flag
}

export function isAgentsMarketplaceLive(): boolean {
  const a = envAgentsMarketplace()
  if (!a || !a.startsWith('erd1')) return false
  return (import.meta.env.VITE_AGENTS_CODEHASH_OK as string | undefined) === '1'
}

export function agentsFeeBps(): number {
  const n = Number(import.meta.env.VITE_AGENTS_FEE_BPS ?? 300)
  return Number.isFinite(n) ? n : 300
}
