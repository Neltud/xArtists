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
 * Pack pricing — EUR commercial list (Rule1): Pulse 110 / Yield 75 / Sentinel 50.
 * EGLD list ≈ EUR / rate (ref 100 € ≈ 30 EGLD → ~3.33 €/EGLD, marché ~3 €/EGLD oct 2026).
 * Server quote remains source of truth at payment time (ceil4).
 */
export const PACK_PRICE_EGLD = {
  min: 15,
  max: 50,
  list: 33,
} as const

export const PACK_PRICE_EUR = {
  min: 10,
  max: 250,
  list: 110,
} as const

/** Reference only — display parity; live rate may differ at checkout */
export const PACK_EGLD_EUR_REF = 100 / 30

export const PHYSICAL_NFT_TRO_REWARD_MAX = 1
