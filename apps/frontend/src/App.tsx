import { lazy, Suspense, useEffect, useState } from 'react'
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
import ArtAtelierBackdrop from './components/ArtAtelierBackdrop'
import { useMultiversX } from './hooks/useMultiversX'
import AssetDrawer from './components/ui/AssetDrawer'
import { OPEN_ASSETS_EVENT } from './lib/walletEvents'
import { LINKS } from './config/links'
import { DEMO_MODE } from './config/demoMode'
import PageTransition from './components/PageTransition'
import SoundDock from './components/SoundDock'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Marketplace = lazy(() => import('./pages/Marketplace'))
const MarketPage = lazy(() => import('./pages/MarketPage'))
const Trading = lazy(() => import('./pages/Trading'))
const Portfolio = lazy(() => import('./pages/Portfolio'))
const DAO = lazy(() => import('./pages/DAO'))
const Tip = lazy(() => import('./pages/Tip'))
const Wallet = lazy(() => import('./pages/Wallet'))
const MuseumPage = lazy(() => import('./pages/MuseumPage'))
const MuseumLabPage = lazy(() => import('./pages/MuseumLabPage'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
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
const SalePage = lazy(() => import('./pages/SalePage'))
const AdsPage = lazy(() => import('./pages/AdsPage'))
const Editions = lazy(() => import('./pages/Editions'))
const SimulationLab = lazy(() => import('./pages/SimulationLab'))
const EntityMap = lazy(() => import('./pages/EntityMap'))
const SiteMapPage = lazy(() => import('./pages/SiteMapPage'))
const TxShell = lazy(() => import('./providers/TxShell'))
const DemoTourPage = lazy(() => import('./pages/DemoTourPage'))
const GoLivePage = lazy(() => import('./pages/GoLivePage'))
const VenueAccountPage = lazy(() => import('./pages/VenueAccountPage'))
const SlotPage = lazy(() => import('./pages/SlotPage'))

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
  '/sale',
])

function StaleDataBanner({ isStale, lastUpdate }: { isStale: boolean; lastUpdate: Date | null }) {
  if (!isStale) return null
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 text-center text-[11px] text-amber-200/90">
      Données réseau partiellement hors-ligne
      {lastUpdate ? ` · dernier OK ${lastUpdate.toLocaleTimeString()}` : ''}
    </div>
  )
}

export default function App() {
  const { isStale, lastUpdate } = useMultiversX()
  const { pathname } = useLocation()
  const needsTx = TX_PATHS.has(pathname)
  const [assetsOpen, setAssetsOpen] = useState(false)

  useEffect(() => {
    const onOpen = () => setAssetsOpen(true)
    window.addEventListener(OPEN_ASSETS_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_ASSETS_EVENT, onOpen)
  }, [])

  return (
    <ErrorBoundary>
      <ArtAtelierBackdrop />
      <div className="relative min-h-screen flex flex-col">
        <Header />
        <StaleDataBanner isStale={isStale} lastUpdate={lastUpdate} />
        {DEMO_MODE && <DemoModeBanner />}
        <PrivateReleaseStrip />
        <SignalTicker />
        <GuardianStatusBar />
        <main className="flex-1 px-3 sm:px-4 pt-2 pb-24 md:pb-8 max-w-5xl mx-auto w-full">
          <Suspense fallback={<PageLoader />}>
            <PageTransition>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/entity" element={<EntityMap />} />
                <Route path="/org" element={<EntityMap />} />
                <Route path="/sitemap" element={<SiteMapPage />} />
                <Route path="/sim" element={<SimulationLab />} />
                <Route path="/simulation" element={<SimulationLab />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/market" element={<MarketPage />} />
                <Route path="/analyse" element={<Navigate to="/market" replace />} />
                <Route path="/trading" element={<Trading />} />
                <Route path="/studio" element={<ArtistStudio />} />
                <Route path="/sale" element={<SalePage />} />
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
                <Route path="/gallery" element={<Navigate to="/museum" replace />} />
                <Route path="/museum" element={<MuseumPage />} />
                <Route path="/museum/lab" element={<MuseumLabPage />} />
                <Route path="/musee" element={<Navigate to="/museum" replace />} />
                <Route path="/collection" element={<Navigate to="/museum?tab=mine" replace />} />
                <Route path="/legal" element={<LegalPage />} />
                <Route path="/mentions-legales" element={<LegalPage />} />
                <Route path="/tip" element={<Tip />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/hatom" element={<HatomPage />} />
                <Route path="/lp" element={<LPPoolsPage />} />
                <Route path="/ads" element={<AdsPage />} />
                <Route path="/editions" element={<Editions />} />
                <Route path="/slot" element={<SlotPage />} />
                <Route path="/demo" element={<DemoTourPage />} />
                <Route path="/go-live" element={<GoLivePage />} />
                <Route path="/venues" element={<VenueAccountPage />} />
                <Route path="/accounts" element={<VenueAccountPage />} />
                <Route path="/soul" element={<SoulTestnetPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </PageTransition>
          </Suspense>
        </main>
        <BottomNav />
        <IntentBar />
        <LiaMonitor />
        <PwaInstallBanner />
        <FirstVisitOnboarding />
        <RoutePrefetch />
        <SoundDock />
        {needsTx && (
          <Suspense fallback={null}>
            <TxShell />
          </Suspense>
        )}
        <AssetDrawer open={assetsOpen} onClose={() => setAssetsOpen(false)} />
        <footer className="hidden md:block text-center text-[10px] text-zinc-600 py-4">
          <a href={LINKS.github} className="hover:text-zinc-400" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </footer>
      </div>
    </ErrorBoundary>
  )
}
