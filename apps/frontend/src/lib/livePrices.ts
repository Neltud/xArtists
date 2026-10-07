/** EGLD/TRO prices — prefer access-api /v1/prices (TTL 60s), else direct MVX. */

function apiBase() {
  return ((import.meta.env.VITE_ACCESS_API_BASE as string) || '').replace(/\/$/, '')
}

const SERIES_KEY = 'xartists_egld_series_v2'

export async function fetchEgldSeries(limit = 10): Promise<{
  heights: number[]
  egldUsd: number | null
  troPrice: number | null
  live: boolean
}> {
  let egldUsd: number | null = null
  let troPrice: number | null = null
  let live = false

  const base = apiBase()
  try {
    if (base) {
      const r = await fetch(`${base}/v1/prices`, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
      if (r.ok) {
        const j = await r.json()
        if (j.egld?.usd) {
          egldUsd = Number(j.egld.usd)
          live = true
        }
        if (j.tro?.price != null) troPrice = Number(j.tro.price)
      }
    }
  } catch {
    /* */
  }

  if (egldUsd == null) {
    try {
      const r = await fetch('https://api.multiversx.com/economics', {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      })
      if (r.ok) {
        const j = await r.json()
        egldUsd = Number(j.price) || null
        live = Boolean(egldUsd)
      }
    } catch {
      /* */
    }
  }

  let series: number[] = []
  try {
    const raw = sessionStorage.getItem(SERIES_KEY)
    if (raw) series = JSON.parse(raw) as number[]
  } catch {
    /* */
  }
  if (egldUsd && egldUsd > 0) {
    series = [...series, egldUsd].slice(-limit)
    try {
      sessionStorage.setItem(SERIES_KEY, JSON.stringify(series))
    } catch {
      /* */
    }
  }
  if (series.length < 3) {
    const baseP = egldUsd || 12
    series = Array.from({ length: limit }, (_, i) => baseP * (1 + Math.sin(i * 0.55) * 0.03))
    if (egldUsd) series[series.length - 1] = egldUsd
  }

  const min = Math.min(...series)
  const max = Math.max(...series)
  const span = max - min || 1
  const heights = series.map(v => 0.12 + ((v - min) / span) * 0.73)

  return { heights, egldUsd, troPrice, live }
}
