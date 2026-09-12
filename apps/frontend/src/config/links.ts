/**
 * Canonical external links + nav (no duplicate routes).
 */

import { GSN } from './greenSmoke'
import { GROKYVERSX } from './grokyversx'

export const LIA_WALLET =
  'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

export const GROK_WALLET = GROKYVERSX.wallet

export const LINKS = {
  github: 'https://github.com/Neltud/xArtists',
  discord: 'https://discord.gg/QkJgzeyWG',
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
  greensmokeAgents: GSN.urls.agents,
  greensmoke: GSN.urls.app,
  greensmokeDocs: GSN.urls.docs,
  greensmokeRoadmap: GSN.urls.roadmap,
  greensmokeX: GSN.urls.x,
  lightningFaucetBuild: 'https://lightningfaucet.com/build/',
  troToken: 'TRO-94c925',
  treasuryPolicy:
    'https://github.com/Neltud/xArtists/blob/main/docs/TREASURY_POLICY.md',
  supernovaHub: 'https://supernova.multiversx.com/',
  liaExplorer: `https://explorer.multiversx.com/accounts/${LIA_WALLET}`,
  grokyversxExplorer: `https://explorer.multiversx.com/accounts/${GROKYVERSX.wallet}`,
} as const

export const PRIMARY_NAV: { to: string; label: string; emoji: string }[] = [
  { to: '/', label: 'Home', emoji: '◈' },
  { to: '/museum', label: 'Galerie', emoji: '🖼' },
  { to: '/agents', label: 'Packs', emoji: '◎' },
  { to: '/market', label: 'Analyse', emoji: '◐' },
  { to: '/my-packs', label: 'My Packs', emoji: '🎫' },
  { to: '/tours', label: 'Tours', emoji: '◉' },
  { to: '/wallet', label: 'Wallet', emoji: '◇' },
  { to: '/marketplace', label: 'Market', emoji: '▣' },
  { to: '/trading', label: 'Trading', emoji: '⚡' },
  { to: '/legal', label: 'Légal', emoji: '§' },
]

export const SECONDARY_NAV: { to: string; label: string; emoji: string }[] = [
  { to: '/staking', label: 'Staking', emoji: '◈' },
  { to: '/dao', label: 'DAO', emoji: '⬡' },
  { to: '/portfolio', label: 'Portfolio', emoji: '▤' },
  { to: '/tro', label: '$TRO', emoji: '◎' },
]
