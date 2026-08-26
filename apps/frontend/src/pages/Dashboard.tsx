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
import PageGuide from '../components/PageGuide'
import PersonaWelcome, {
  PersonaQuickLinks,
  getStoredPersona,
  type Persona,
} from '../components/PersonaWelcome'
import DualMarketplaceStrip from '../components/DualMarketplaceStrip'
import UserJourneyStrip from '../components/UserJourneyStrip'
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

      <UserJourneyStrip />

      <PersonaWelcome />
      <PersonaQuickLinks persona={persona} />

      <DualMarketplaceStrip />

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
            <Link to="/portfolio" className="text-xs text-purple-400 hover:underline">
              Portfolio →
            </Link>
          </div>
        </div>
        <div className="card border-l-2 border-l-amber-500/50">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Access packs</p>
          <p className="text-sm font-semibold mt-1">Model C · paper</p>
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
        $TRO supply max 500 000 · MultiversX · wallet user ≠ LIA ops · SignalTicker en bas
      </p>
    </div>
  )
}
