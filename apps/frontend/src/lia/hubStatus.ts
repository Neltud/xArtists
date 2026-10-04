/** Load optional server-published hub status (Vellum mirror). */

export type LiaHubStatus = {
  ts?: string
  paper?: true
  shadow_pnl_usd?: number
  shadow_equity_usd?: number
  win_rate?: number
  fills?: number
  strategy?: string
  confidence?: number
  note?: string
}

function bases(): string[] {
  const list: string[] = []
  if (typeof window !== 'undefined') {
    list.push(`${window.location.origin}${import.meta.env.BASE_URL || '/'}data/`)
  }
  list.push('https://neltud.github.io/xArtists/data/')
  list.push('/data/')
  return list
}

export async function fetchLiaHubStatus(): Promise<LiaHubStatus | null> {
  for (const base of bases()) {
    try {
      const url = `${base.replace(/\/?$/, '/')}lia_hub_status.json?t=${Date.now()}`
      const r = await fetch(url, { cache: 'no-store' })
      if (!r.ok) continue
      const j = (await r.json()) as LiaHubStatus
      if (j && typeof j === 'object') return j
    } catch {
      /* */
    }
  }
  return null
}
