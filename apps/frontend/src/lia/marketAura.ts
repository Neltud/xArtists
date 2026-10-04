/**
 * Market → Aura bridge (MOD-V1.2).
 * High BTC/ETH vol → nervous / red / fast pulse.
 * Low vol → stable / blue / calm.
 * Paper-only influence on shader targets — no live trading.
 */

export type MarketAuraSnap = {
  btcUsd: number | null
  ethUsd: number | null
  egldUsd: number | null
  /** 0–1 synthetic volatility proxy */
  volProxy: number
  sentimentProxy: number
  mood: 'aggressive' | 'nervous' | 'stable'
  label: string
  ts: number
}

const CACHE_KEY = 'xartists_market_aura_v1'

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

/** Derive vol proxy from short price history stored in session. */
function updateHistory(key: string, price: number): number {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    const all = raw ? (JSON.parse(raw) as Record<string, number[]>) : {}
    const arr = Array.isArray(all[key]) ? all[key] : []
    arr.push(price)
    while (arr.length > 12) arr.shift()
    all[key] = arr
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(all))
    if (arr.length < 3) return 0.35
    const rets: number[] = []
    for (let i = 1; i < arr.length; i++) {
      if (arr[i - 1] > 0) rets.push((arr[i] - arr[i - 1]) / arr[i - 1])
    }
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length
    const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length
    const std = Math.sqrt(variance)
    // scale typical crypto micro-moves into 0–1
    return clamp01(std * 80)
  } catch {
    return 0.35
  }
}

export async function fetchMarketAura(): Promise<MarketAuraSnap> {
  let btcUsd: number | null = null
  let ethUsd: number | null = null
  let egldUsd: number | null = null
  try {
    const r = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd',
      { cache: 'no-store' },
    )
    if (r.ok) {
      const j = await r.json()
      btcUsd = Number(j.bitcoin?.usd) || null
      ethUsd = Number(j.ethereum?.usd) || null
    }
  } catch {
    /* */
  }
  try {
    const r = await fetch('https://api.multiversx.com/economics', { cache: 'no-store' })
    if (r.ok) {
      const j = await r.json()
      egldUsd = Number(j.price) || null
    }
  } catch {
    /* */
  }

  const vols: number[] = []
  if (btcUsd) vols.push(updateHistory('btc', btcUsd))
  if (ethUsd) vols.push(updateHistory('eth', ethUsd))
  if (egldUsd) vols.push(updateHistory('egld', egldUsd))
  const volProxy = vols.length ? vols.reduce((a, b) => a + b, 0) / vols.length : 0.35

  // soft sentiment: short window drift of BTC if available
  let sentimentProxy = 0
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    const all = raw ? (JSON.parse(raw) as Record<string, number[]>) : {}
    const arr = all.btc || []
    if (arr.length >= 2 && arr[0] > 0) {
      sentimentProxy = clamp01(Math.abs((arr[arr.length - 1] - arr[0]) / arr[0]) * 20) *
        Math.sign(arr[arr.length - 1] - arr[0])
      sentimentProxy = Math.max(-1, Math.min(1, sentimentProxy))
    }
  } catch {
    /* */
  }

  let mood: MarketAuraSnap['mood'] = 'stable'
  let label = 'Calm majors · SHADOW aura'
  if (volProxy > 0.55) {
    mood = 'nervous'
    label = 'High vol majors · erratic aura · SHADOW'
  } else if (volProxy > 0.4 && sentimentProxy > 0.1) {
    mood = 'aggressive'
    label = 'Risk-on drift · SHADOW'
  }

  return {
    btcUsd,
    ethUsd,
    egldUsd,
    volProxy,
    sentimentProxy,
    mood,
    label,
    ts: Date.now(),
  }
}

/** Map market snap → partial pulse-like env for compileSemantic / CommandWall */
export function marketToPulseFields(snap: MarketAuraSnap): {
  sentiment: number
  intensity: 'low' | 'medium' | 'high'
  vibe: string
  category: string
  context: string
} {
  const intensity =
    snap.volProxy > 0.55 ? 'high' : snap.volProxy > 0.35 ? 'medium' : 'low'
  return {
    sentiment: snap.sentimentProxy,
    intensity,
    vibe: snap.mood,
    category: 'macro',
    context: snap.label,
  }
}
