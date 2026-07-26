import { useEffect, useState } from 'react'

const RAW = 'https://raw.githubusercontent.com/Neltud/xArtists/main/data/greensmoke_forecasts.json'

interface Forecast {
  asset: string
  direction: string
  target_usd: number | null
  current_ref: number | null
  confidence: number
  horizon: string
  rationale: string
  signal: string
}

interface GsAgent {
  id: string
  name: string
  platform: string
  role: string
  status: string
  last_run: string
  confidence_avg: number
  horizon: string
  forecasts: Forecast[]
}

interface ForecastData {
  version: string
  updated_at: string
  source: string
  agents: Record<string, GsAgent>
  aggregated_signals: {
    primary: string
    secondary: string
    regime: string
    recommended_action: string
  }
}

const LIA_AGENTS = [
  { key: 'trading', name: 'LIA Trading', icon: '🤖', desc: 'Scalping + Swing + LIABrain', color: 'text-green-400', status: 'active' },
  { key: 'marketplace', name: 'LIA Marketplace', icon: '🎨', desc: 'NFT + RWA + Market Making', color: 'text-purple-400', status: 'active' },
  { key: 'yield', name: 'LIA Yield', icon: '🌾', desc: 'Hatom + xExchange Farms', color: 'text-teal-400', status: 'active' },
  { key: 'security', name: 'LIA Security', icon: '🛡️', desc: 'BalanceGuard + Oracle', color: 'text-blue-400', status: 'active' },
  { key: 'rwa', name: 'LIA RWA Escrow', icon: '🏗️', desc: '$TRO + Arts Physiques', color: 'text-yellow-400', status: 'active' },
  { key: 'dao', name: 'LIA DAO', icon: '🗳️', desc: 'Governance + Proposals', color: 'text-pink-400', status: 'active' },
]

function dirColor(d: string) {
  const x = d.toLowerCase()
  if (x.includes('bull') || x.includes('risk_on') || x === 'buy') return 'text-green-400'
  if (x.includes('bear') || x.includes('risk_off') || x === 'sell') return 'text-red-400'
  return 'text-yellow-400'
}

function signalBadge(s: string) {
  const u = s.toUpperCase()
  if (u.includes('STRONG_BUY') || u.includes('BUY') || u.includes('ACCUMULATE') || u.includes('RISK_ON'))
    return 'badge-green'
  if (u.includes('SELL') || u.includes('RISK_OFF')) return 'badge-red'
  return 'badge-orange'
}

export default function Agents() {
  const [data, setData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(RAW + '?t=' + Date.now())
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const j = (await r.json()) as ForecastData
      setData(j)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 120_000)
    return () => clearInterval(id)
  }, [])

  const agentsList = data ? Object.values(data.agents) : []

  return (
    <div className="animate-fade-in pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black">🧠 Agents IA & Prévisions</h1>
          <p className="text-sm text-gray-500 mt-1">
            GreenSmoke Network (Liia · Lia · Macro) + LIA v6
            {data?.updated_at && (
              <span className="ml-2">· MAJ {new Date(data.updated_at).toLocaleString('fr-FR')}</span>
            )}
          </p>
        </div>
        <button onClick={load} className="btn-secondary text-sm self-start">🔄 Actualiser</button>
      </div>

      {/* Aggregated signals */}
      {data?.aggregated_signals && (
        <div className="card mb-6 border-purple-500/30 bg-purple-500/5">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-3">📡 Signaux agrégés (utilisables)</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-500">Primary</p>
              <p className="font-bold text-green-400">{data.aggregated_signals.primary}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Secondary</p>
              <p className="font-bold text-purple-400">{data.aggregated_signals.secondary}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Régime</p>
              <p className="font-bold text-teal-400">{data.aggregated_signals.regime}</p>
            </div>
          </div>
          <p className="text-sm text-gray-300">
            <span className="text-gray-500">Action recommandée :</span>{' '}
            {data.aggregated_signals.recommended_action}
          </p>
        </div>
      )}

      {loading && !data && (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card h-40 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="card border-red-500/30 text-red-400 mb-6">
          Erreur : {error}. Les prévisions seront rechargées automatiquement.
        </div>
      )}

      {/* GreenSmoke predictive agents */}
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span>🔮</span> Agents prévisionnels GreenSmoke
      </h2>
      <div className="space-y-4 mb-8">
        {agentsList.map(agent => (
          <div key={agent.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {agent.name === 'Macro' ? '🌍' : agent.name === 'Liia' ? '📡' : '📈'}
                </span>
                <div>
                  <p className="font-bold text-lg">{agent.name}</p>
                  <p className="text-xs text-gray-500">{agent.role} · {agent.horizon}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={agent.status === 'active' ? 'badge-green' : 'badge-gray'}>
                  {agent.status === 'active' ? '● Active' : '○ Offline'}
                </span>
                <span className="badge-purple">
                  Conf. {(agent.confidence_avg * 100).toFixed(0)}%
                </span>
                <span className="text-[10px] text-gray-500 mono">
                  {new Date(agent.last_run).toLocaleTimeString('fr-FR')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {agent.forecasts.map((f, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#111118] border border-[#2a2a3a] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                >
                  <div className="min-w-[100px]">
                    <p className="font-semibold text-sm">{f.asset}</p>
                    <p className={`text-xs font-bold ${dirColor(f.direction)}`}>{f.direction}</p>
                  </div>
                  <div className="flex-1 text-xs text-gray-400">
                    {f.rationale}
                    {f.target_usd != null && (
                      <span className="block mt-0.5 text-gray-300">
                        Cible : ${f.target_usd.toLocaleString()} · horizon {f.horizon}
                        {f.current_ref != null && ` · ref ${f.current_ref}`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={signalBadge(f.signal)}>{f.signal}</span>
                    <span className="text-xs text-gray-500">{(f.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* LIA operational agents */}
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span>🤖</span> Agents opérationnels LIA v6
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {LIA_AGENTS.map(a => (
          <div key={a.key} className="card flex items-center gap-3">
            <span className="text-2xl">{a.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${a.color}`}>{a.name}</p>
              <p className="text-[11px] text-gray-500 truncate">{a.desc}</p>
            </div>
            <span className="badge-green text-[10px]">●</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 text-center">
        Prévisions GreenSmoke disponibles dans{' '}
        <code className="text-purple-400">data/greensmoke_forecasts.json</code> —
        utilisables par le dashboard, trading et bots.
      </p>
    </div>
  )
}
