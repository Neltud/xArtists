/**
 * Canonical external links + nav (no duplicate routes).
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
  xoxnoBridge: 'https://xoxno.com/defi/bridge',
  xoxnoCollection: (c: string) => `https://xoxno.com/collection/${c}`,
  usdt0: 'https://usdt0.to',
  greensmokeAgents: 'https://app.greensmoke.network/agents',
  lightningFaucetBuild: 'https://lightningfaucet.com/build/',
  troToken: 'TRO-94c925',
  treasuryPolicy:
    'https://github.com/Neltud/xArtists/blob/main/docs/TREASURY_POLICY.md',
} as const

/** Menu principal — une entrée Galerie (pas /gallery + /museum). */
export const PRIMARY_NAV: { to: string; label: string; emoji: string }[] = [
  { to: '/', label: 'Home', emoji: '◈' },
  { to: '/museum', label: 'Galerie', emoji: '🖼' },
  { to: '/agents', label: 'Packs', emoji: '◎' },
  { to: '/my-packs', label: 'My Packs', emoji: '🎫' },
  { to: '/tours', label: 'Tours', emoji: '◉' },
  { to: '/wallet', label: 'Wallet', emoji: '◇' },
  { to: '/marketplace', label: 'Market', emoji: '▣' },
  { to: '/trading', label: 'Trading', emoji: '⚡' },
  { to: '/legal', label: 'Légal', emoji: '§' },
]

/** Lab — hors parcours démo. */
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
