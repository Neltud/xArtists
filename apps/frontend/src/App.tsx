import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import SignalTicker from './components/SignalTicker'
import FirstVisitOnboarding from './components/FirstVisitOnboarding'
import ErrorBoundary from './components/ErrorBoundary'
import PageLoader from './components/PageLoader'
import PwaInstallBanner from './components/PwaInstallBanner'
import PrivateReleaseStrip from './components/PrivateReleaseStrip'
import DemoModeBanner from './components/DemoModeBanner'
import IntentBar from './components/IntentBar'
import LiaMonitor from './components/LiaMonitor'
import GuardianStatusBar from './components/shared/GuardianStatusBar'
import RoutePrefetch from './components/RoutePrefetch'
import { useMultiversX } from './hooks/useMultiversX'
import { LINKS } from './config/links'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Marketplace = lazy(() => import('./pages/Marketplace'))
const Trading = lazy(() => import('./pages/Trading'))
const Portfolio = lazy(() => import('./pages/Portfolio'))
const DAO = lazy(() => import('./pages/DAO'))
const Tip = lazy(() => import('./pages/Tip'))
const Wallet = lazy(() => import('./pages/Wallet'))
const Gallery = lazy(() => import('./pages/Gallery'))
const MuseumPage = lazy(() => import('./pages/MuseumPage'))
const HatomPage = lazy(() => import('./pages/HatomPage'))
const LPPoolsPage = lazy(() => import('./pages/LPPoolsPage'))
const Agents = lazy(() => import('./pages/Agents'))
const MyPacks = lazy(() => import('./pages/MyPacks'))
const TroPage = lazy(() => import('./pages/TroPage'))
const StakingPage = lazy(() => import('./pages/StakingPage'))
const SoulTestnetPage = lazy(() => import('./pages/SoulTestnetPage'))
const AgentsPolyliaPage = lazy(() => import('./pages/AgentsPolyliaPage'))
const ArtToursPage = lazy(() => import('./pages/ArtToursPage'))
const LightningAgentPage = lazy(() => import('./pages/LightningAgentPage'))
const BurnifyPage = lazy(() => import('./pages/BurnifyPage'))
const ArtistStudio = lazy(() => import('./pages/ArtistStudio'))
const AdsPage = lazy(() => import('./pages/AdsPage'))
const Editions = lazy(() => import('./pages/Editions'))
const SimulationLab = lazy(() => import('./pages/SimulationLab'))
const EntityMap = lazy(() => import('./pages/EntityMap'))
const SiteMapPage = lazy(() => import('./pages/SiteMapPage'))
const TxShell = lazy(() => import('./providers/TxShell'))

const TX_PATHS = new Set([
  '/marketplace',
  '/studio',
  '/agents',
  '/agents/polylia',
  '/my-packs',
  '/tip',
  '/wallet',
  '/staking',
  '/tro',
  '/burnify',
])

function StaleDataBanner({
  isStale,
  lastUpdate,
}: {
  isStale: boolean
  lastUpdate: Date | null
}) {
  if (!isStale) return null
  return (
    <div
      className="bg-amber-500/10 border-b border-amber-500/25 px-4 py-2 text-center text-xs text-amber-100"
      role="status"
    >
      Données potentiellement périmées —{' '}
      {lastUpdate ? lastUpdate.toLocaleTimeString('fr-FR') : 'inconnue'}.{' '}
      <button type="button" className="underline" onClick={() => window.location.reload()}>
        Actualiser
      </button>
    </div>
  )
}

function TxGate({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const needsTx = TX_PATHS.has(pathname)
  if (!needsTx) return <>{children}</>
  return (
    <Suspense fallback={<>{children}</>}>
      <TxShell>{children}</TxShell>
    </Suspense>
  )
}

export default function App() {
  const { isStale, lastUpdate } = useMultiversX()

  return (
    <div className="app-shell pb-20 md:pb-8">
      <DemoModeBanner />
      <PrivateReleaseStrip />
      <GuardianStatusBar />
      <Header />
      <StaleDataBanner isStale={isStale} lastUpdate={lastUpdate} />
      <main className="flex-1 page-wrap py-5 sm:py-8">
        <ErrorBoundary>
          <TxGate>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/entity" element={<EntityMap />} />
                <Route path="/org" element={<EntityMap />} />
                <Route path="/sitemap" element={<SiteMapPage />} />
                <Route path="/sim" element={<SimulationLab />} />
                <Route path="/simulation" element={<SimulationLab />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/trading" element={<Trading />} />
                <Route path="/studio" element={<ArtistStudio />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/my-packs" element={<MyPacks />} />
                <Route path="/agents/polylia" element={<AgentsPolyliaPage />} />
                <Route path="/tours" element={<ArtToursPage />} />
                <Route path="/agents/voyage" element={<Navigate to="/tours" replace />} />
                <Route path="/agents/lightning" element={<LightningAgentPage />} />
                <Route path="/tro" element={<TroPage />} />
                <Route path="/staking" element={<StakingPage />} />
                <Route path="/burnify" element={<BurnifyPage />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/dao" element={<DAO />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/museum" element={<MuseumPage />} />
                <Route path="/musee" element={<MuseumPage />} />
                <Route path="/tip" element={<Tip />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/hatom" element={<HatomPage />} />
                <Route path="/lp" element={<LPPoolsPage />} />
                <Route path="/soul-testnet" element={<SoulTestnetPage />} />
                <Route path="/ads" element={<AdsPage />} />
                <Route path="/editions" element={<Editions />} />
                <Route
                  path="*"
                  element={
                    <div className="text-center py-24 space-y-3">
                      <h2 className="display text-2xl">Page introuvable</h2>
                      <a href="/xArtists/#/" className="text-cyan-400 text-sm hover:underline">
                        Retour accueil →
                      </a>
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          </TxGate>
        </ErrorBoundary>
      </main>
      <footer className="border-t border-white/[0.06] mt-auto py-8 hidden md:block">
        <div className="page-wrap flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="display text-sm text-white">xArtists</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">Aurora · paper-first · MultiversX</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-zinc-500">
            <a href="/xArtists/#/sitemap" className="hover:text-cyan-300 transition-colors">
              Plan
            </a>
            <a href="/xArtists/#/entity" className="hover:text-cyan-300 transition-colors">
              Entité
            </a>
            <a href="/xArtists/#/museum" className="hover:text-cyan-300 transition-colors">
              Musée
            </a>
            <a href="/xArtists/#/tours" className="hover:text-cyan-300 transition-colors">
              Tours
            </a>
            <a href="/xArtists/#/agents" className="hover:text-cyan-300 transition-colors">
              Packs
            </a>
            <a
              href={LINKS.github}
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-300 transition-colors"
            >
              GitHub
            </a>
            <a
              href={LINKS.explorer}
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-300 transition-colors"
            >
              Explorer
            </a>
          </div>
        </div>
      </footer>
      <PwaInstallBanner />
      <FirstVisitOnboarding />
      <IntentBar />
      <LiaMonitor />
      <SignalTicker />
      <BottomNav />
      <RoutePrefetch />
    </div>
  )
}
