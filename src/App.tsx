import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import TradingPage from './pages/TradingPage'
import PortfolioPage from './pages/PortfolioPage'
import MarketplacePage from './pages/MarketplacePage'
import DaoPage from './pages/DaoPage'
import AgentsPage from './pages/AgentsPage'
import HatomPage from './pages/HatomPage'
import TechPage from './pages/TechPage'
import './index.css'

const App: React.FC = () => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL?.replace(/\/$/, '') || ''}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/trading" element={<TradingPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/dao" element={<DaoPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/hatom" element={<HatomPage />} />
          <Route path="/tech" element={<TechPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
