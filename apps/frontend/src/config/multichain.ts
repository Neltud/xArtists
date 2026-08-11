/** LIA ops multi-chain receive addresses (not user Connect). */
export const LIA_MULTICHAIN = {
  egld: {
    symbol: 'EGLD',
    address: 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6',
    explorer:
      'https://explorer.multiversx.com/accounts/erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6',
  },
  btc: {
    symbol: 'BTC',
    address: 'bc1q0rvmym3mc4f5nmfuvpzvkvr236ptx5l243rt4d',
    explorer: 'https://mempool.space/address/bc1q0rvmym3mc4f5nmfuvpzvkvr236ptx5l243rt4d',
  },
  sol: {
    symbol: 'SOL',
    address: 'FEcBEmpNGv8yuAnuyAdnZneCMiJMnNGYKaw7cgSzNYwn',
    explorer: 'https://solscan.io/account/FEcBEmpNGv8yuAnuyAdnZneCMiJMnNGYKaw7cgSzNYwn',
  },
} as const

/**
 * Pack pricing policy (product lock 2026-08).
 * - listPriceEur: prix vitrine par défaut (10 € / pack)
 * - min/max: corridor dans lequel LIA (Vellum) peut ajuster pour marge / demande
 */
export const PACK_PRICE_EUR = {
  min: 5,
  max: 25,
  /** Prix catalogue v1 — les 3 profils */
  list: 10,
} as const

export const PHYSICAL_NFT_TRO_REWARD_MAX = 1
