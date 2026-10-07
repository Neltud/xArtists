/** Liens + nav dApp — aligné product.ts (core first). */

import { CORE_MODULES, SECONDARY_MODULES } from './product'

export const LIA_WALLET =
  'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

export const LINKS = {
  github: 'https://github.com/Neltud/xArtists',
  explorer: 'https://explorer.multiversx.com',
  walletWeb: 'https://wallet.multiversx.com',
  xportal: 'https://xportal.com',
  docs: 'https://github.com/Neltud/xArtists/tree/main/docs',
  githubPages: 'https://neltud.github.io/xArtists/',
  treasuryPolicy: 'https://github.com/Neltud/xArtists/blob/main/docs/TREASURY_POLICY.md',
  walletLogin: (callback: string) =>
    `https://wallet.multiversx.com/hook/login?callbackUrl=${encodeURIComponent(callback)}`,
  explorerAccount: (addr: string) =>
    `https://explorer.multiversx.com/accounts/${encodeURIComponent(addr)}`,
  explorerTx: (hash: string) =>
    `https://explorer.multiversx.com/transactions/${encodeURIComponent(hash)}`,
  explorerToken: (id: string) =>
    `https://explorer.multiversx.com/tokens/${encodeURIComponent(id)}`,
}

export const PRIMARY_NAV = CORE_MODULES.map(m => ({
  to: m.path,
  label: m.label,
  emoji: m.emoji,
}))

export const SECONDARY_NAV = SECONDARY_MODULES.map(m => ({
  to: m.path,
  label: m.label,
  emoji: m.emoji,
}))

export function getCallbackUrl(): string {
  try {
    return `${window.location.origin}${window.location.pathname}${window.location.hash || '#/'}`
  } catch {
    return LINKS.githubPages
  }
}
