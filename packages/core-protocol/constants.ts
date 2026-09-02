/** Règles politiques $TRO — immuables côté produit */

export const TRO_POLICY = {
  /** Cap par chaîne */
  MAX_SUPPLY_PER_CHAIN: 500_000,
  /** Cap théorique multi-chain */
  MAX_SUPPLY_GLOBAL: 1_000_000,
  DECIMALS_ETH: 18 as const,
  DECIMALS_MVX: 6 as const,
  SYMBOL: 'TRO',
  MVX_TOKEN_ID: 'TRO-94c925',
  /** Seuil human-in-the-loop (unités humaines TRO) */
  HUMAN_APPROVAL_THRESHOLD_TRO: 1000,
} as const

export const WALLET_ROLES = {
  LIA_OPS: 'lia_ops',
  ETH_DEPLOY: 'eth_deploy',
  USER: 'user',
  MISSION: 'mission',
  RESERVE: 'reserve',
} as const

export function decimalsForChain(chain: string): 6 | 18 {
  if (chain === 'multiversx') return TRO_POLICY.DECIMALS_MVX
  return TRO_POLICY.DECIMALS_ETH
}

/** Convertit un montant humain en unités atomiques (string). */
export function toAtomic(amountHuman: number | string, decimals: 6 | 18): string {
  const s = String(amountHuman)
  const [whole, frac = ''] = s.split('.')
  const padded = (frac + '0'.repeat(decimals)).slice(0, decimals)
  const raw = `${whole.replace(/^0+/, '') || '0'}${padded}`.replace(/^0+/, '') || '0'
  return raw
}

export function assertSupplyCap(currentAtomic: bigint, mintAtomic: bigint, decimals: 6 | 18): void {
  const max =
    BigInt(TRO_POLICY.MAX_SUPPLY_PER_CHAIN) * 10n ** BigInt(decimals)
  if (currentAtomic + mintAtomic > max) {
    throw new Error('LIA: Supply Cap Reached')
  }
}
