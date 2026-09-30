/** Liens + nav dApp (ordre publication hub). */

export const LINKS = {
  github: 'https://github.com/Neltud/xArtists',
  explorer: 'https://explorer.multiversx.com',
  walletWeb: 'https://wallet.multiversx.com',
  xportal: 'https://xportal.com',
  docs: 'https://github.com/Neltud/xArtists/tree/main/docs',
  githubPages: 'https://neltud.github.io/xArtists/',
  walletLogin: (callback: string) =>
    `https://wallet.multiversx.com/hook/login?callbackUrl=${encodeURIComponent(callback)}`,
}

export const PRIMARY_NAV: { to: string; label: string; emoji: string }[] = [
  { to: '/', label: 'Home', emoji: '◈' },
  { to: '/museum', label: 'Musée', emoji: '🖼' },
  { to: '/marketplace', label: 'Marketplace', emoji: '▣' },
  { to: '/agents', label: 'Packs IA', emoji: '◎' },
  { to: '/my-packs', label: 'Mes salles', emoji: '🎫' },
  { to: '/slot', label: 'Slot', emoji: '🎰' },
  { to: '/staking', label: 'Staking', emoji: '◈' },
  { to: '/wallet', label: 'Wallet', emoji: '◇' },
]

export const SECONDARY_NAV: { to: string; label: string; emoji: string }[] = [
  { to: '/studio', label: 'Studio', emoji: '🎨' },
  { to: '/command-center', label: 'Command', emoji: '⌘' },
  { to: '/trading', label: 'Desk', emoji: '⚡' },
  { to: '/portfolio', label: 'Portfolio', emoji: '▤' },
  { to: '/tro', label: '$TRO', emoji: '◎' },
  { to: '/lia', label: 'LIA', emoji: '✦' },
  { to: '/market', label: 'Analyse', emoji: '◐' },
  { to: '/dao', label: 'DAO', emoji: '⬡' },
  { to: '/venues', label: 'Venues', emoji: '◎' },
  { to: '/go-live', label: 'Go Live', emoji: '🚀' },
  { to: '/legal', label: 'Legal', emoji: '§' },
  { to: '/identity', label: 'Identity', emoji: '🪪' },
]

export function getCallbackUrl(): string {
  try {
    return `${window.location.origin}${window.location.pathname}${window.location.hash || '#/'}`
  } catch {
    return LINKS.githubPages
  }
}
