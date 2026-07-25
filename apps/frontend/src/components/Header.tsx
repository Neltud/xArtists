import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Dashboard', emoji: '📊' },
  { to: '/marketplace', label: 'Marketplace', emoji: '🎨' },
  { to: '/trading', label: 'Trading', emoji: '⚡' },
  { to: '/portfolio', label: 'Portfolio', emoji: '📈' },
  { to: '/dao', label: 'DAO', emoji: '🗳️' },
  { to: '/tip', label: 'Tip 💜', emoji: '' },
  { to: '/wallet', label: 'Wallet', emoji: '👛' },
]

const WALLET_SHORT = 'erd1p4zy...crn6'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-[#2a2a3a]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-3">
            <span className="text-2xl">🎨</span>
            <div>
              <span className="font-black text-lg gradient-text">xArtists</span>
              <span className="ml-2 text-xs text-gray-500 font-normal">LIA v6</span>
            </div>
          </NavLink>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {walletConnected ? (
              <button
                onClick={() => setWalletConnected(false)}
                className="px-3 py-1.5 rounded-lg bg-[#16161f] border border-green-500/30 text-green-400 text-xs mono"
              >
                ✅ {WALLET_SHORT}
              </button>
            ) : (
              <button
                onClick={() => setShowWalletModal(true)}
                className="btn-primary text-sm px-4 py-2"
              >
                🔗 Connecter
              </button>
            )}

            {/* Mobile menu */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-[#2a2a3a] bg-[#0a0a0f] px-4 py-3 flex flex-col gap-1">
            {NAV.map(({ to, label, emoji }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive ? 'bg-purple-600/20 text-purple-400' : 'text-gray-400'
                  }`
                }
              >
                {emoji} {label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Wallet Modal */}
      {showWalletModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowWalletModal(false)}
        >
          <div
            className="card max-w-md w-full animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-6">🔗 Connecter votre Wallet</h2>

            <button
              onClick={() => { setWalletConnected(true); setShowWalletModal(false) }}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#111118] border border-[#2a2a3a] hover:border-purple-500 transition-all mb-3"
            >
              <span className="text-3xl">📱</span>
              <div className="text-left">
                <div className="font-semibold">xPortal App</div>
                <div className="text-sm text-gray-400">Scanner le QR code</div>
              </div>
            </button>

            <button
              onClick={() => { setWalletConnected(true); setShowWalletModal(false) }}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#111118] border border-[#2a2a3a] hover:border-purple-500 transition-all mb-3"
            >
              <span className="text-3xl">🦊</span>
              <div className="text-left">
                <div className="font-semibold">MultiversX DeFi Wallet</div>
                <div className="text-sm text-gray-400">Extension navigateur</div>
              </div>
            </button>

            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Ou importer un fichier PEM (lecture seule)</p>
              <textarea
                className="w-full p-3 rounded-lg bg-[#111118] border border-[#2a2a3a] text-xs mono text-gray-300 resize-none h-20"
                placeholder="Coller votre clé PEM ici..."
              />
              <button
                onClick={() => { setWalletConnected(true); setShowWalletModal(false) }}
                className="btn-primary w-full mt-2 text-sm"
              >
                Importer PEM
              </button>
            </div>

            <button
              onClick={() => setShowWalletModal(false)}
              className="btn-secondary w-full mt-3 text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </>
  )
}
