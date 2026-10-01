/**
 * Phase 7/8 — Whitelist & access levels (production honesty).
 * Admin = CEO wallet (erd1…). Herotag @neltud is UX only until registered on-chain.
 * Multichain identity (MX herotag ↔ other chains) = future bridge, not mint gate today.
 */

/** CEO / ops — full IA + PackRoomHolo + admin surfaces */
export const ADMIN_ADDRESS =
  'erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l'

/** Display label only — MultiversX API currently has no username on ADMIN_ADDRESS */
export const ADMIN_HEROTAG = 'neltud'

export type AccessLevel = 'admin' | 'pack_holder' | 'user'

export function isAdminAddress(addr: string | null | undefined): boolean {
  if (!addr?.startsWith('erd1')) return false
  return addr.toLowerCase() === ADMIN_ADDRESS.toLowerCase()
}

export function accessLevelFor(
  addr: string | null | undefined,
  hasPack: boolean,
): AccessLevel {
  if (isAdminAddress(addr)) return 'admin'
  if (hasPack) return 'pack_holder'
  return 'user'
}

/** Public zones — never blocked by whitelist */
export const PUBLIC_ROUTES = [
  '/',
  '/museum',
  '/gallery',
  '/marketplace',
  '/market',
  '/slot',
  '/staking',
  '/wallet',
  '/legal',
  '/go-live',
  '/studio',
] as const
