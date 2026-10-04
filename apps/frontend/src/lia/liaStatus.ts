/**
 * Aggregator client — data/lia_status.json (Vellum / Pages).
 * Same contract as future GET /api/lia/status.
 */

export type LiaStatusV1 = {
  schema?: string
  ts?: string
  paper?: boolean
  LIA_LIVE_TRADING?: number
  onchain?: {
    address?: string
    egld?: number | null
    egld_usd?: number | null
    tokens?: { identifier?: string; ticker?: string; balance?: number }[]
    tx_count?: number | null
    error?: string | null
  }
  mindset?: {
    strategy?: string | null
    confidence?: number | null
    vellum_ts?: string | null
    vellum_ok?: boolean
    guardian_allow?: boolean
  }
  /** Derived server-side or client — bull/bear/stable/reward */
  aura?: {
    mode?: string
    trend?: string
    confidence?: number | null
    source?: string
  }
  shadow?: {
    fills?: number
    shadow_pnl_usd?: number
    win_rate?: number | null
    last_shadow?: {
      id?: string
      side?: string
      asset?: string
      pnl_usd?: number
      ts?: string
    }[]
    source?: string
  }
  links?: { explorer?: string; hub?: string }
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

/** Map aggregator fields → aura mode (no WebSocket; poll-driven). */
export function auraFromStatus(st: LiaStatusV1 | null | undefined): {
  mode: string
  trend: string
  confidence: number | null
  source: string
} {
  if (st?.aura?.mode) {
    return {
      mode: String(st.aura.mode),
      trend: String(st.aura.trend || 'flat'),
      confidence: st.aura.confidence ?? st.mindset?.confidence ?? null,
      source: String(st.aura.source || 'aggregator'),
    }
  }
  const pnl = st?.shadow?.shadow_pnl_usd
  const conf = st?.mindset?.confidence
  let mode = 'stable'
  let trend = 'flat'
  if (typeof pnl === 'number') {
    if (pnl > 0.5) {
      mode = 'bull'
      trend = 'up'
    } else if (pnl < -0.5) {
      mode = 'bear'
      trend = 'down'
    }
  }
  if (st?.shadow?.fills && st.shadow.fills > 0 && Math.abs(Number(pnl) || 0) < 0.05) {
    mode = 'reward'
  }
  return {
    mode,
    trend,
    confidence: conf ?? null,
    source: 'client_derive',
  }
}

export async function fetchLiaStatus(): Promise<LiaStatusV1 | null> {
  const apiBase = (() => {
    try {
      return String(
        (import.meta as { env?: { VITE_LIA_API?: string } }).env?.VITE_LIA_API || '',
      ).replace(/\/$/, '')
    } catch {
      return ''
    }
  })()

  if (apiBase) {
    try {
      const r = await fetch(`${apiBase}/api/lia/status`, { cache: 'no-store' })
      if (r.ok) {
        const j = (await r.json()) as LiaStatusV1
        if (j && typeof j === 'object') return j
      }
    } catch {
      /* fall through to static */
    }
  }

  for (const base of bases()) {
    try {
      const r = await fetch(`${base}lia_status.json`, { cache: 'no-store' })
      if (!r.ok) continue
      const j = (await r.json()) as LiaStatusV1
      if (j && typeof j === 'object') return j
    } catch {
      /* try next */
    }
  }
  return null
}
