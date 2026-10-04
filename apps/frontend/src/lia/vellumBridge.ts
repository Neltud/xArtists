/**
 * Read last Vellum pipeline publish (if mirrored to public/data).
 * No TX. Fail soft.
 */

export type VellumLastRun = {
  ts?: string
  version?: string
  live?: boolean
  chain_id?: string
  summary?: {
    mode?: string
    elapsed_ms?: number
    guardian_allow?: boolean
    failed_steps?: string[]
    ok?: boolean
  }
  steps?: { id: string; ok?: boolean; error?: string }[]
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

export async function fetchVellumLastRun(): Promise<VellumLastRun | null> {
  for (const base of bases()) {
    try {
      const url = `${base.replace(/\/?$/, '/')}vellum_last_run.json?t=${Date.now()}`
      const r = await fetch(url, { cache: 'no-store' })
      if (!r.ok) continue
      const j = (await r.json()) as VellumLastRun
      if (j && typeof j === 'object') return j
    } catch {
      /* try next */
    }
  }
  return null
}
