import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import ErrorBoundary from './components/ErrorBoundary'
import PwaInstallBanner from './components/PwaInstallBanner'
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
const TroPage = lazy(() => import('./pages/TroPage'))
const StakingPage = lazy(() => import('./pages/StakingPage'))
const SoulTestnetPage = lazy(() => import('./pages/SoulTestnetPage'))
const AgentsPolyliaPage = lazy(() => import('./pages/AgentsPolyliaPage'))
const BurnifyPage = lazy(() => import('./pages/BurnifyPage'))
const ArtistStudio = lazy(() => import('./pages/ArtistStudio'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-2 border-purple-600 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Chargement...</p>
      </div>
    </div>
  )
}

function StaleDataBanner({ isStale, lastUpdate }: { isStale: boolean; lastUpdate: Date | null }) {
  if (!isStale) return null
  return (
    <div className="bg-orange-500/10 border-b border-orange-500/30 px-4 py-2 text-center text-xs text-orange-400">
      ⚠️ Données potentiellement périmées —{' '}
      {lastUpdate ? lastUpdate.toLocaleTimeString('fr-FR') : 'inconnue'}.{' '}
      <button className="underline" onClick={() => window.location.reload()}>
        Actualiser
      </button>
    </div>
  )
}

export default function App() {
  const { isStale, lastUpdate } = useMultiversX()

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      <Header />
      <StaleDataBanner isStale={isStale} lastUpdate={lastUpdate} />
      <main
        className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-8"
        style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/studio" element={<ArtistStudio />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/agents/polylia" element={<AgentsPolyliaPage />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/trading" element={<Trading />} />
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
              <Route
                path="*"
                element={
                  <div className="text-center py-20">
                    <h2 className="text-2xl font-bold mb-2">Page introuvable</h2>
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <footer className="border-t border-[#2a2a3a] mt-8 py-6 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold">xArtists — LIA v6</p>
            <p className="text-xs text-gray-500">@tudurioriginal · MultiversX Mainnet</p>
          </div>
          <div className="flex gap-4 text-sm text-gray-500">
            <a href={LINKS.github} target="_blank" rel="noreferrer" className="hover:text-white">
              GitHub
            </a>
            <a href={LINKS.explorer} target="_blank" rel="noreferrer" className="hover:text-white">
              Explorer
            </a>
            <a href={LINKS.xexchange} target="_blank" rel="noreferrer" className="hover:text-white">
              xExchange
            </a>
          </div>
        </div>
      </footer>
      <PwaInstallBanner />
      <BottomNav />
    </div>
  )
}
