/**
 * GreenSmoke Network (GSN) — partner agent economy on MultiversX.
 * Future-ready aliases so UI / board / Vellum can rename without scatter.
 *
 * xArtists remains the product brand; GSN is the signal / agent-network layer.
 * @see https://app.greensmoke.network/
 */

export const GSN = {
  /** Canonical product name */
  name: 'GreenSmoke Network',
  short: 'GSN',
  /** Legacy / ticker-style labels still seen in boards */
  aliases: ['GreenSmoke', 'Green Smoke', 'GSN', 'GreenSmokeNetwork', 'GreenSmokeAI'] as const,
  tagline: 'Sovereign AI agents · on-chain reputation · MultiversX',
  liveOnMainnet: true,
  supernovaReady: true,
  urls: {
    app: 'https://app.greensmoke.network/',
    agents: 'https://app.greensmoke.network/agents',
    docs: 'https://app.greensmoke.network/docs',
    roadmap: 'https://app.greensmoke.network/docs/roadmap/roadmap',
    x: 'https://x.com/GreenSmokeNet',
  },
  /** Signal ids used on LIA / trading board */
  signals: {
    eliteMvx: 'GSN Elite MVX',
    alphaMacro: 'GSN Alpha Macro',
  },
} as const

/** Normalize any legacy label → display name */
export function gsnDisplayName(raw?: string | null): string {
  if (!raw) return GSN.name
  const t = raw.trim()
  if (!t) return GSN.name
  const lower = t.toLowerCase()
  if (
    lower.includes('greensmoke') ||
    lower === 'gsn' ||
    lower.startsWith('gsn ')
  ) {
    // Keep signal suffix when present: "GSN Elite MVX" → "GreenSmoke Elite MVX"
    if (/^gsn\s+/i.test(t)) return t.replace(/^gsn\s+/i, `${GSN.short} `)
    return GSN.name
  }
  return t
}

/** True if string refers to GreenSmoke / GSN */
export function isGsnLabel(raw: string): boolean {
  const lower = raw.toLowerCase()
  return (
    lower.includes('greensmoke') ||
    lower.includes('green smoke') ||
    /\bgsn\b/.test(lower)
  )
}
