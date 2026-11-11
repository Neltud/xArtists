/**
 * Chorus board first. Vellum last-run is a tombstone.
 * No TX. Fail soft.
 */

export type VellumLastRun = {
  ts?: string
  version?: string
  live?: boolean
  chain_id?: string
  engine?: string
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
  list.push('https://xartists.art/data/')
  list.push('/data/')
  return list
}

async function fetchJson(name: string): Promise<Record<string, unknown> | null> {
  for (const base of bases()) {
    try {
      const url = `${base.replace(/\/?$/, '/')}${name}?t=${Date.now()}`
      const r = await fetch(url, { cache: 'no-store' })
      if (!r.ok) continue
      const j = (await r.json()) as Record<string, unknown>
      if (j && typeof j === 'object') return j
    } catch {
      /* try next */
    }
  }
  return null
}

export async function fetchVellumLastRun(): Promise<VellumLastRun | null> {
  const chorus = await fetchJson('chorus_board.json')
  if (chorus) {
    const cut = (chorus.crosscut || {}) as { stance?: string }
    return {
      ts: typeof chorus.ts === 'string' ? chorus.ts : undefined,
      version: 'chorus',
      engine: 'chorus',
      live: false,
      summary: {
        mode: cut.stance || 'ABSTAIN',
        ok: true,
        guardian_allow: false,
      },
    }
  }
  const legacy = await fetchJson('vellum_last_run.json')
  return legacy as VellumLastRun | null
}
