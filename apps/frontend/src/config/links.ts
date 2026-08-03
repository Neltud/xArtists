/**
 * Canonical external links — only stable public URLs.
 * Prefer these helpers over hard-coded hrefs scattered in pages.
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
  midjourney: 'https://www.midjourney.com',
  troToken: 'TRO-94c925',
} as const

/** Primary product routes (header). No experimental / dead shells. */
export const PRIMARY_NAV: { to: string; label: string; emoji: string }[] = [
  { to: '/', label: 'Dashboard', emoji: '📊' },
  { to: '/agents', label: 'Agents IA', emoji: '🧠' },
  { to: '/marketplace', label: 'Marketplace', emoji: '🎨' },
  { to: '/gallery', label: 'Galerie', emoji: '🖼️' },
  { to: '/trading', label: 'Trading', emoji: '⚡' },
  { to: '/portfolio', label: 'Portfolio', emoji: '📈' },
  { to: '/tro', label: '$TRO', emoji: '🪙' },
  { to: '/hatom', label: 'Hatom', emoji: '🏦' },
  { to: '/lp', label: 'LP', emoji: '💧' },
  { to: '/staking', label: 'Staking', emoji: '🔒' },
  { to: '/dao', label: 'DAO', emoji: '🗳️' },
  { to: '/wallet', label: 'Wallet', emoji: '👛' },
  { to: '/tip', label: 'Tip', emoji: '💜' },
]

/** Secondary / experimental — not in primary nav */
export const SECONDARY_ROUTES = [
  { to: '/soul-testnet', label: 'Soul (experimental)', note: 'No mainnet funds' },
  { to: '/burnify', label: 'Burnify (shell)', note: 'UI only until SC verified' },
  { to: '/agents/polylia', label: 'Polylia agents', note: 'Optional' },
] as const
