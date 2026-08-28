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
import LightningAgentPanel from '../components/LightningAgentPanel'

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

export default function Agents() {
  const [agents, setAgents] = useState<GsAgent[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const urls = [LOCAL, RAW_PUBLIC, RAW_DATA]
      for (const url of urls) {
        try {
          const r = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' })
          if (!r.ok) continue
          const j = await r.json()
          const list = Array.isArray(j.agents)
            ? j.agents
            : Array.isArray(j)
              ? j
              : []
          if (!cancelled) {
            setAgents(list)
            setErr(null)
          }
          return
        } catch {
          /* next */
        }
      }
      if (!cancelled) setErr('GSN forecasts offline')
    }
    load()
    const id = window.setInterval(load, 60_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <PageGuide page="agents" />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Agents</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Packs MVX · Voyage · Lightning MCP · signaux GSN
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/agents/voyage" className="btn-secondary text-xs py-2 px-3">
            Voyage
          </Link>
          <Link to="/agents/lightning" className="btn-secondary text-xs py-2 px-3">
            Lightning
          </Link>
          <Link to="/my-packs" className="btn-primary text-xs py-2 px-3">
            My Packs
          </Link>
        </div>
      </header>

      <LightningAgentPanel compact />
      <VoyageAgentPanel compact />

      <AgentsJourneyStrip />
      <AgentPackJourney />
      <AgentPacksGrid />
      <PackCheckout />

      <AgentsDeployStatus />
      <AgentsMarketplacePanel />
      <TreasuryBanner />
      <RwaAssetsStrip />
      <CreateSubAgentForm />

      <GsnLeaderboard agents={agents} />
      {err && <p className="text-xs text-amber-400">{err}</p>}

      <section className="card text-xs text-zinc-500">
        <p>
          GSN = signaux externes pour LIA (seuil ≥80 % en fusion). Les packs xArtists sont des access
          NFT séparés — pas un produit GreenSmoke revendu.
        </p>
      </section>
    </div>
  )
}
