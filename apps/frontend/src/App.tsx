import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Header from './components/Header'
import MobileNav from './components/MobileNav'
import Footer from './components/Footer'
import BackgroundFX from './components/BackgroundFX'
import AmbientSoundscape from './components/AmbientSoundscape'
import { WalletProvider } from './context/WalletContext'
import { ToastProvider } from './context/ToastContext'
import { I18nProvider } from './context/I18nContext'
import Toast from './components/Toast'
import RoutePrefetch from './components/RoutePrefetch'
import ScrollToTop from './components/ScrollToTop'
import RouteErrorBoundary from './components/RouteErrorBoundary'
import RouteSfx from './components/RouteSfx'
import { initAgent8008Bridge } from './lib/agent8008Bridge'

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
const PaymentHistory = lazy(() => import('./pages/PaymentHistory'))
const Editions = lazy(() => import('./pages/Editions'))
const SimulationLab = lazy(() => import('./pages/SimulationLab'))
const EntityMap = lazy(() => import('./pages/EntityMap'))
const SiteMapPage = lazy(() => import('./pages/SiteMapPage'))
const TxShell = lazy(() => import('./providers/TxShell'))
const DemoTourPage = lazy(() => import('./pages/DemoTourPage'))
const GoLivePage = lazy(() => import('./pages/GoLivePage'))
const VenueAccountPage = lazy(() => import('./pages/VenueAccountPage'))
const DigitalTwinPage = lazy(() => import('./pages/DigitalTwinPage'))
const SlotPage = lazy(() => import('./pages/SlotPage'))
const LiaPerformancePage = lazy(() => import('./pages/LiaPerformancePage'))

function AppShell() {
  const location = useLocation()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    initAgent8008Bridge()
    setReady(true)
  }, [])
  if (!ready) return null
  return (
    <div className="min-h-screen flex flex-col relative">
      <BackgroundFX />
      <Header />
      <main className="flex-1 px-3 sm:px-4 pt-3 pb-24 md:pb-8 max-w-6xl w-full mx-auto">
        <RouteErrorBoundary>
          <Suspense fallback={<div className="text-zinc-500 text-sm py-12 text-center">Chargement…</div>}>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/market" element={<MarketPage />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/trading" element={<Trading />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/my-packs" element={<MyPacks />} />
                <Route path="/studio" element={<ArtistStudio />} />
                <Route path="/sale" element={<SalePage />} />
                <Route path="/simulation" element={<SimulationLab />} />
                <Route path="/entities" element={<EntityMap />} />
                <Route path="/sitemap" element={<SiteMapPage />} />
                <Route path="/tours" element={<ArtToursPage />} />
                <Route path="/agents/polylia" element={<AgentsPolyliaPage />} />
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
                <Route path="/digital-twin" element={<DigitalTwinPage />} />
                <Route path="/sculpture-lab" element={<DigitalTwinPage />} />
                <Route path="/musee" element={<Navigate to="/museum" replace />} />
                <Route path="/collection" element={<Navigate to="/museum?tab=mine" replace />} />
                <Route path="/legal" element={<LegalPage />} />
                <Route path="/mentions-legales" element={<LegalPage />} />
                <Route path="/tip" element={<Tip />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/hatom" element={<HatomPage />} />
                <Route path="/lp" element={<LPPoolsPage />} />
                <Route path="/ads" element={<AdsPage />} />
                <Route path="/payments" element={<PaymentHistory />} />
                <Route path="/editions" element={<Editions />} />
                <Route path="/slot" element={<SlotPage />} />
                <Route path="/lia" element={<LiaPerformancePage />} />
                <Route path="/performance" element={<LiaPerformancePage />} />
                <Route path="/demo" element={<DemoTourPage />} />
                <Route path="/go-live" element={<GoLivePage />} />
                <Route path="/venues" element={<VenueAccountPage />} />
                <Route path="/accounts" element={<VenueAccountPage />} />
                <Route path="/soul" element={<SoulTestnetPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      </main>
      <Footer />
      <MobileNav />
      <Toast />
      <RoutePrefetch />
      <ScrollToTop />
      <RouteSfx />
      <AmbientSoundscape />
      <Suspense fallback={null}>
        <TxShell />
      </Suspense>
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        <WalletProvider>
          <AppShell />
        </WalletProvider>
      </ToastProvider>
    </I18nProvider>
  )
}
