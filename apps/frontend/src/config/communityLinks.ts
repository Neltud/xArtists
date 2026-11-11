/**
 * Public xArtists community contact destinations.
 *
 * There is deliberately NO default invite: a historic Discord invite in
 * project docs and speculative Telegram usernames are not proof of ownership.
 * Only configure operator-confirmed links in the frontend build environment.
 * Never put bot tokens, chat IDs, webhooks or private invitation data here.
 */
type ContactNetwork = 'discord' | 'telegram'

export function approvedCommunityUrl(network: ContactNetwork, value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 250 || !value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash) return null
    if (network === 'discord') {
      const invite = url.hostname === 'discord.gg' && /^\/[A-Za-z0-9_-]{3,80}\/?$/.test(url.pathname)
      const canonical = url.hostname === 'discord.com' && /^\/invite\/[A-Za-z0-9_-]{3,80}\/?$/.test(url.pathname)
      return invite || canonical ? url.href : null
    }
    if (network === 'telegram') {
      const host = url.hostname === 't.me' || url.hostname === 'telegram.me'
      // Public handle, direct public channel or official invite link only.
      const path = /^\/(?:[A-Za-z0-9_]{5,32}|\+[A-Za-z0-9_-]{10,100}|joinchat\/[A-Za-z0-9_-]{10,100})\/?$/.test(url.pathname)
      return host && path ? url.href : null
    }
    return null
  } catch { return null }
}

export const COMMUNITY_CONTACTS = {
  discord: approvedCommunityUrl('discord', import.meta.env.VITE_XARTISTS_DISCORD_INVITE_URL),
  telegram: approvedCommunityUrl('telegram', import.meta.env.VITE_XARTISTS_TELEGRAM_URL),
} as const
