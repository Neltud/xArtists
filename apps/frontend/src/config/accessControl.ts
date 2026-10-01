/**
 * Phase 7 — Whitelist & access levels (production honesty).
 * Admin = CEO wallet. Pack ownership gates Command / IA rooms.
 */

/** CEO / ops — full IA + PackRoomHolo + admin surfaces */
export const ADMIN_ADDRESS =
  'erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l'

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
] as const
