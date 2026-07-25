import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'

// Lazy loading de toutes les pages
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Marketplace = lazy(() => import('./pages/Marketplace'))
const Trading = lazy(() => import('./pages/Trading'))
const Portfolio = lazy(() => import('./pages/Portfolio'))
const DAO = lazy(() => import('./pages/DAO'))
const Tip = lazy(() => import('./pages/Tip'))
const Wallet = lazy(() => import('./pages/Wallet'))

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

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/trading" element={<Trading />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/dao" element={<DAO />} />
            <Route path="/tip" element={<Tip />} />
            <Route path="/wallet" element={<Wallet />} />
            {/* 404 fallback */}
            <Route path="*" element={
              <div className="text-center py-20">
                <p className="text-6xl mb-4">🎨</p>
                <h2 className="text-2xl font-bold mb-2">Page introuvable</h2>
                <p className="text-gray-500">Cette page n’existe pas encore.</p>
              </div>
            } />
          </Routes>
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2a2a3a] mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎨</span>
              <div>
                <p className="font-bold">xArtists — LIA v6</p>
                <p className="text-xs text-gray-500">@tudurioriginal • MultiversX Mainnet</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <a href="https://github.com/Neltud/xArtists" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">💙 GitHub</a>
              <a href="https://explorer.multiversx.com/accounts/erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">🔗 Explorer</a>
              <a href="https://xexchange.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">🔵 xExchange</a>
              <span className="text-[#2a2a3a]">|</span>
              <span>LIA v6 — Vellum Workflows</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
