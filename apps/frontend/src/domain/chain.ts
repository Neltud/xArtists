/**
 * Chain discriminants — never mix balances or amounts across chains.
 * Domain pure: no React, no network.
 */

export type ChainId = 'mvx' | 'sol'

export const CHAIN_LABEL: Record<ChainId, string> = {
  mvx: 'MultiversX',
  sol: 'Solana',
}

export function isChainId(v: unknown): v is ChainId {
  return v === 'mvx' || v === 'sol'
}

/** Reject accidental cross-chain display or policy inputs. */
export function assertSameChain(a: ChainId, b: ChainId): void {
  if (a !== b) {
    throw new Error(`chain_mismatch: ${a} !== ${b}`)
  }
}
