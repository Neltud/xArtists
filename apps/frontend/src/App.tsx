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
      className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-xs text-amber-100"
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
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-white pb-20 md:pb-10">
      <DemoModeBanner />
      <PrivateReleaseStrip />
      <GuardianStatusBar />
      <Header />
      <StaleDataBanner isStale={isStale} lastUpdate={lastUpdate} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4">
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
                    <div className="text-center py-20">
                      <h2 className="text-2xl font-bold mb-2">Page introuvable</h2>
                      <a href="/xArtists/#/" className="text-purple-400 text-sm">
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
      <footer className="border-t border-[#2a2a3a] mt-8 py-6 hidden md:block mb-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold">xArtists — LIA v6</p>
            <p className="text-xs text-gray-500">Hash routes · paper + live reads</p>
          </div>
          <div className="flex gap-4 text-sm text-gray-500">
            <a href="/xArtists/#/sitemap" className="hover:text-white">
              Plan
            </a>
            <a href="/xArtists/#/entity" className="hover:text-white">
              Entité
            </a>
            <a href="/xArtists/#/tours" className="hover:text-white">
              Tours
            </a>
            <a href="/xArtists/#/agents" className="hover:text-white">
              Packs
            </a>
            <a href={LINKS.github} target="_blank" rel="noreferrer" className="hover:text-white">
              GitHub
            </a>
            <a href={LINKS.explorer} target="_blank" rel="noreferrer" className="hover:text-white">
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
