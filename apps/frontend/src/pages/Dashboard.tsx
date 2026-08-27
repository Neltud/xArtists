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

      <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-cyan-100">Intention · Soul · Monitor</p>
          <p className="text-[11px] text-zinc-500">
            ⌘K / Ctrl+K · score paper · flux LIA (bas droite)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/sim" className="btn-secondary text-xs py-2 px-3">
            Sim Lab
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

      <VoyageAgentPanel />

      <ScStatusBanner />

      <DataHealthStrip />

      <LiaPathStrip />

      <CommanderStrip />

      <section className="grid sm:grid-cols-3 gap-3">
        <div className="card border-l-2 border-l-purple-500/50">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Session user</p>
          <p className="text-sm font-semibold mt-1">
            {connected ? (
              <>
                {shortAddress}{' '}
                <span className="text-[10px] text-zinc-500">
                  {method === 'paste_readonly' ? 'read-only' : method || 'connected'}
                </span>
              </>
            ) : (
              <span className="text-zinc-500">Non connecté</span>
            )}
          </p>
          <Link to="/wallet" className="text-xs text-purple-400 mt-2 inline-block hover:underline">
            Mon wallet →
          </Link>
        </div>
        <div className="card border-l-2 border-l-teal-500/50">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">LIA board</p>
          <p className="text-sm font-semibold mt-1">
            {mode || '—'} · {live ? 'LIVE' : 'PAPER'}
            {isStale ? ' · stale' : ''}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Link to="/trading" className="text-xs text-teal-300 hover:underline">
              Trading →
            </Link>
            <Link to="/sim" className="text-xs text-cyan-300 hover:underline">
              Sim →
            </Link>
          </div>
        </div>
        <div className="card border-l-2 border-l-amber-500/50">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Access packs</p>
          <p className="text-sm font-semibold mt-1">Model C · paper · Voyage</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Link to="/agents" className="text-xs text-amber-200/90 hover:underline">
              Catalog →
            </Link>
            <Link to="/my-packs" className="text-xs text-purple-400 hover:underline">
              My Packs →
            </Link>
          </div>
        </div>
      </section>

      <GSNBanner />

      <AdSlot id="home_hero" />

      <ExplainCards />

      <p className="text-center text-[11px] text-zinc-600">
        Matrice Sovereign →{' '}
        <a
          className="text-cyan-500/80 hover:underline"
          href="https://github.com/Neltud/xArtists/blob/main/docs/SOVEREIGN_INTEGRATION_MATRIX.md"
          target="_blank"
          rel="noreferrer"
        >
          docs/SOVEREIGN_INTEGRATION_MATRIX.md
        </a>
      </p>
    </div>
  )
}
