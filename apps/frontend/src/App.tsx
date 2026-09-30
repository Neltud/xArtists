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
import BrainMoodStrip from './components/BrainMoodStrip'
import { useMultiversX } from './hooks/useMultiversX'
import AssetDrawer from './components/ui/AssetDrawer'
import { OPEN_ASSETS_EVENT } from './lib/walletEvents'
import { LINKS } from './config/links'
import PageTransition from './components/PageTransition'
import BackgroundMusicPlayer from './components/BackgroundMusicPlayer'
import ZoneRouteSync from './components/ZoneRouteSync'
import TransactionOverlay from './components/TransactionOverlay'
import TransactionMonitor from './components/TransactionMonitor'
import SystemMaintenanceBanner from './components/SystemMaintenanceBanner'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const MuseumPage = lazy(() => import('./pages/MuseumPage'))
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'))
const StakingPage = lazy(() => import('./pages/StakingPage'))
const SlotPage = lazy(() => import('./pages/SlotPage'))
const AgentsPage = lazy(() => import('./pages/AgentsPage'))
const StudioPage = lazy(() => import('./pages/StudioPage'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
const GoLivePage = lazy(() => import('./pages/GoLivePage'))
const CommandCenterPage = lazy(() => import('./pages/CommandCenterPage'))
const MyPacksPage = lazy(() => import('./pages/MyPacksPage'))
const LiaPage = lazy(() => import('./pages/LiaPage'))
const TroPage = lazy(() => import('./pages/TroPage'))
const IdentityPage = lazy(() => import('./pages/IdentityPage'))
const TradingPage = lazy(() => import('./pages/TradingPage'))
const VenuePage = lazy(() => import('./pages/VenuePage'))
const DaoPage = lazy(() => import('./pages/DaoPage'))

export default function App() {
  useMultiversX()
  const location = useLocation()
  const [assetsOpen, setAssetsOpen] = useState(false)

  useEffect(() => {
    const open = () => setAssetsOpen(true)
    window.addEventListener(OPEN_ASSETS_EVENT, open)
    return () => window.removeEventListener(OPEN_ASSETS_EVENT, open)
  }, [])

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col relative">
        <ArtAtelierBackdrop />
        <PrivateReleaseStrip />
        <DemoModeBanner />
        <SystemMaintenanceBanner />
        <TransactionMonitor />
        <Header />
        <BrainMoodStrip />
        <SignalTicker />
        <GuardianStatusBar />
        <ZoneRouteSync />
        <main className="flex-1 px-3 sm:px-4 py-4 pb-28 md:pb-8 max-w-6xl w-full mx-auto">
          <Suspense fallback={<PageLoader />}>
            <PageTransition key={location.pathname}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/museum" element={<MuseumPage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/staking" element={<StakingPage />} />
                <Route path="/slot" element={<SlotPage />} />
                <Route path="/agents" element={<AgentsPage />} />
                <Route path="/studio" element={<StudioPage />} />
                <Route path="/command-center" element={<CommandCenterPage />} />
                <Route path="/my-packs" element={<MyPacksPage />} />
                <Route path="/lia" element={<LiaPage />} />
                <Route path="/tro" element={<TroPage />} />
                <Route path="/identity" element={<IdentityPage />} />
                <Route path="/trading" element={<TradingPage />} />
                <Route path="/venue" element={<VenuePage />} />
                <Route path="/dao" element={<DaoPage />} />
                <Route path="/legal" element={<LegalPage />} />
                <Route path="/go-live" element={<GoLivePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </PageTransition>
          </Suspense>
        </main>
        <IntentBar />
        <BottomNav />
        <FirstVisitOnboarding />
        <PwaInstallBanner />
        <LiaMonitor />
        <BackgroundMusicPlayer />
        <AssetDrawer open={assetsOpen} onClose={() => setAssetsOpen(false)} />
        <TransactionOverlay />
      </div>
    </ErrorBoundary>
  )
}
