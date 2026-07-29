import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import ErrorBoundary from './components/ErrorBoundary'
import { useMultiversX } from './hooks/useMultiversX'

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
      ⚠️ Données potentiellement périmées — dernière mise à jour :{' '}
      {lastUpdate ? lastUpdate.toLocaleTimeString('fr-FR') : 'inconnue'}.{' '}
      <button
        className="underline hover:text-orange-300 transition-colors"
        onClick={() => window.location.reload()}
      >
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
              <Route path="/" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
              <Route path="/agents" element={<ErrorBoundary><Agents /></ErrorBoundary>} />
              <Route path="/marketplace" element={<ErrorBoundary><Marketplace /></ErrorBoundary>} />
              <Route path="/trading" element={<ErrorBoundary><Trading /></ErrorBoundary>} />
              <Route path="/tro" element={<ErrorBoundary><TroPage /></ErrorBoundary>} />
              <Route path="/portfolio" element={<ErrorBoundary><Portfolio /></ErrorBoundary>} />
              <Route path="/dao" element={<ErrorBoundary><DAO /></ErrorBoundary>} />
              <Route path="/gallery" element={<ErrorBoundary><Gallery /></ErrorBoundary>} />
              <Route path="/tip" element={<ErrorBoundary><Tip /></ErrorBoundary>} />
              <Route path="/wallet" element={<ErrorBoundary><Wallet /></ErrorBoundary>} />
              <Route path="/hatom" element={<ErrorBoundary><HatomPage /></ErrorBoundary>} />
              <Route path="/lp" element={<ErrorBoundary><LPPoolsPage /></ErrorBoundary>} />
              <Route path="*" element={
                <div className="text-center py-20">
                  <p className="text-6xl mb-4">🎨</p>
                  <h2 className="text-2xl font-bold mb-2">Page introuvable</h2>
                  <p className="text-gray-500">Cette page n'existe pas encore.</p>
                </div>
              } />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      <footer className="border-t border-[#2a2a3a] mt-8 py-6 hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎨</span>
              <div>
                <p className="font-bold">xArtists — LIA v6</p>
                <p className="text-xs text-gray-500">@tudurioriginal • MultiversX Mainnet</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap justify-center">
              <a href="https://github.com/Neltud/xArtists" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
              <a href="https://explorer.multiversx.com/accounts/erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Explorer</a>
              <a href="https://xexchange.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">xExchange</a>
              <span className="text-[#2a2a3a]">|</span>
              <span>LIA v6 + GreenSmoke</span>
            </div>
          </div>
        </div>
      </footer>

      <BottomNav />
    </div>
  )
}
