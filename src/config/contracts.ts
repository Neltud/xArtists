/** Mainnet contracts & LIA operational constants — single source of truth for UI */

export const NETWORK = {
  chainId: '1',
  name: 'mainnet',
  api: 'https://api.multiversx.com',
  gateway: 'https://gateway.multiversx.com',
  explorer: 'https://explorer.multiversx.com',
} as const

export const LIA_WALLET =
  'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

export const CONTRACTS = {
  nftStaking: 'erd1qqqqqqqqqqqqqpgqmhtx5cctwwtatyaluycjfucre9y5vq2xyj7sqxr8cl',
  troGovernance: 'erd1qqqqqqqqqqqqqpgqrscvsxseyw04l0urzgnm2er5mxd2z64nyj7s6e0ca8',
  marketplace: 'erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t',
  nftMinter: 'erd1qqqqqqqqqqqqqpgq00a2jzre64akaw4jx257gwwyfxxd8fzfyj7snyztkn',
  agentsMarketplace: null as string | null, // TBD after deploy
} as const

export const TOKENS = {
  WEGLD: 'WEGLD-bd4d79',
  USDC: 'USDC-c76f1f',
  TRO: 'TRO-94c925',
  HWBTC: 'HWBTC-49ca31',
} as const

/** Assets LIA may accumulate (UI + policy mirror) */
export const LIA_ACCUMULATE = ['EGLD', 'WEGLD', 'USDC', 'WBTC', 'HWBTC'] as const

export const LIA_NEVER_HOLD = ['TRO'] as const

export const STRATEGY_BUDGETS = [
  { id: 'TP1', label: 'Scalp +1%', budget: '18%', sl: '−1%', tp: '+1%' },
  { id: 'TP3', label: 'Swing +3%', budget: '18%', sl: '−1.5%', tp: '+3%' },
  { id: 'TP5', label: 'Swing +5%', budget: '12%', sl: '−2.5%', tp: '+5%' },
  { id: 'LIABrain', label: 'Macro core', budget: '22%', sl: '−8%', tp: '+15%' },
  { id: 'Contrarian', label: 'Hedge', budget: '4%', sl: '−1%', tp: '+0.5%' },
  { id: 'CIRCUIT', label: 'Compound 1%', budget: '10%', sl: '−1%', tp: '+1% net' },
] as const

export const GLOBAL_BUDGET_CAP = 0.85

export const GUARDS = [
  'G01 HALT', 'G02 COOLDOWN', 'G03 1 position', 'G04 Goal 1000',
  'G05 Pace 30min', 'G06 Cap 8/j', 'G07 No TRO', 'G08 Notional',
  'G09 Profit+fees', 'G10 Liquidity', 'G11 RISK_OFF', 'G12 HF',
  'G13 Pre-chain', 'G14 SL/BE/Trail', 'G15 Post-tx', 'G16 Drawdown 15%',
  'G17 Horizon veto',
] as const

export const VELLUM_CRON = '0 */1 * * *' // every hour (docs: ToutesLes30Minutes configurable)
export const DAPP_URL = 'https://neltud.github.io/xArtists'

export function shortAddr(a: string, n = 6): string {
  if (!a || a.length < 12) return a || '—'
  return `${a.slice(0, n)}…${a.slice(-4)}`
}

export function explorerAccount(addr: string): string {
  return `${NETWORK.explorer}/accounts/${addr}`
}

export function explorerTx(hash: string): string {
  return `${NETWORK.explorer}/transactions/${hash}`
}
