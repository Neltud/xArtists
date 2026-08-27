import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AgentsMarketplacePanel from '../components/AgentsMarketplacePanel'
import AgentsDeployStatus from '../components/AgentsDeployStatus'
import CreateSubAgentForm from '../components/CreateSubAgentForm'
import TreasuryBanner from '../components/TreasuryBanner'
import GsnLeaderboard from '../components/GsnLeaderboard'
import AgentPacksGrid from '../components/AgentPacksGrid'
import AgentPackJourney from '../components/AgentPackJourney'
import RwaAssetsStrip from '../components/RwaAssetsStrip'
import PackCheckout from '../components/PackCheckout'
import PageGuide from '../components/PageGuide'
import AgentsJourneyStrip from '../components/AgentsJourneyStrip'
import VoyageAgentPanel from '../components/VoyageAgentPanel'

const LOCAL = `${import.meta.env.BASE_URL}data/greensmoke_forecasts.json`
const RAW_PUBLIC =
  'https://raw.githubusercontent.com/Neltud/xArtists/main/apps/frontend/public/data/greensmoke_forecasts.json'
const RAW_DATA =
  'https://raw.githubusercontent.com/Neltud/xArtists/main/data/greensmoke_forecasts.json'

interface Forecast {
  asset: string
  direction: string
  target_usd?: number | null
  current_ref?: number | null
  confidence: number
  horizon?: string
  rationale?: string
  signal: string
}

interface GsAgent {
  id: string
  name: string
  domain?: string
  domain_fr?: string
  platform?: string
  role?: string
  status?: string
  on_chain_activity?: boolean
  gsn_url?: string
  last_run?: string
  confidence_avg?: number
  confidence?: number
  accuracy?: number
  bias?: string
  horizon?: string
  forecasts?: Forecast[]
  example_markets?: string[]
}

interface ForecastData {
  version?: string
  updated_at?: string
  updated?: string
  agents?: Record<string, GsAgent>
  aggregated_signals?: {
    primary?: string
    secondary?: string
    regime?: string
    recommended_action?: string
    live_feed?: string
    agents_directory?: string
  }
}

const DOMAIN_ICON: Record<string, string> = {
  weather: '🌤️',
  crypto: '₿',
  macro: '🌍',
  politics: '🏛️',
  sports: '⚽',
  tech: '💻',
  finance: '📊',
  travel: '✈️',
}

function dirColor(d: string) {
  const x = (d || '').toLowerCase()
  if (x.includes('bull') || x.includes('risk_on') || x === 'buy') return 'text-green-400'
  if (x.includes('bear') || x.includes('risk_off') || x === 'sell') return 'text-red-400'
  return 'text-yellow-400'
}

function signalBadge(s: string) {
  const u = (s || '').toUpperCase()
  if (u.includes('BUY') || u.includes('RISK_ON') || u.includes('LONG')) return 'badge-green'
  if (u.includes('SELL') || u.includes('RISK_OFF')) return 'badge-red'
  return 'badge-orange'
}

function normalizeAgent(id: string, raw: GsAgent): GsAgent {
  const forecasts = Array.isArray(raw.forecasts)
    ? raw.forecasts
    : raw.bias || raw.accuracy != null
      ? [
          {
            asset: (raw.domain || 'GSN').toUpperCase(),
            direction: String(raw.bias || 'watch'),
            signal: String(raw.bias || 'MONITOR'),
            confidence: Number(raw.confidence ?? raw.accuracy ?? 0.5),
            horizon: 'seed',
            rationale: raw.accuracy != null ? `accuracy ${(Number(raw.accuracy) * 100).toFixed(0)}%` : '',
          },
        ]
      : []
  return {
    ...raw,
    id: raw.id || id,
    name: raw.name || id,
    forecasts,
  }
}

export default function Agents() {
  const [data, setData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    let lastErr: string | null = null
    for (const url of [LOCAL, RAW_PUBLIC, RAW_DATA]) {
      try {
        const r = await fetch(url + '?t=' + Date.now())
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const json = (await r.json()) as ForecastData
        if (!json || typeof json !== 'object') throw new Error('invalid json')
        setData(json)
        setLoading(false)
        return
      } catch (e) {
        lastErr = e instanceof Error ? e.message : 'Erreur chargement'
      }
    }
    setError(lastErr || 'Erreur chargement')
    setLoading(false)
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 120_000)
    return () => clearInterval(id)
  }, [])

  const agentsList = data?.agents
    ? Object.entries(data.agents).map(([id, a]) => normalizeAgent(id, a || { id, name: id }))
    : []

  return (
    <div className="animate-fade-in pb-20 md:pb-0">
      <PageGuide page="agents" />
      <AgentsJourneyStrip />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black">🧠 Agents</h1>
          <p className="text-sm text-gray-500 mt-1">
            <strong className="text-purple-300">Access packs</strong> ·{' '}
            <strong className="text-amber-300">Voyage</strong> ·{' '}
            <strong className="text-emerald-300">GSN ≥80%</strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/my-packs" className="btn-primary text-sm text-center">
            My Packs →
          </Link>
          <Link to="/trading" className="btn-secondary text-sm text-center">
            Board LIA →
          </Link>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-zinc-700/50 bg-zinc-900/40 px-4 py-3 text-[11px] text-zinc-400 leading-relaxed">
        <strong className="text-zinc-200">4 produits</strong> — packs Pulse/Yield/Sentinel/Voyage · sous-agents
        intent · GreenSmoke (externe) · RWA art. Buy on-chain = SC marketplace seulement.
      </div>

      <div className="mb-6">
        <TreasuryBanner />
      </div>

      <VoyageAgentPanel />

      <section className="mb-10">
        <h2 className="text-lg font-bold mb-1 text-purple-200">① Access packs · catalogue</h2>
        <p className="text-xs text-gray-500 mb-4">
          Prix = intensité de signaux. Fiat → membership NFT. Pas un fonds.
        </p>
        <AgentsDeployStatus />
        <AgentsMarketplacePanel />
        <div className="mt-4">
          <AgentPacksGrid />
        </div>
        <div className="mt-6">
          <PackCheckout />
        </div>
        <div className="mt-6">
          <AgentPackJourney />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold mb-1 text-amber-200">①ter Actifs RWA (market art)</h2>
        <RwaAssetsStrip />
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold mb-1 text-fuchsia-200">①bis Créer un sous-agent (intent)</h2>
        <p className="text-xs text-gray-500 mb-4">
          Prompt → intent Vellum · corridor 5–25 € · <strong>≠ GSN</strong>.
        </p>
        <CreateSubAgentForm />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold mb-1 text-emerald-200">② GreenSmoke — leaderboard & prévisions</h2>
        <p className="text-xs text-gray-500 mb-4">
          LIA n’utilise que les agents <strong>≥ 80% accuracy</strong> (poids max 30%). Pas un pack à
          vendre.
        </p>
        <GsnLeaderboard />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            {(data?.updated_at || data?.updated) && (
              <p className="text-xs text-gray-500">
                MAJ {new Date(data.updated_at || data.updated || '').toLocaleString('fr-FR')}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={load} className="btn-secondary text-sm">
              🔄 Actualiser GSN
            </button>
            <a
              href={data?.aggregated_signals?.agents_directory || 'https://app.greensmoke.network/agents'}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-sm"
            >
              GSN Directory ↗
            </a>
          </div>
        </div>

        {data?.aggregated_signals && (
          <div className="card mb-4 border-emerald-500/25 bg-emerald-500/5">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">
              Signaux agrégés GSN
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
              <div>
                <p className="text-xs text-gray-500">Primary</p>
                <p className="font-bold text-green-400 text-sm">
                  {data.aggregated_signals.primary || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Secondary</p>
                <p className="font-bold text-purple-400 text-sm">
                  {data.aggregated_signals.secondary || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Régime</p>
                <p className="font-bold text-teal-400 text-sm">
                  {data.aggregated_signals.regime || '—'}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-300">
              {data.aggregated_signals.recommended_action || ''}
            </p>
          </div>
        )}

        {loading && !data && (
          <div className="grid gap-4 mb-4">
            {[1, 2].map(i => (
              <div key={i} className="card h-24 animate-pulse" />
            ))}
          </div>
        )}
        {error && <div className="card border-red-500/30 text-red-400 mb-4">GSN feed : {error}</div>}

        <div className="space-y-4">
          {agentsList.map(agent => (
            <div key={agent.id} className="card border-emerald-500/15">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{DOMAIN_ICON[agent.domain || ''] || '📡'}</span>
                  <div>
                    <p className="font-bold text-lg">{agent.name}</p>
                    <p className="text-xs text-gray-500">
                      GSN · {agent.domain_fr || agent.domain || '—'} · {agent.role || 'forecast'}
                    </p>
                  </div>
                </div>
                <span className="badge-gray text-[10px]">externe · pas à vendre</span>
              </div>
              <div className="space-y-2">
                {(Array.isArray(agent.forecasts) ? agent.forecasts : []).map((f, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[#111118] border border-[#2a2a3a] flex flex-col sm:flex-row sm:items-center gap-2"
                  >
                    <div className="min-w-[90px]">
                      <p className="font-semibold text-sm">{f.asset}</p>
                      <p className={`text-xs font-bold ${dirColor(f.direction)}`}>{f.direction}</p>
                    </div>
                    <div className="flex-1 text-xs text-gray-400">{f.rationale || ''}</div>
                    <span className={signalBadge(f.signal)}>{f.signal}</span>
                  </div>
                ))}
                {(!agent.forecasts || agent.forecasts.length === 0) && (
                  <p className="text-xs text-zinc-500">Aucune ligne de forecast pour cet agent.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-gray-600 text-center">
        docs/AGENT_VOYAGE.md · Model C · paper only
      </p>
    </div>
  )
}
