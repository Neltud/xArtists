/**
 * Single source of truth — mainnet addresses + explorer-verified codeHash.
 * Probe 2026-10-01: every product SC has non-null codeHash.
 * Env overrides win; never send funds to LEGACY_EMPTY placeholders.
 */

const truthy = (v: string | undefined) =>
  v === '1' || v === 'true' || v === 'TRUE' || v === 'yes'

function env(key: string): string {
  try {
    return String((import.meta as { env?: Record<string, string> }).env?.[key] || '').trim()
  } catch {
    return ''
  }
}

function envFirst(...keys: string[]): string {
  for (const k of keys) {
    const v = env(k)
    if (v) return v
  }
  return ''
}

/** Empty accounts from the pre-deploy era — never a TX receiver. */
export const LEGACY_EMPTY = {
  marketplace: 'erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t',
  nftStaking: 'erd1qqqqqqqqqqqqqpgqmhtx5cctwwtatyaluycjfucre9y5vq2xyj7sqxr8cl',
  troGovernance: 'erd1qqqqqqqqqqqqqpgqrscvsxseyw04l0urzgnm2er5mxd2z64nyj7s6e0ca8',
  nftMinter: 'erd1qqqqqqqqqqqqqpgq00a2jzre64akaw4jx257gwwyfxxd8fzfyj7snyztkn',
} as const

export const MAINNET_ADDRESSES = {
  venue_split: 'erd1qqqqqqqqqqqqqpgqvy4qejg6lds00hy829nwmyxktrdqsuq3vhxq2vje2y',
  nft_marketplace: 'erd1qqqqqqqqqqqqqpgqx0araa285cdepdsfe8s23mer30r3dh9lvhxqq8txmm',
  agents_marketplace: 'erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg',
  nft_staking: 'erd1qqqqqqqqqqqqqpgq9ensu3f3p9yx4a583swu0raq8zzeve7tvhxq4fgtgu',
  tro_staking: 'erd1qqqqqqqqqqqqqpgqes0a2kryurmt34g7nu4kx9n4ftj77dl5vhxqpe3xf3',
  tro_staking_legacy: 'erd1qqqqqqqqqqqqqpgqqpc9064q0t33dasd23k2hm36fu5gqp7mvhxq9xvpwf',
  tro_governance: 'erd1qqqqqqqqqqqqqpgqe6xrgq2y53q8d0lsact2dppzvg42t4wcvhxq9e9euy',
  agent_stake_escrow: 'erd1qqqqqqqqqqqqqpgqzyvwldu6jq8w6ry6s856dl0uy7g0v37vvhxqndvzr3',
  treasury_splitter: 'erd1qqqqqqqqqqqqqpgq245sma97w0j9ga9jdgxu36zs0v8g0y6evhxq2nkezv',
  slot_casino: 'erd1qqqqqqqqqqqqqpgquf3cuv2zsfsahy7ypvter3qcep4ptthsvhxqs4g34f',
} as const

/** Explorer-verified 2026-10-01 — do not invent hashes. */
export const MAINNET_CODEHASH = {
  venue_split: 'SRrGio4iLmtQrb22JJhapwobNgavYsoQ52WmfT1owuY=',
  nft_marketplace: '8TTszCmNyPZXjrzQ/fSKXX8+QzW7wFtCfdmiKsZBgFc=',
  agents_marketplace: 'tDIcnNMbDG5E7tpb7NTeJDnT6JxKs7faN7hyCALFUWs=',
  nft_staking: 'hXcRjpclnq0jsonSIemM17+tszcWpPjWKtCPUfnMuME=',
  tro_staking: 'Jf5ZhzAGu58ez0njdWoZAnRxP7YevYSX9dpO8pGq7SA=',
  tro_staking_legacy: 'Kz0+zcj7w/3RuOl5m6dumxA9dhFOideb7jGKTam2VVA=',
  tro_governance: '+9aNhboFyQuvteDzjkiQHdRTlXAtFyijK+iXV74UOsQ=',
  agent_stake_escrow: 'Hs3AClbYzDpyZ6f/UjB9gBekiYKApXGxcVWy3mmlSnE=',
  treasury_splitter: '9pB9+UN372QxE77Nj8TUjWn6+Q6qtOPhmmXgUdLnpk8=',
  slot_casino: 'UZ0nX6dWsSgkVqjnFnR5zPNPk1UrNtR5SsrYf96VJCs=',
} as const

export const LIA_OPS = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'
export const GROKYVERSX_WALLET = 'erd12c7f9wll0dcn26ax9fwrgp3yuswchyh9xwz8zs29hl9crgpn96gsdqq5gl'
export const TRO_TOKEN_ID_DEFAULT = 'TRO-94c925'

export const VENUE_SC_CODEHASH_MAINNET = MAINNET_CODEHASH.venue_split
export const TRO_STAKING_CODEHASH_MAINNET = MAINNET_CODEHASH.tro_staking
export const SLOT_CASINO_CODEHASH_MAINNET = MAINNET_CODEHASH.slot_casino
export const MARKETPLACE_CODEHASH_MAINNET = MAINNET_CODEHASH.nft_marketplace
export const AGENTS_CODEHASH_MAINNET = MAINNET_CODEHASH.agents_marketplace
export const NFT_STAKING_CODEHASH_MAINNET = MAINNET_CODEHASH.nft_staking
export const TRO_GOVERNANCE_CODEHASH_MAINNET = MAINNET_CODEHASH.tro_governance
export const ESCROW_CODEHASH_MAINNET = MAINNET_CODEHASH.agent_stake_escrow
export const TREASURY_CODEHASH_MAINNET = MAINNET_CODEHASH.treasury_splitter

export const MARKETPLACE_ADDRESS =
  env('VITE_MARKETPLACE_ADDRESS') || MAINNET_ADDRESSES.nft_marketplace
export const AGENTS_MARKETPLACE_ADDRESS =
  env('VITE_AGENTS_MARKETPLACE_ADDRESS') || MAINNET_ADDRESSES.agents_marketplace
export const VENUE_SC_ADDRESS = env('VITE_VENUE_SC_ADDRESS') || MAINNET_ADDRESSES.venue_split
export const TRO_STAKING_ADDRESS = env('VITE_TRO_STAKING_ADDRESS') || MAINNET_ADDRESSES.tro_staking
export const NFT_STAKING_ADDRESS = env('VITE_NFT_STAKING_ADDRESS') || MAINNET_ADDRESSES.nft_staking
export const TRO_GOVERNANCE_ADDRESS =
  env('VITE_TRO_GOVERNANCE_ADDRESS') || MAINNET_ADDRESSES.tro_governance
export const AGENT_STAKE_ESCROW_ADDRESS =
  envFirst('VITE_AGENT_ESCROW_ADDRESS', 'VITE_AGENT_STAKE_ESCROW_ADDRESS') ||
  MAINNET_ADDRESSES.agent_stake_escrow
export const TREASURY_SPLITTER_ADDRESS =
  envFirst('VITE_TREASURY_ADDRESS', 'VITE_TREASURY_SPLITTER_ADDRESS') ||
  MAINNET_ADDRESSES.treasury_splitter
export const SLOT_CASINO_ADDRESS = env('VITE_SLOT_CASINO_ADDRESS') || MAINNET_ADDRESSES.slot_casino
export const TRO_TOKEN_ID = env('VITE_TRO_TOKEN_ID') || TRO_TOKEN_ID_DEFAULT

export const MARKETPLACE_LIVE = truthy(env('VITE_MARKETPLACE_CODEHASH_OK'))
export const AGENTS_LIVE = truthy(env('VITE_AGENTS_CODEHASH_OK'))
export const VENUE_LIVE = truthy(env('VITE_VENUE_CODEHASH_OK'))
export const NFT_STAKING_LIVE = truthy(env('VITE_NFT_STAKING_CODEHASH_OK'))
export const TRO_STAKING_LIVE = truthy(env('VITE_TRO_STAKING_CODEHASH_OK'))
export const TRO_GOVERNANCE_LIVE = truthy(env('VITE_TRO_GOVERNANCE_CODEHASH_OK'))
export const AGENT_ESCROW_LIVE = truthy(env('VITE_AGENT_ESCROW_CODEHASH_OK'))
export const TREASURY_LIVE = truthy(env('VITE_TREASURY_CODEHASH_OK'))
export const SLOT_CASINO_LIVE =
  truthy(env('VITE_SLOT_CASINO_CODEHASH_OK')) || truthy(env('VITE_SLOT_CODEHASH_OK'))

export type UnlockKey =
  | 'slot'
  | 'marketplace'
  | 'agents'
  | 'tro_staking'
  | 'nft_staking'
  | 'venue'
  | 'governance'
  | 'escrow'
  | 'treasury'

export const UNLOCK_JOBS: { key: UnlockKey; addr: string; expected: string }[] = [
  { key: 'slot', addr: SLOT_CASINO_ADDRESS, expected: SLOT_CASINO_CODEHASH_MAINNET },
  { key: 'marketplace', addr: MARKETPLACE_ADDRESS, expected: MARKETPLACE_CODEHASH_MAINNET },
  { key: 'agents', addr: AGENTS_MARKETPLACE_ADDRESS, expected: AGENTS_CODEHASH_MAINNET },
  { key: 'tro_staking', addr: TRO_STAKING_ADDRESS, expected: TRO_STAKING_CODEHASH_MAINNET },
  { key: 'nft_staking', addr: NFT_STAKING_ADDRESS, expected: NFT_STAKING_CODEHASH_MAINNET },
  { key: 'venue', addr: VENUE_SC_ADDRESS, expected: VENUE_SC_CODEHASH_MAINNET },
  { key: 'governance', addr: TRO_GOVERNANCE_ADDRESS, expected: TRO_GOVERNANCE_CODEHASH_MAINNET },
  { key: 'escrow', addr: AGENT_STAKE_ESCROW_ADDRESS, expected: ESCROW_CODEHASH_MAINNET },
  { key: 'treasury', addr: TREASURY_SPLITTER_ADDRESS, expected: TREASURY_CODEHASH_MAINNET },
]
