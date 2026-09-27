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
 * Pack pricing — minimum 10 EGLD (demande produit).
 * EUR affiché ≈ indicative (EGLD * ~4.5).
 */
export const PACK_PRICE_EGLD = {
  min: 10,
  max: 50,
  list: 12,
} as const

export const PACK_PRICE_EUR = {
  min: 45,
  max: 220,
  list: 55,
} as const

export const PHYSICAL_NFT_TRO_REWARD_MAX = 1
