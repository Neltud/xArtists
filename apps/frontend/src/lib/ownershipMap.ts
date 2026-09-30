/**
 * Ownership map — NFT identifier / collection → visual flags for 3D & grid.
 * Source: useUserAccount.nfts (MultiversX API).
 */

export type OwnedNftRef = {
  identifier: string
  collection: string
  nonce: number
  name: string
  url?: string
}

/** Normalize MultiversX NFT id: COLLECTION-xxxxxx-noncehex or COLLECTION-nonce */
export function normalizeNftId(id: string): string {
  return id.trim().toUpperCase()
}

export function buildOwnedSet(
  nfts: { identifier: string; collection?: string; nonce?: number }[],
): Set<string> {
  const s = new Set<string>()
  for (const n of nfts) {
    if (n.identifier) s.add(normalizeNftId(n.identifier))
    if (n.collection && n.nonce != null) {
      s.add(normalizeNftId(`${n.collection}-${n.nonce}`))
      s.add(normalizeNftId(n.collection))
    }
  }
  return s
}

/**
 * Map scene object key → match rule against owned set.
 * Gallery objects use collection ticker or full identifier.
 */
export function isOwnedByWallet(
  owned: Set<string>,
  ref: { identifier?: string; collection?: string; nonce?: number; sceneKey?: string },
): boolean {
  if (ref.identifier && owned.has(normalizeNftId(ref.identifier))) return true
  if (ref.collection && owned.has(normalizeNftId(ref.collection))) return true
  if (ref.collection && ref.nonce != null) {
    if (owned.has(normalizeNftId(`${ref.collection}-${ref.nonce}`))) return true
  }
  if (ref.sceneKey && owned.has(normalizeNftId(ref.sceneKey))) return true
  return false
}

/** CSS / style tokens for owned glow (Three.js or DOM) */
export const OWNED_GLOW = {
  border: 'border-emerald-400/60',
  ring: 'ring-2 ring-emerald-400/40',
  shadow: '0 0 24px rgba(52, 211, 153, 0.45)',
  emissiveHex: '#34d399',
  emissiveIntensity: 0.65,
} as const
