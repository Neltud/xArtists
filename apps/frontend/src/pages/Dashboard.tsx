/**
 * Home — session + mainnet objects (RPC→store→visual) + Phase 4.
 */
import { Link } from 'react-router-dom'
import SoftStatus from '../components/SoftStatus'
import AgentWalletsStrip from '../components/AgentWalletsStrip'
import PulseStrip from '../components/PulseStrip'
import NetworkLiveStrip from '../components/NetworkLiveStrip'
import Phase4ReadinessBanner from '../components/Phase4ReadinessBanner'
import AdSlot from '../components/AdSlot'
import UserActionsPanel from '../components/UserActionsPanel'
import ConnectedSessionPanel from '../components/ConnectedSessionPanel'
import UserDashboardPanel from '../components/UserDashboardPanel'
import ChainObjectCanvas from '../components/ChainObjectCanvas'
import { isSupernovaLive } from '../config/supernova'
import LottieIcon from '../components/LottieIcon'

const LINKS_MAIN = [
  { to: '/staking', title: 'Staking TRO', body: 'Stake live mainnet · xPortal', delay: '0ms' },
  { to: '/my-packs', title: 'My Packs / Salles', body: '1 pack = 1 salle + moniteur LIA', delay: '40ms' },
  { to: '/museum', title: 'Galerie', body: 'Salles 3D · avatar · collection', delay: '60ms' },
  { to: '/agents', title: 'Packs', body: 'Pulse · Yield · Sentinel · min 10 EGLD', delay: '80ms' },
  { to: '/trading', title: 'Trading', body: 'Board paper · desk Grok / LIA', delay: '120ms' },
  { to: '/market', title: 'Market', body: 'NFT marketplace SC live', delay: '140ms' },
  { to: '/lia', title: 'LIA', body: '8008 · tresorerie · pipeline', delay: '180ms' },
  { to: '/slot', title: 'Slot', body: '3x3 · paper puis SC', delay: '200ms' },
  { to: '/go-live', title: 'GO_LIVE', body: 'Phase 4 · checklists', delay: '240ms' },
] as const

export default function Dashboard() {
  const supernova = isSupernovaLive()

  return (
    <div className="animate-fade-in relative pb-8 max-w-2xl mx-auto">
      <div className="orb w-64 h-64 -top-8 -left-16 bg-violet-600/30" aria-hidden />
      <div
        className="orb w-48 h-48 top-32 -right-10 bg-cyan-500/20"
        style={{ animationDelay: '2s' }}
        aria-hidden
      />

      <section className="relative space-y-5 pt-6 sm:pt-10">
        <p className="section-label">
          xArtists{supernova ? ' · Supernova' : ''} · mainnet
        </p>
        <h1 className="display text-[2.75rem] sm:text-6xl text-white leading-[1.05]">
          L'art,
          <br />
          <span className="gradient-text">en mouvement</span>
        </h1>
        <div className="atelier-title-rule" aria-hidden />
        <div className="flex items-center gap-3 pt-1">
          <LottieIcon preset="spark" size={40} />
        </div>
        <p className="section-lead">
          Galerie, packs, LIA — SC mainnet live · signature xPortal · fail-closed CODEHASH.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link to="/staking" className="btn-primary">
            Stake TRO
          </Link>
          <Link to="/my-packs" className="btn-secondary">
            Mes salles
          </Link>
          <Link to="/wallet" className="btn-secondary">
            Wallet
          </Link>
        </div>
      </section>

      <div className="relative mt-6 space-y-3">
        <ConnectedSessionPanel />
        <UserDashboardPanel />
      </div>

      <div className="relative mt-6">
        <ChainObjectCanvas />
      </div>

      <div className="relative mt-6">
        <Phase4ReadinessBanner variant="full" />
      </div>

      <div className="relative mt-6">
        <AdSlot id="home_hero" className="mb-2" />
      </div>

      <div className="relative mt-6 space-y-3">
        <SoftStatus />
        <NetworkLiveStrip />
        <PulseStrip />
        <AgentWalletsStrip />

        <p className="section-label pt-4">Explorer</p>
        <div className="grid gap-2.5">
          {LINKS_MAIN.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className="flow-row card-play card-interactive"
              style={{ animation: `fadeIn 0.55s var(--ease-out) ${item.delay} both` }}
            >
              <div>
                <p className="text-[15px] font-semibold text-white tracking-tight">{item.title}</p>
                <p className="text-[13px] text-zinc-500 mt-0.5">{item.body}</p>
              </div>
              <span className="text-zinc-600 text-lg" aria-hidden>
                →
              </span>
            </Link>
          ))}
        </div>

        <p className="section-label pt-6">Parcours actions</p>
        <UserActionsPanel compact />
      </div>
    </div>
  )
}
