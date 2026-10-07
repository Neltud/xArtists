import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import PageLoader from './components/PageLoader'
import PageTransition from './components/PageTransition'
import RouteErrorBoundary from './components/RouteErrorBoundary'
import ErrorBoundary from './components/ErrorBoundary'
import ArtAtelierBackdrop from './components/ArtAtelierBackdrop'
import AgentAccessSync from './components/AgentAccessSync'
import FirstVisitOnboarding from './components/FirstVisitOnboarding'
import PwaInstallBanner from './components/PwaInstallBanner'
import BackgroundMusicPlayer from './components/BackgroundMusicPlayer'
import AssetDrawer from './components/AssetDrawer'
import ZoneRouteSync from './components/ZoneRouteSync'
import RouteSfx from './components/RouteSfx'
import FallbackRoom from './components/FallbackRoom'
import { LINKS } from './config/links'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const MuseumPage = lazy(() => import('./pages/MuseumPage'))
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'))
const MarketAnalyticsPage = lazy(() => import('./pages/MarketAnalyticsPage'))
const StakingPage = lazy(() => import('./pages/StakingPage'))
const SlotPage = lazy(() => import('./pages/SlotPage'))
const AgentsPage = lazy(() => import('./pages/AgentsPage'))
const StudioPage = lazy(() => import('./pages/StudioPage'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
const GoLivePage = lazy(() => import('./pages/GoLivePage'))
const CommandCenterPage = lazy(() => import('./pages/CommandCenterPage'))
const MyPacksPage = lazy(() => import('./pages/MyPacksPage'))
const LiaPage = lazy(() => import('./pages/LiaPage'))
const TcaGatePage = lazy(() => import('./pages/TcaGatePage'))
const TroPage = lazy(() => import('./pages/TroPage'))
const IdentityPage = lazy(() => import('./pages/IdentityPage'))
const TradingPage = lazy(() => import('./pages/TradingPage'))
const VenuePage = lazy(() => import('./pages/VenuePage'))
const DaoPage = lazy(() => import('./pages/DaoPage'))
const GalleryPage = lazy(() => import('./pages/GalleryPage'))
const WalletPage = lazy(() => import('./pages/WalletPage'))
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'))
const SiteMapPage = lazy(() => import('./pages/SiteMapPage'))
const SalePage = lazy(() => import('./pages/SalePage'))
const DemoTourPage = lazy(() => import('./pages/DemoTourPage'))
const ArtToursPage = lazy(() => import('./pages/ArtToursPage'))
const Editions = lazy(() => import('./pages/Editions'))
const TipPage = lazy(() => import('./pages/TipPage'))
const PaymentHistory = lazy(() => import('./pages/PaymentHistory'))
const AdsPage = lazy(() => import('./pages/AdsPage'))
const SimulationLab = lazy(() => import('./pages/SimulationLab'))
const EntityMap = lazy(() => import('./pages/EntityMap'))
const BurnifyPage = lazy(() => import('./pages/BurnifyPage'))
const LPPoolsPage = lazy(() => import('./pages/LPPoolsPage'))
const HatomPage = lazy(() => import('./pages/HatomPage'))
const LightningAgentPage = lazy(() => import('./pages/LightningAgentPage'))
const AgentsPolyliaPage = lazy(() => import('./pages/AgentsPolyliaPage'))

export default function App() {
  const location = useLocation()
  const [assetsOpen, setAssetsOpen] = useState(false)

  useEffect(() => {
    const onOpen = () => setAssetsOpen(true)
    window.addEventListener('xartists:open-assets', onOpen)
    return () => window.removeEventListener('xartists:open-assets', onOpen)
  }, [])

  return (
    <ErrorBoundary>
      <div className="relative flex min-h-screen flex-col">
        <ArtAtelierBackdrop />
        <AgentAccessSync />
        <Header />
        <ZoneRouteSync />
        <RouteSfx />

        <main className="atelier-content mx-auto w-full max-w-6xl flex-1 px-3 py-5 pb-28 sm:px-4 md:pb-10">
          <Suspense fallback={<PageLoader />}>
            <RouteErrorBoundary>
              <PageTransition key={location.pathname}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/market" element={<MarketAnalyticsPage />} />
                  <Route path="/marketplace" element={<MarketplacePage />} />
                  <Route path="/market-place" element={<Navigate to="/marketplace" replace />} />
                  <Route path="/trading" element={<TradingPage />} />
                  <Route path="/agents" element={<AgentsPage />} />
                  <Route path="/packs" element={<Navigate to="/agents" replace />} />
                  <Route path="/agents/lightning" element={<LightningAgentPage />} />
                  <Route path="/agents/polylia" element={<AgentsPolyliaPage />} />
                  <Route path="/my-packs" element={<MyPacksPage />} />
                  <Route path="/salles" element={<Navigate to="/my-packs" replace />} />
                  <Route path="/command-center" element={<CommandCenterPage />} />
                  <Route path="/command" element={<Navigate to="/command-center" replace />} />
                  <Route path="/cc" element={<Navigate to="/command-center" replace />} />
                  <Route path="/studio" element={<StudioPage />} />
                  <Route path="/tro" element={<TroPage />} />
                  <Route path="/staking" element={<StakingPage />} />
                  <Route path="/dao" element={<DaoPage />} />
                  <Route path="/gallery" element={<GalleryPage />} />
                  <Route path="/museum" element={<MuseumPage />} />
                  <Route path="/legal" element={<LegalPage />} />
                  <Route path="/mentions-legales" element={<Navigate to="/legal" replace />} />
                  <Route path="/wallet" element={<WalletPage />} />
                  <Route path="/portfolio" element={<PortfolioPage />} />
                  <Route path="/slot" element={<SlotPage />} />
                  <Route path="/lia" element={<LiaPage />} />
                  <Route path="/tca" element={<TcaGatePage />} />
                  <Route path="/classroom" element={<TcaGatePage />} />
                  <Route path="/go-live" element={<GoLivePage />} />
                  <Route path="/venues" element={<VenuePage />} />
                  <Route path="/identity" element={<IdentityPage />} />
                  <Route path="/sitemap" element={<SiteMapPage />} />
                  <Route path="/sale" element={<SalePage />} />
                  <Route path="/demo" element={<DemoTourPage />} />
                  <Route path="/tours" element={<ArtToursPage />} />
                  <Route path="/editions" element={<Editions />} />
                  <Route path="/tip" element={<TipPage />} />
                  <Route path="/payments" element={<PaymentHistory />} />
                  <Route path="/ads" element={<AdsPage />} />
                  <Route path="/simulation" element={<SimulationLab />} />
                  <Route path="/entities" element={<EntityMap />} />
                  <Route path="/burnify" element={<BurnifyPage />} />
                  <Route path="/lp" element={<LPPoolsPage />} />
                  <Route path="/hatom" element={<HatomPage />} />
                  <Route path="*" element={<FallbackRoom />} />
                </Routes>
              </PageTransition>
            </RouteErrorBoundary>
          </Suspense>
        </main>

        <BottomNav />
        <FirstVisitOnboarding />
        <PwaInstallBanner />
        <BackgroundMusicPlayer />
        <AssetDrawer open={assetsOpen} onClose={() => setAssetsOpen(false)} />

        <footer className="hidden border-t border-white/5 py-4 text-center text-[10px] text-zinc-600 md:block">
          <a href={LINKS.github} className="hover:text-zinc-400" target="_blank" rel="noreferrer">
            GitHub
          </a>
          {' · '}MultiversX mainnet
        </footer>
      </div>
    </ErrorBoundary>
  )
}
