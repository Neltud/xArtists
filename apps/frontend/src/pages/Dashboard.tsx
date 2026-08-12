/**
 * Home — hub dApp (not LIA ops portfolio).
 * Restored after broken Dashboard.legacy-shim re-export.
 */
import { Link } from 'react-router-dom'
import { useMultiversX } from '../hooks/useMultiversX'
import { useWallet } from '../context/WalletContext'
import GSNBanner from '../components/GSNBanner'
import AdSlot from '../components/AdSlot'
import CommanderStrip from '../components/commander/CommanderStrip'
import ScStatusBanner from '../components/ScStatusBanner'
import DataHealthStrip from '../components/DataHealthStrip'
import PageGuide from '../components/PageGuide'
import PersonaWelcome, { PersonaQuickLinks } from '../components/PersonaWelcome'
import DualMarketplaceStrip from '../components/DualMarketplaceStrip'
import ExplainCards from './ExplainCards'
import LandingHero from './LandingHero'

export default function Dashboard() {
  const { liaStatus, isStale } = useMultiversX()
  const { connected, shortAddress, method } = useWallet()

  const mode = (liaStatus as { mode?: string } | null)?.mode
  const live = (liaStatus as { live_trading?: boolean } | null)?.live_trading

  return (
    <div className="animate-fade-in space-y-6 pb-8">
      <PageGuide page="home" />

      <LandingHero />

      <PersonaWelcome />
      <PersonaQuickLinks />

      <DualMarketplaceStrip />

      <ScStatusBanner />

      <DataHealthStrip />

      <CommanderStrip />

      <section className="grid sm:grid-cols-3 gap-3">
        <div className="card">
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
          <Link to="/wallet" className="text-xs text-purple-400 mt-2 inline-block">
            Mon wallet →
          </Link>
        </div>
        <div className="card">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">LIA board</p>
          <p className="text-sm font-semibold mt-1">
            {mode || '—'} · {live ? 'LIVE' : 'PAPER'}
            {isStale ? ' · stale' : ''}
          </p>
          <Link to="/portfolio" className="text-xs text-purple-400 mt-2 inline-block">
            Portfolio protocole →
          </Link>
        </div>
        <div className="card">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Access packs</p>
          <p className="text-sm font-semibold mt-1">Model C · paper</p>
          <Link to="/my-packs" className="text-xs text-purple-400 mt-2 inline-block">
            My Packs →
          </Link>
        </div>
      </section>

      <GSNBanner />

      <AdSlot slotId="home_hero" />

      <ExplainCards />

      <p className="text-center text-[11px] text-zinc-600">
        $TRO supply max 500 000 · MultiversX · wallet user ≠ LIA ops
      </p>
    </div>
  )
}
