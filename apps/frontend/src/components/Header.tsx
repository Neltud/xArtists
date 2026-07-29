import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'

const NAV = [
  { to: '/', label: 'Dashboard', emoji: '📊' },
  { to: '/agents', label: 'Agents IA', emoji: '🧠' },
  { to: '/marketplace', label: 'Marketplace', emoji: '🎨' },
  { to: '/tro', label: '$TRO', emoji: '🪙' },
  { to: '/gallery', label: 'Galerie', emoji: '🖼️' },
  { to: '/trading', label: 'Trading', emoji: '⚡' },
  { to: '/portfolio', label: 'Portfolio', emoji: '📈' },
  { to: '/hatom', label: 'Hatom', emoji: '🏦' },
  { to: '/lp', label: 'LP/Farms', emoji: '💧' },
  { to: '/dao', label: 'DAO', emoji: '🗳️' },
  { to: '/wallet', label: 'Wallet', emoji: '👛' },
  { to: '/tip', label: 'Tip 💜', emoji: '' },
]

function isValidErd(addr: string): boolean {
  return /^erd1[a-z0-9]{58}$/.test(addr.trim())
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [pemInput, setPemInput] = useState('')
  const [pemError, setPemError] = useState('')
  const { connected, shortAddress, connect, disconnect } = useWallet()
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const handlePemImport = () => {
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
    connect('erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6', method)
    setShowWalletModal(false)
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-[#2a2a3a]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <NavLink to="/" className="flex items-center gap-2 min-w-0" onClick={() => setMenuOpen(false)}>
            <span className="text-xl sm:text-2xl shrink-0">🎨</span>
            <div className="min-w-0">
              <span className="font-black text-base sm:text-lg gradient-text">xArtists</span>
              <span className="ml-1.5 text-[10px] sm:text-xs text-gray-500 font-normal hidden xs:inline">LIA v6</span>
            </div>
          </NavLink>

          <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto max-w-[55%]">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
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

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {connected ? (
              <button
                onClick={disconnect}
                className="px-2 sm:px-3 py-1.5 rounded-lg bg-[#16161f] border border-green-500/30 text-green-400 text-[10px] sm:text-xs mono hover:border-red-500/40 hover:text-red-400 transition-colors"
                title="Cliquer pour déconnecter"
              >
                ✅ {shortAddress}
              </button>
            ) : (
              <button
                onClick={() => setShowWalletModal(true)}
                className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
              >
                🔗 Connecter
              </button>
            )}

            <button
              type="button"
              className="lg:hidden p-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 active:bg-white/15 touch-manipulation"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={menuOpen}
            >
              <span className="text-xl leading-none">{menuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div
            className="lg:hidden fixed inset-0 top-14 sm:top-16 z-40 bg-black/60"
            onClick={() => setMenuOpen(false)}
          >
            <div
              className="bg-[#0a0a0f] border-b border-[#2a2a3a] max-h-[calc(100vh-3.5rem)] overflow-y-auto px-3 py-3 flex flex-col gap-0.5 shadow-2xl"
              onClick={e => e.stopPropagation()}
              style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
            >
              {NAV.map(({ to, label, emoji }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all touch-manipulation ${
                      isActive ? 'bg-purple-600/25 text-purple-300' : 'text-gray-300 active:bg-white/10'
                    }`
                  }
                >
                  <span className="text-xl w-8 text-center">{emoji || '·'}</span>
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </header>

      {showWalletModal && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => { setShowWalletModal(false); setPemError('') }}
        >
          <div
            className="card max-w-md w-full rounded-t-2xl sm:rounded-2xl animate-fade-in max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <h2 className="text-xl font-bold mb-6">🔗 Connecter votre Wallet</h2>

            <button
              onClick={() => handleMockConnect('xportal')}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#111118] border border-[#2a2a3a] hover:border-purple-500 active:border-purple-500 transition-all mb-3 touch-manipulation"
            >
              <span className="text-3xl">📱</span>
              <div className="text-left">
                <div className="font-semibold">xPortal App</div>
                <div className="text-sm text-gray-400">Scanner le QR code</div>
              </div>
            </button>

            <button
              onClick={() => handleMockConnect('defi_wallet')}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#111118] border border-[#2a2a3a] hover:border-purple-500 active:border-purple-500 transition-all mb-3 touch-manipulation"
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
              <button onClick={handlePemImport} className="btn-primary w-full mt-2 text-sm touch-manipulation">
                Importer PEM
              </button>
            </div>

            <button
              onClick={() => { setShowWalletModal(false); setPemError('') }}
              className="btn-secondary w-full mt-3 text-sm touch-manipulation"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </>
  )
}
