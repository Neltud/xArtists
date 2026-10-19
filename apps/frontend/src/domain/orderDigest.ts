/**
 * Immutable order digest — approval and audit bind to this hash only.
 * Changing any field invalidates prior approval.
 */

import type { ChainId } from './chain'
import type { WalletRole } from './walletRole'

export type OrderDigestFields = {
  chainId: ChainId
  walletAddress: string
  walletRole: WalletRole
  /** pack_id, listing_id, or swap route id */
  intentId: string
  /** Atomic amount as decimal string (no float) */
  amountAtomic: string
  tokenIn: string
  tokenOut: string
  slippageBps: number
  quoteId: string
  /** Unix seconds */
  expiry: number
}

/** Canonical JSON with sorted keys for stable hashing. */
export function canonicalDigestJson(fields: OrderDigestFields): string {
  const ordered: Record<string, string | number> = {
    amountAtomic: fields.amountAtomic,
    chainId: fields.chainId,
    expiry: fields.expiry,
    intentId: fields.intentId,
    quoteId: fields.quoteId,
    slippageBps: fields.slippageBps,
    tokenIn: fields.tokenIn,
    tokenOut: fields.tokenOut,
    walletAddress: fields.walletAddress.trim().toLowerCase(),
    walletRole: fields.walletRole,
  }
  return JSON.stringify(ordered)
}

/**
 * Pure FNV-1a 32-bit then expand to hex — deterministic in browser and Node,
 * no secret dependency. Server may re-hash with stronger algo; client digest
 * is for binding UI approval requests, not sole security boundary.
 */
export function hashDigest(fields: OrderDigestFields): string {
  const s = canonicalDigestJson(fields)
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  // second pass for longer fingerprint
  let h2 = 0x811c9dc5
  const mixed = s + String(h >>> 0)
  for (let i = 0; i < mixed.length; i++) {
    h2 ^= mixed.charCodeAt(i)
    h2 = Math.imul(h2, 0x01000193)
  }
  const a = (h >>> 0).toString(16).padStart(8, '0')
  const b = (h2 >>> 0).toString(16).padStart(8, '0')
  return `xd1_${a}${b}`
}

export function isDigestExpired(fields: OrderDigestFields, nowUnix = Math.floor(Date.now() / 1000)): boolean {
  return nowUnix >= fields.expiry
}
