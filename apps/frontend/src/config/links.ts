/**
 * Canonical external links — only stable public URLs.
 */

export const LIA_WALLET =
  'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

export const LINKS = {
  github: 'https://github.com/Neltud/xArtists',
  dapp: 'https://neltud.github.io/xArtists/',
  explorer: 'https://explorer.multiversx.com',
  explorerAccount: (addr: string) => `https://explorer.multiversx.com/accounts/${addr}`,
  explorerToken: (id: string) => `https://explorer.multiversx.com/tokens/${id}`,
  explorerNft: (id: string) => `https://explorer.multiversx.com/nfts/${id}`,
  walletWeb: 'https://wallet.multiversx.com',
  walletLogin: (callbackUrl: string) =>
    `https://wallet.multiversx.com/hook/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
  xexchange: 'https://xexchange.com',
  xexchangeTroUsdc: 'https://xexchange.com/swap/USDC-c76f1f/TRO-94c925',
  onedex: 'https://onedex.app',
  hatom: 'https://app.hatom.com',
  hatomDashboard: 'https://app.hatom.com',
  xoxno: 'https://xoxno.com',
  xoxnoCollection: (c: string) => `https://xoxno.com/collection/${c}`,
  greensmokeAgents: 'https://app.greensmoke.network/agents',
  troToken: 'TRO-94c925',
  treasuryPolicy:
    'https://github.com/Neltud/xArtists/blob/main/docs/TREASURY_POLICY.md',
} as const

/** Primary desktop nav — core product paths */
export const PRIMARY_NAV: { to: string; label: string; emoji: string }[] = [
  { to: '/', label: 'Home', emoji: '📊' },
  { to: '/entity', label: 'Entité', emoji: '🏛️' },
  { to: '/sim', label: 'Sim Lab', emoji: '🧪' },
  { to: '/studio', label: 'Studio', emoji: '🎨' },
  { to: '/gallery', label: 'Galerie', emoji: '🖼️' },
  { to: '/marketplace', label: 'Market', emoji: '🛒' },
  { to: '/agents', label: 'Agents', emoji: '🧠' },
  { to: '/agents/voyage', label: 'Voyage', emoji: '✈️' },
  { to: '/my-packs', label: 'My Packs', emoji: '🎫' },
  { to: '/trading', label: 'Trading', emoji: '⚡' },
  { to: '/portfolio', label: 'LIA', emoji: '📈' },
  { to: '/wallet', label: 'Wallet', emoji: '👛' },
  { to: '/dao', label: 'DAO', emoji: '🗳️' },
  { to: '/tro', label: '$TRO', emoji: '🪙' },
]

export const SECONDARY_NAV: { to: string; label: string; emoji: string }[] = [
  { to: '/editions', label: 'Editions', emoji: '📰' },
  { to: '/hatom', label: 'Hatom', emoji: '🏦' },
  { to: '/lp', label: 'LP', emoji: '💧' },
  { to: '/tip', label: 'Tip', emoji: '💜' },
  { to: '/ads', label: 'Ads', emoji: '📢' },
  { to: '/staking', label: 'Staking', emoji: '🔒' },
  { to: '/soul-testnet', label: 'Soul (pre-mainnet)', emoji: '🧪' },
  { to: '/burnify', label: 'Burnify (pre-mainnet)', emoji: '🔥' },
]

export const SECONDARY_ROUTES = [
  { to: '/staking', label: 'Staking', note: '' },
  { to: '/soul-testnet', label: 'Soul (pre-mainnet)', note: 'No mainnet funds' },
  { to: '/burnify', label: 'Burnify (pre-mainnet)', note: 'tro-burn SC + EGLD rewards after deploy' },
] as const
