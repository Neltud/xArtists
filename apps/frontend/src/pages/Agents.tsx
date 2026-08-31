/**
 * Packs Agents — Pulse · Yield · Sentinel only (one product line).
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AgentsMarketplacePanel from '../components/AgentsMarketplacePanel'
import AgentsDeployStatus from '../components/AgentsDeployStatus'
import CreateSubAgentForm from '../components/CreateSubAgentForm'
import GsnLeaderboard from '../components/GsnLeaderboard'
import AgentPacksGrid from '../components/AgentPacksGrid'
import PackCheckout from '../components/PackCheckout'
import PageGuide from '../components/PageGuide'
import InfoTip from '../components/InfoTip'

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
    <div className="animate-fade-in space-y-5 pb-10 max-w-4xl">
      <PageGuide page="agents" />

      <header className="space-y-1">
        <p className="section-label text-emerald-400/80">Agents</p>
        <h1 className="page-title">Packs</h1>
        <p className="page-sub inline-flex flex-wrap items-center gap-1">
          3 packs — Pulse · Yield · Sentinel
          <InfoTip>
            <strong className="text-white block mb-1">Un seul produit</strong>
            <span className="text-zinc-400">
              Chaque pack = accès agent IA, livré comme NFT d’entitlement (pas deux catalogues « IA »
              et « NFT »). Tours art = culture, hors packs. Mint SC tant que codeHash null.
            </span>
          </InfoTip>
          <InfoTip k="scStatus" />
        </p>
      </header>

      <AgentPacksGrid />
      <PackCheckout />

      <AgentsDeployStatus />
      <AgentsMarketplacePanel />

      <details className="rounded-xl border border-white/10 bg-white/[0.02]">
        <summary className="cursor-pointer px-4 py-3 text-xs text-zinc-400 hover:text-zinc-200">
          Signaux GSN · détail
          {err && <span className="ml-2 text-amber-400/80">({err})</span>}
        </summary>
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          <GsnLeaderboard agents={agents} />
          <CreateSubAgentForm />
        </div>
      </details>

      <p className="text-[11px] text-zinc-600">
        <Link to="/my-packs" className="text-violet-300/90 hover:underline">
          My Packs
        </Link>
        {' · '}
        <Link to="/tours" className="text-violet-300/90 hover:underline">
          Art Tours (culture)
        </Link>
      </p>
    </div>
  )
}
