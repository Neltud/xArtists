import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import WalletConnect from './WalletConnect'
import { LIA_WALLET, shortAddr, explorerAccount, DAPP_URL } from '../config/contracts'
import './Layout.css'

const NAV = [
  { to: '/', label: 'Dashboard' },
  { to: '/trading', label: 'Trading LIA' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/dao', label: 'DAO $TRO' },
  { to: '/agents', label: 'Agents' },
  { to: '/hatom', label: 'Yield / Hatom' },
  { to: '/tech', label: 'Tech / Vellum' },
] as const

const Layout: React.FC = () => {
  return (
    <div className="xa-shell">
      <header className="xa-top">
        <div className="xa-brand">
          <span className="xa-logo">✕</span>
          <div>
            <div className="xa-title">xArtists</div>
            <div className="xa-sub">LIA v6 · MultiversX mainnet · Vellum</div>
          </div>
        </div>
        <nav className="xa-nav" aria-label="Principal">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="xa-wallet-slot">
          <WalletConnect className="connect-btn" />
        </div>
      </header>

      <main className="xa-content">
        <Outlet />
      </main>

      <footer className="xa-foot">
        <span>
          LIA{' '}
          <a href={explorerAccount(LIA_WALLET)} target="_blank" rel="noreferrer">
            {shortAddr(LIA_WALLET)}
          </a>
        </span>
        <span>·</span>
        <a href={DAPP_URL} target="_blank" rel="noreferrer">
          Pages
        </a>
        <span>·</span>
        <span>Chain ID 1 · OrchestratorRouter · Circuit +1%</span>
        <span>·</span>
        <span>© Neltud / Tuduri</span>
      </footer>
    </div>
  )
}

export default Layout
