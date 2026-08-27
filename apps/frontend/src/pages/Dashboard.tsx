/**
 * Home — hub dApp, parcours utilisateur prioritaire.
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useMultiversX } from '../hooks/useMultiversX'
import { useWallet } from '../context/WalletContext'
import GSNBanner from '../components/GSNBanner'
import AdSlot from '../components/AdSlot'
import CommanderStrip from '../components/commander/CommanderStrip'
import ScStatusBanner from '../components/ScStatusBanner'
import DataHealthStrip from '../components/DataHealthStrip'
import LiaPathStrip from '../components/LiaPathStrip'
import PaperSoulScore from '../components/PaperSoulScore'
import PageGuide from '../components/PageGuide'
import PersonaWelcome, {
  PersonaQuickLinks,
  getStoredPersona,
  type Persona,
} from '../components/PersonaWelcome'
import DualMarketplaceStrip from '../components/DualMarketplaceStrip'
import UserJourneyStrip from '../components/UserJourneyStrip'
import VoyageAgentPanel from '../components/VoyageAgentPanel'
import HomeQuickActions from '../components/HomeQuickActions'
import ExplainCards from './ExplainCards'
import LandingHero from './LandingHero'
import { requestOpenConnect } from '../lib/walletEvents'

export default function Dashboard() {
  const { liaStatus, isStale } = useMultiversX()
  const { connected, shortAddress, method } = useWallet()
  const [persona, setPersona] = useState<Persona | null>(null)

  useEffect(() => {
    setPersona(getStoredPersona())
    const onStorage = () => setPersona(getStoredPersona())
    window.addEventListener('storage', onStorage)
    const id = window.setInterval(() => setPersona(getStoredPersona()), 2000)
    return () => {
      window.removeEventListener('storage', onStorage)
      clearInterval(id)
    }
  }, [])

  const mode = (liaStatus as { mode?: string } | null)?.mode
  const live = (liaStatus as { live_trading?: boolean } | null)?.live_trading

  return (
    <div className="animate-fade-in space-y-6 pb-8">
      <PageGuide page="dashboard" />

      <LandingHero connected={connected} onConnect={requestOpenConnect} />

      <HomeQuickActions />

      <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-cyan-100">Intention · Soul · Monitor</p>
          <p className="text-[11px] text-zinc-500">
            ⌘K / Ctrl+K · score paper · flux LIA (bas droite) · buy EGLD → on-ramp
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/sim" className="btn-secondary text-xs py-2 px-3">
            Sim Lab
          </Link>
          <Link to="/agents/voyage" className="btn-secondary text-xs py-2 px-3">
            Voyage
          </Link>
          <Link to="/trading" className="btn-primary text-xs py-2 px-3">
            Trading →
          </Link>
        </div>
      </div>

      <PaperSoulScore />

      <UserJourneyStrip />

      <PersonaWelcome />
      <PersonaQuickLinks persona={persona} />

      <DualMarketplaceStrip />

      <VoyageAgentPanel compact />

      <ScStatusBanner />

      <DataHealthStrip />

      <LiaPathStrip />

      <CommanderStrip />

      <section className="grid sm:grid-cols-3 gap-3">
        <div className="card border-l-2 border-l-purple-500/50">
          <p className="text-xs text-zinc-500 mb-1">Mode LIA</p>
          <p className="font-bold text-white">{mode || 'paper'}</p>
          <p className="text-[11px] text-zinc-500 mt-1">
            Live trading: {live ? 'ON' : 'OFF'} · stale: {isStale ? 'yes' : 'no'}
          </p>
        </div>
        <div className="card border-l-2 border-l-teal-500/50">
          <p className="text-xs text-zinc-500 mb-1">Wallet</p>
          <p className="font-bold text-white">{connected ? shortAddress : 'Non connecté'}</p>
          <p className="text-[11px] text-zinc-500 mt-1">{method || '—'}</p>
        </div>
        <div className="card border-l-2 border-l-amber-500/50">
          <p className="text-xs text-zinc-500 mb-1">Raccourcis</p>
          <div className="flex flex-wrap gap-2 mt-1">
            <Link to="/agents" className="text-xs text-purple-300 underline">
              Packs
            </Link>
            <Link to="/marketplace" className="text-xs text-purple-300 underline">
              Market
            </Link>
            <Link to="/entity" className="text-xs text-purple-300 underline">
              Entité
            </Link>
          </div>
        </div>
      </section>

      <GSNBanner />

      <ExplainCards />

      <AdSlot />
    </div>
  )
}
