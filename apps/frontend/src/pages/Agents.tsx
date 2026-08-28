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
import StripeCardBanner from '../components/StripeCardBanner'
import AgentsScopeBanner from '../components/AgentsScopeBanner'
import NftPacksGallery from '../components/NftPacksGallery'

const LOCAL = `${import.meta.env.BASE_URL}data/greensmoke_forecasts.json`
const RAW_PUBLIC =
  'https://raw.githubusercontent.com/Neltud/xArtists/main/apps/frontend/public/data/greensmoke_forecasts.json'
const RAW_DATA =
  'https://raw.githubusercontent.com/Neltud/xArtists/main/data/greensmoke_forecasts.json'

interface GsAgent {
  id: string
  name: string
  domain?: string
  confidence?: number
  accuracy?: number
  forecasts?: unknown[]
}

export default function Agents() {
  const [agents, setAgents] = useState<GsAgent[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      for (const url of [LOCAL, RAW_PUBLIC, RAW_DATA]) {
        try {
          const r = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' })
          if (!r.ok) continue
          const j = await r.json()
          const list = Array.isArray(j.agents) ? j.agents : Array.isArray(j) ? j : []
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
          <h1 className="text-3xl font-black">Packs Agents NFT</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Pulse · Yield · Sentinel — NFT d’accès · pas de travel agent
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/my-packs" className="btn-primary text-xs py-2 px-3">
            My Packs
          </Link>
          <Link to="/tours" className="btn-secondary text-xs py-2 px-3">
            Tours art (autre service)
          </Link>
        </div>
      </header>

      <AgentsScopeBanner />
      <NftPacksGallery />
      <AgentsJourneyStrip />
      <StripeCardBanner />
      <AgentPackJourney />
      <AgentPacksGrid />
      <PackCheckout />
      <AgentsDeployStatus />
      <AgentsMarketplacePanel />
      <TreasuryBanner />
      <RwaAssetsStrip />
      <CreateSubAgentForm />

      <section className="card">
        <h2 className="text-lg font-bold mb-2">GSN · prédiction</h2>
        <p className="text-xs text-zinc-500 mb-3">Indépendant des packs NFT Pulse/Yield/Sentinel.</p>
        {err && <p className="text-xs text-amber-400 mb-2">{err}</p>}
        <GsnLeaderboard agents={agents} />
      </section>
    </div>
  )
}
