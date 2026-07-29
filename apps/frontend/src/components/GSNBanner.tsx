import { useEffect, useState } from 'react'

/**
 * GSNBanner — GreenSmokeNetwork translucent signal banner.
 *
 * Fetches the aggregated GreenSmoke forecasts (deployed alongside the app at
 * `data/greensmoke_forecasts.json`) with a fallback to the raw GitHub mirror.
 * Renders a backdrop-blur, semi-transparent horizontal strip showing the
 * aggregated signals (primary, secondary, regime, recommended action) plus a
 * compact auto-scrolling strip of agent forecasts. Gradient tint follows the
 * regime: green (RISK_ON), red (RISK_OFF), gray (NEUTRAL).
 */

const LOCAL_URL = 'data/greensmoke_forecasts.json'
const REMOTE_FALLBACK =
  'https://raw.githubusercontent.com/Neltud/xArtists/main/data/greensmoke_forecasts.json'

interface GsForecast {
  asset: string
  direction: string
  signal: string
  confidence: number
  horizon: string
}

interface GsAgent {
  id: string
  name: string
  domain?: string
  forecasts: GsForecast[]
}

interface AggregatedSignals {
  primary: string
  secondary: string
  regime: string
  recommended_action: string
}

interface ForecastData {
  aggregated_signals: AggregatedSignals
  agents: Record<string, GsAgent>
}

type Regime = 'RISK_ON' | 'RISK_OFF' | 'NEUTRAL'

function classifyRegime(regime: string): Regime {
  const r = regime.toUpperCase()
  if (r.includes('RISK_ON')) return 'RISK_ON'
  if (r.includes('RISK_OFF')) return 'RISK_OFF'
  return 'NEUTRAL'
}

const REGIME_STYLES: Record<Regime, { tint: string; border: string; text: string; glow: string }> = {
  RISK_ON: {
    tint: 'from-green-500/15 via-emerald-500/5 to-transparent',
    border: 'border-green-500/25',
    text: 'text-green-400',
    glow: 'shadow-[0_0_20px_-5px_rgba(16,185,129,0.35)]',
  },
  RISK_OFF: {
    tint: 'from-red-500/15 via-rose-500/5 to-transparent',
    border: 'border-red-500/25',
    text: 'text-red-400',
    glow: 'shadow-[0_0_20px_-5px_rgba(244,63,94,0.35)]',
  },
  NEUTRAL: {
    tint: 'from-gray-500/15 via-slate-500/5 to-transparent',
    border: 'border-gray-500/25',
    text: 'text-gray-300',
    glow: 'shadow-[0_0_20px_-5px_rgba(148,163,184,0.25)]',
  },
}

export default function GSNBanner() {
  const [data, setData] = useState<ForecastData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const urls = [LOCAL_URL, REMOTE_FALLBACK]
      for (const url of urls) {
        try {
          const res = await fetch(`${url}?t=${Date.now()}`)
          if (!res.ok) continue
          const json = (await res.json()) as ForecastData
          if (!json?.aggregated_signals) continue
          if (!cancelled) {
            setData(json)
            setError(false)
          }
          return
        } catch {
          /* try next source */
        }
      }
      if (!cancelled) setError(true)
    }
    load()
    const id = setInterval(load, 120_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  if (error || !data) return null

  const sig = data.aggregated_signals
  const regime = classifyRegime(sig.regime)
  const style = REGIME_STYLES[regime]

  // Flatten agent forecasts into a compact strip
  const forecasts: { agent: string; f: GsForecast }[] = []
  for (const agent of Object.values(data.agents)) {
    for (const f of agent.forecasts) {
      forecasts.push({ agent: agent.name, f })
    }
  }

  // Duplicate the list for a seamless marquee loop
  const marqueeItems = [...forecasts, ...forecasts]

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${style.border} bg-[#0d0d14]/60 backdrop-blur-md ${style.glow} mb-6`}
    >
      {/* gradient wash */}
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${style.tint}`} />

      <div className="relative p-3 sm:p-4">
        {/* Top row: aggregated signals */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-300/90">
              🔮 GreenSmoke
            </span>
            <span className={`text-sm font-black ${style.text}`}>{sig.primary}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`badge ${regime === 'RISK_ON' ? 'badge-green' : regime === 'RISK_OFF' ? 'badge-red' : 'badge-gray'}`}>
              {sig.regime}
            </span>
            <span className="badge-purple">{sig.secondary}</span>
          </div>
        </div>

        {/* Recommended action */}
        <p className="text-xs text-gray-400 mb-2">{sig.recommended_action}</p>

        {/* Auto-scrolling compact forecast strip */}
        {forecasts.length > 0 && (
          <div className="relative overflow-hidden">
            <div
              className="flex gap-3 whitespace-nowrap will-change-transform"
              style={{
                animation: 'gsn-marquee 38s linear infinite',
              }}
            >
              {marqueeItems.map(({ agent, f }, i) => (
                <span
                  key={`${agent}-${f.asset}-${i}`}
                  className="inline-flex items-center gap-1.5 text-[11px] text-gray-300 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5"
                >
                  <span className="text-gray-500">{agent}</span>
                  <span className="font-semibold text-gray-200">{f.asset}</span>
                  <span className={f.direction.toLowerCase().includes('bull') || f.direction.toLowerCase().includes('risk_on') ? 'text-green-400' : f.direction.toLowerCase().includes('bear') ? 'text-red-400' : 'text-yellow-400'}>
                    {f.direction}
                  </span>
                  <span className="text-gray-500">{(f.confidence * 100).toFixed(0)}%</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes gsn-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
