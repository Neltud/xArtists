import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'

const NAV = [
  { to: '/', label: 'Dashboard', emoji: '📊' },
  { to: '/marketplace', label: 'Marketplace', emoji: '🎨' },
  { to: '/gallery', label: 'Galerie', emoji: '🖼️' },
  { to: '/trading', label: 'Trading', emoji: '⚡' },
  { to: '/portfolio', label: 'Portfolio', emoji: '📈' },
  { to: '/hatom', label: 'Hatom', emoji: '🏦' },
  { to: '/lp', label: 'LP/Farms', emoji: '💧' },
  { to: '/dao', label: 'DAO', emoji: '🗳️' },
  { to: '/wallet', label: 'Wallet', emoji: '👛' },
  { to: '/tip', label: 'Tip 💜', emoji: '' },
]

// Validate that string looks like a bech32 MultiversX address (starts with 'erd1', 62 chars)
function isValidErd(addr: string): boolean {
  return /^erd1[a-z0-9]{58}$/.test(addr.trim())
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [pemInput, setPemInput] = useState('')
  const [pemError, setPemError] = useState('')
  const { connected, shortAddress, connect, disconnect } = useWallet()

  const handlePemImport = () => {
    // Extract address from PEM — look for erd1... pattern inside the key block
    const match = pemInput.match(/erd1[a-z0-9]{58}/)
    if (match && isValidErd(match[0])) {
      connect(match[0], 'pem')
      setPemInput('')
      setPemError('')
      setShowWalletModal(false)
    } else {
      setPemError('Adresse non trouvée dans le fichier PEM. Vérifiez le contenu.')
    }
  }

  const handleMockConnect = (method: 'xportal' | 'defi_wallet') => {
    // In production this would call @multiversx/sdk-dapp login flows.
    // For demo, we connect with the public LIA agent wallet address.
    connect('erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6', method)
    setShowWalletModal(false)
  }

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
            {connected ? (
              <button
                onClick={disconnect}
                className="px-3 py-1.5 rounded-lg bg-[#16161f] border border-green-500/30 text-green-400 text-xs mono hover:border-red-500/40 hover:text-red-400 transition-colors"
                title="Cliquer pour déconnecter"
              >
                ✅ {shortAddress}
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
          onClick={() => { setShowWalletModal(false); setPemError('') }}
        >
          <div
            className="card max-w-md w-full animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-6">🔗 Connecter votre Wallet</h2>

            <button
              onClick={() => handleMockConnect('xportal')}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#111118] border border-[#2a2a3a] hover:border-purple-500 transition-all mb-3"
            >
              <span className="text-3xl">📱</span>
              <div className="text-left">
                <div className="font-semibold">xPortal App</div>
                <div className="text-sm text-gray-400">Scanner le QR code</div>
              </div>
            </button>

            <button
              onClick={() => handleMockConnect('defi_wallet')}
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
                className="w-full p-3 rounded-lg bg-[#111118] border border-[#2a2a3a] text-xs mono text-gray-300 resize-none h-20 focus:outline-none focus:border-purple-500"
                placeholder="Coller votre clé PEM ici..."
                value={pemInput}
                onChange={e => { setPemInput(e.target.value); setPemError('') }}
              />
              {pemError && <p className="text-xs text-red-400 mt-1">{pemError}</p>}
              <button
                onClick={handlePemImport}
                className="btn-primary w-full mt-2 text-sm"
              >
                Importer PEM
              </button>
            </div>

            <button
              onClick={() => { setShowWalletModal(false); setPemError('') }}
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
