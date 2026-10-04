/** All known TRO liquidity venues (mainnet). Fallback if config.json incomplete. */
export type TroPoolDef = {
  dex: string
  pair: string
  address: string
  lpToken?: string
  baseId?: string
  quoteId?: string
  mexPairPath?: string
  sharedRouter?: boolean
  dexscreener?: string
  swap_url?: string
  add_liquidity_url?: string
}

export const TRO_POOLS_MAINNET: TroPoolDef[] = [
  {
    dex: 'xExchange',
    pair: 'TRO / WEGLD',
    address: 'erd1qqqqqqqqqqqqqpgqmmvfh4anzayxwn3cfe23uw6lguu8synr2jpsu3l0am',
    lpToken: 'TROWEGLD-891183',
    baseId: 'TRO-94c925',
    quoteId: 'WEGLD-bd4d79',
    mexPairPath: 'TRO-94c925/WEGLD-bd4d79',
    dexscreener:
      'https://dexscreener.com/multiversx/erd1qqqqqqqqqqqqqpgqmmvfh4anzayxwn3cfe23uw6lguu8synr2jpsu3l0am',
    swap_url:
      'https://xexchange.com/trade?firstToken=TRO-94c925&secondToken=WEGLD-bd4d79',
    add_liquidity_url: 'https://xexchange.com/pools',
  },
  {
    dex: 'OneDex',
    pair: 'TRO / EGLD',
    address: 'erd1qqqqqqqqqqqqqpgqqz6vp9y50ep867vnr296mqf3dduh6guvmvlsu3sujc',
    lpToken: 'TROWEGLD-ca2874',
    baseId: 'TRO-94c925',
    quoteId: 'WEGLD-bd4d79',
    sharedRouter: true,
    dexscreener:
      'https://dexscreener.com/multiversx/erd1qqqqqqqqqqqqqpgqqz6vp9y50ep867vnr296mqf3dduh6guvmvlsu3sujc-trowegld-ca2874',
    swap_url: 'https://onedex.app',
    add_liquidity_url: 'https://onedex.app',
  },
  {
    dex: 'xExchange',
    pair: 'TRO / USDC',
    address: 'erd1qqqqqqqqqqqqqpgq9gcl9uldfrymtmj8vtkctrkmjdazw3nj2jpsd3nv2e',
    lpToken: 'TROUSDC-2a60c7',
    baseId: 'USDC-c76f1f',
    quoteId: 'TRO-94c925',
    mexPairPath: 'USDC-c76f1f/TRO-94c925',
    swap_url:
      'https://xexchange.com/trade?firstToken=TRO-94c925&secondToken=USDC-c76f1f',
    add_liquidity_url: 'https://xexchange.com/pools',
  },
  {
    dex: 'OneDex',
    pair: 'TRO / XOXNO',
    address: 'erd1qqqqqqqqqqqqqpgqqz6vp9y50ep867vnr296mqf3dduh6guvmvlsu3sujc',
    lpToken: 'TROXOXNO-500f78',
    baseId: 'TRO-94c925',
    quoteId: 'XOXNO-c1293a',
    sharedRouter: true,
    swap_url: 'https://onedex.app',
    add_liquidity_url: 'https://onedex.app',
  },
]

/** Merge config pools with canonical list (by lpToken or pair). */
export function mergeTroPools(fromConfig: TroPoolDef[] | undefined | null): TroPoolDef[] {
  const byKey = new Map<string, TroPoolDef>()
  for (const p of TRO_POOLS_MAINNET) {
    byKey.set(p.lpToken || p.pair, p)
  }
  for (const p of fromConfig || []) {
    if (!p?.pair) continue
    const k = p.lpToken || p.pair
    byKey.set(k, { ...byKey.get(k), ...p })
  }
  return [...byKey.values()]
}
