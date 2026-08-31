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
  lightningFaucetBuild: 'https://lightningfaucet.com/build/',
  troToken: 'TRO-94c925',
  treasuryPolicy:
    'https://github.com/Neltud/xArtists/blob/main/docs/TREASURY_POLICY.md',
} as const

/** Primary — cœur soft launch (Header filtre un sous-ensemble desktop). */
export const PRIMARY_NAV: { to: string; label: string; emoji: string }[] = [
  { to: '/', label: 'Home', emoji: '◈' },
  { to: '/agents', label: 'Packs', emoji: '◎' },
  { to: '/museum', label: 'Musée', emoji: '🏛' },
  { to: '/tours', label: 'Tours', emoji: '◉' },
  { to: '/gallery', label: 'Galerie', emoji: '🖼' },
  { to: '/wallet', label: 'Wallet', emoji: '◇' },
  { to: '/marketplace', label: 'Market', emoji: '▣' },
  { to: '/my-packs', label: 'My Packs', emoji: '🎫' },
  { to: '/trading', label: 'Trading', emoji: '⚡' },
  { to: '/legal', label: 'Légal', emoji: '§' },
]

/** Secondary — lab / pre-mainnet gelés (préfixe Lab ·). */
export const SECONDARY_NAV: { to: string; label: string; emoji: string }[] = [
  { to: '/studio', label: 'Studio', emoji: '🎨' },
  { to: '/tro', label: '$TRO', emoji: '🪙' },
  { to: '/portfolio', label: 'LIA Board', emoji: '📈' },
  { to: '/dao', label: 'DAO', emoji: '🗳️' },
  { to: '/entity', label: 'Lab · Entité', emoji: '🏛' },
  { to: '/sim', label: 'Lab · Sim', emoji: '🧪' },
  { to: '/sitemap', label: 'Plan', emoji: '🗺' },
  { to: '/staking', label: 'Lab · Staking', emoji: '🔒' },
  { to: '/hatom', label: 'Lab · Hatom', emoji: '🏦' },
  { to: '/lp', label: 'Lab · LP', emoji: '💧' },
  { to: '/tip', label: 'Tip', emoji: '💜' },
  { to: '/soul-testnet', label: 'Lab · Soul', emoji: '🧪' },
  { to: '/burnify', label: 'Lab · Burnify', emoji: '🔥' },
  { to: '/ads', label: 'Lab · Ads', emoji: '📢' },
  { to: '/editions', label: 'Lab · Editions', emoji: '📰' },
  { to: '/agents/lightning', label: 'Lab · Lightning', emoji: '⚡' },
]

export const SECONDARY_ROUTES = [
  { to: '/staking', label: 'Staking', note: '' },
  { to: '/soul-testnet', label: 'Soul (pre-mainnet)', note: 'No mainnet funds' },
  { to: '/burnify', label: 'Burnify (pre-mainnet)', note: 'tro-burn SC + EGLD rewards after deploy' },
] as const
