/**
 * Pools $TRO live / référencés — MultiversX.
 * Yield farming → Staking (pas DAO).
 * LP holdings → pouvoir de vote DAO (pondération paper).
 */

export type TroDex = 'xexchange' | 'onedex' | 'jexchange'

export type TroPool = {
  id: string
  dex: TroDex
  pair: string
  /** LP token ticker if known (mex pair id) */
  lpTokenId?: string
  address: string
  role: 'yield' | 'vote' | 'both'
  swapUrl: string
  dexscreener?: string
  note?: string
}

/** Pool farming yield (TRO/EGLD focus) — page Staking */
export const TRO_YIELD_POOLS: TroPool[] = [
  {
    id: 'xex-tro-wegld',
    dex: 'xexchange',
    pair: 'TRO / WEGLD',
    lpTokenId: 'TROWEGLD-891183',
    address: 'erd1qqqqqqqqqqqqqpgqmmvfh4anzayxwn3cfe23uw6lguu8synr2jpsu3l0am',
    role: 'both',
    swapUrl: 'https://xexchange.com/swap?firstToken=TRO-94c925&secondToken=WEGLD-bd4d79',
    dexscreener:
      'https://dexscreener.com/multiversx/erd1qqqqqqqqqqqqqpgqmmvfh4anzayxwn3cfe23uw6lguu8synr2jpsu3l0am',
    note: 'xExchange · LP TROWEGLD — yield via fees / farms DEX',
  },
  {
    id: 'onedex-tro-egld',
    dex: 'onedex',
    pair: 'TRO / EGLD',
    address: 'erd1qqqqqqqqqqqqqpgqqz6vp9y50ep867vnr296mqf3dduh6guvmvlsu3sujc',
    role: 'yield',
    swapUrl: 'https://onedex.app',
    dexscreener:
      'https://dexscreener.com/multiversx/erd1qqqqqqqqqqqqqpgqqz6vp9y50ep867vnr296mqf3dduh6guvmvlsu3sujc-trowegld-ca2874',
    note: 'OneDex · farming / LP publique',
  },
]

/** Pools comptés pour pouvoir de vote DAO (LP multi-DEX) */
export const TRO_VOTE_POOLS: TroPool[] = [
  {
    id: 'xex-tro-wegld',
    dex: 'xexchange',
    pair: 'TRO / WEGLD',
    lpTokenId: 'TROWEGLD-891183',
    address: 'erd1qqqqqqqqqqqqqpgqmmvfh4anzayxwn3cfe23uw6lguu8synr2jpsu3l0am',
    role: 'both',
    swapUrl: 'https://xexchange.com/pools',
    note: 'Poids vote ∝ valeur LP (paper jusqu’au SC governance)',
  },
  {
    id: 'xex-tro-usdc',
    dex: 'xexchange',
    pair: 'TRO / USDC',
    lpTokenId: 'TROUSDC-2a60c7',
    address: 'erd1qqqqqqqqqqqqqpgq9gcl9uldfrymtmj8vtkctrkmjdazw3nj2jpsd3nv2e',
    role: 'vote',
    swapUrl: 'https://xexchange.com/swap?firstToken=TRO-94c925&secondToken=USDC-c76f1f',
    note: 'xExchange TRO/USDC',
  },
  {
    id: 'onedex-tro-egld',
    dex: 'onedex',
    pair: 'TRO / EGLD',
    address: 'erd1qqqqqqqqqqqqqpgqqz6vp9y50ep867vnr296mqf3dduh6guvmvlsu3sujc',
    role: 'both',
    swapUrl: 'https://onedex.app',
    note: 'OneDex',
  },
  {
    id: 'jex-tro',
    dex: 'jexchange',
    pair: 'TRO / *',
    address: '',
    role: 'vote',
    swapUrl: 'https://jexchange.io',
    note: 'JExchange — pair TRO à confirmer on-chain; slot vote multi-DEX',
  },
]

export const TRO_TOKEN_ID = 'TRO-94c925'

/** Poids vote paper : LP USD → votes (1 USD LP ≈ 1 vote unit) jusqu’au SC */
export function lpUsdToVotePower(usd: number): number {
  return Math.max(0, usd)
}

export const DEX_LABEL: Record<TroDex, string> = {
  xexchange: 'xExchange',
  onedex: 'OneDex',
  jexchange: 'JExchange',
}
