/**
 * Home — hub parcours utilisateur clarifié.
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
import PaperSoulScore from '../components/PaperSoulScore'
import PageGuide from '../components/PageGuide'
import PersonaWelcome, {
  PersonaQuickLinks,
  getStoredPersona,
  type Persona,
} from '../components/PersonaWelcome'
import DualMarketplaceStrip from '../components/DualMarketplaceStrip'
import UserJourneyStrip from '../components/UserJourneyStrip'
import UserPathHub from '../components/UserPathHub'
import HomeQuickActions from '../components/HomeQuickActions'
import ExplainCards from './ExplainCards'
import LandingHero from './LandingHero'
import { requestOpenConnect } from '../lib/walletEvents'

export default function Dashboard() {
  const { liaStatus } = useMultiversX()
  const { connected } = useWallet()
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

  const live = (liaStatus as { live_trading?: boolean } | null)?.live_trading

  return (
    <div className="animate-fade-in space-y-6 pb-8">
      <PageGuide page="dashboard" />

      <LandingHero connected={connected} onConnect={requestOpenConnect} />

      <UserJourneyStrip />

      <UserPathHub />

      <HomeQuickActions />

      <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-cyan-100">Parler à LIA</p>
          <p className="text-[11px] text-zinc-500">
            ⌘K / Ctrl+K — intention · Guardian · on-ramp (buy EGLD)
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <Link to="/entity" className="btn-secondary py-1.5 px-3">
            Entité
          </Link>
          <Link to="/sim" className="btn-secondary py-1.5 px-3">
            Sim Lab
          </Link>
        </div>
      </div>

      <ScStatusBanner />
      <DataHealthStrip />

      {!persona && <PersonaWelcome />}
      {persona && <PersonaQuickLinks persona={persona} />}

      <div className="grid md:grid-cols-2 gap-4">
        <PaperSoulScore />
        <div className="card text-xs text-zinc-500 space-y-2">
          <p className="font-semibold text-zinc-300">À retenir</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <strong className="text-zinc-300">Packs</strong> = Pulse / Yield / Sentinel — pas un fonds.
            </li>
            <li>
              <strong className="text-zinc-300">Tours</strong> = service culturel (expos), pas un pack IA.
            </li>
            <li>
              <strong className="text-zinc-300">Trading</strong> = board LIA paper
              {live ? ' · ⚠ flag live' : ' · live OFF'}.
            </li>
            <li>Cartes packs = Stripe · EGLD = MoonPay (Apple / Google Pay).</li>
          </ul>
        </div>
      </div>

      <DualMarketplaceStrip />
      <CommanderStrip />
      <GSNBanner />
      <ExplainCards />
      <AdSlot />
    </div>
  )
}
