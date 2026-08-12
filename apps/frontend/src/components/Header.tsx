import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useWallet, LIA_WALLET } from '../context/WalletContext'
import { sdkDappConfig } from '../config/sdkDapp'
import { LINKS, PRIMARY_NAV, SECONDARY_NAV } from '../config/links'
import OraclePriceBadge from './OraclePriceBadge'

function isValidErd(addr: string): boolean {
  return /^erd1[a-z0-9]{58}$/i.test(addr.trim())
}

function getCallbackUrl(): string {
  if (typeof window === 'undefined') return LINKS.dapp
  return `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, '/') || '/xArtists/'}`
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [manualAddr, setManualAddr] = useState('')
  const [connectError, setConnectError] = useState('')
  const { connected, shortAddress, connect, disconnect, address, method } = useWallet()
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const openWebWallet = () => {
    window.location.href = LINKS.walletLogin(getCallbackUrl())
  }

  const openXPortalDeepLink = () => {
    const deep = sdkDappConfig.customNetworkConfig.walletConnectDeepLink
    window.open(deep, '_blank', 'noopener,noreferrer')
    setConnectError(
      'xPortal ouvert. Pour QR WalletConnect complet : Web Wallet recommandé — jamais le wallet protocole LIA.'
    )
  }

  const tryExtension = async () => {
    setConnectError('')
    const w = window as unknown as {
      elrondWallet?: { getAddress?: () => Promise<string> }
      multiversxWallet?: { getAddress?: () => Promise<string> }
    }
    try {
      const provider = w.elrondWallet || w.multiversxWallet
      if (provider?.getAddress) {
        const addr = await provider.getAddress()
        const res = connect(addr, 'defi_wallet')
        if (!res.ok) setConnectError(res.error || 'Connexion échouée')
        else setShowWalletModal(false)
        return
      }
      setConnectError(
        'Extension DeFi Wallet non détectée. Installe MultiversX DeFi Wallet, ou utilise Web Wallet.'
      )
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : 'Erreur extension')
    }
  }

  const handleManual = () => {
    setConnectError('')
    if (!isValidErd(manualAddr)) {
      setConnectError('Adresse erd1… invalide')
      return
    }
    if (manualAddr.trim().toLowerCase() === LIA_WALLET.toLowerCase()) {
      setConnectError(
        'Impossible d’utiliser le wallet protocole LIA. Connecte ton propre wallet.'
      )
      return
    }
    const res = connect(manualAddr.trim(), 'paste_readonly')
    if (!res.ok) setConnectError(res.error || 'Échec')
    else {
      setShowWalletModal(false)
      setManualAddr('')
      setConnectError('')
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-[#2a2a3a]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <NavLink to="/" className="flex items-center gap-2 min-w-0" onClick={() => setMenuOpen(false)}>
            <span className="text-xl sm:text-2xl shrink-0">🎨</span>
            <div className="min-w-0">
              <span className="font-black text-base sm:text-lg gradient-text">xArtists</span>
              <span className="ml-1.5 text-[10px] sm:text-xs text-gray-500 font-normal hidden sm:inline">
                LIA v6
              </span>
            </div>
          </NavLink>

          <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto max-w-[55%] scrollbar-none">
            {PRIMARY_NAV.map(({ to, label }) => (
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
            <span className="hidden sm:inline-flex">
              <OraclePriceBadge />
            </span>
            {connected ? (
              <button
                type="button"
                onClick={disconnect}
                className={`px-2 sm:px-3 py-1.5 rounded-lg bg-[#16161f] border text-[10px] sm:text-xs mono transition-colors min-h-[40px] ${
                  method === 'paste_readonly'
                    ? 'border-amber-500/40 text-amber-300 hover:border-red-500/40'
                    : 'border-green-500/30 text-green-400 hover:border-red-500/40 hover:text-red-400'
                }`}
                title={`${address} · ${method || '—'} — clic pour déconnecter`}
              >
                {method === 'paste_readonly' ? '👁' : '✅'} {shortAddress}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowWalletModal(true)
                  setConnectError('')
                }}
                className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
              >
                🔗 Connect
              </button>
            )}

            <button
              type="button"
              className="lg:hidden p-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 active:bg-white/15 touch-manipulation min-h-[44px] min-w-[44px]"
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
              <div className="px-4 py-2">
                <OraclePriceBadge />
              </div>
              {PRIMARY_NAV.map(({ to, label, emoji }) => (
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
              <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-gray-600">Plus</p>
              {SECONDARY_NAV.map(({ to, label, emoji }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all touch-manipulation ${
                      isActive ? 'bg-purple-600/20 text-purple-300' : 'text-gray-400 active:bg-white/10'
                    }`
                  }
                >
                  <span className="text-lg w-8 text-center">{emoji || '·'}</span>
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
          onClick={() => {
            setShowWalletModal(false)
            setConnectError('')
          }}
        >
          <div
            className="card max-w-md w-full rounded-t-2xl sm:rounded-2xl animate-fade-in max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <h2 className="text-xl font-bold mb-2">Connecter le wallet</h2>
            <p className="text-xs text-zinc-500 mb-4">
              <strong className="text-zinc-300">Ton</strong> wallet uniquement — jamais l’adresse protocole
              LIA. Coller erd1 = <strong>lecture seule</strong> (pas de List/Buy).
            </p>

            <button
              type="button"
              onClick={openWebWallet}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#111118] border border-[#2a2a3a] hover:border-purple-500 transition-all mb-3 min-h-[56px]"
            >
              <span className="text-3xl">🌐</span>
              <div className="text-left">
                <div className="font-semibold">Web Wallet</div>
                <div className="text-sm text-gray-400">wallet.multiversx.com — recommandé pour TX</div>
              </div>
            </button>

            <button
              type="button"
              onClick={openXPortalDeepLink}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#111118] border border-[#2a2a3a] hover:border-purple-500 transition-all mb-3 min-h-[56px]"
            >
              <span className="text-3xl">📱</span>
              <div className="text-left">
                <div className="font-semibold">xPortal</div>
                <div className="text-sm text-gray-400">Ouvrir l’app / deep link</div>
              </div>
            </button>

            <button
              type="button"
              onClick={tryExtension}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#111118] border border-[#2a2a3a] hover:border-purple-500 transition-all mb-3 min-h-[56px]"
            >
              <span className="text-3xl">🦊</span>
              <div className="text-left">
                <div className="font-semibold">Extension DeFi Wallet</div>
                <div className="text-sm text-gray-400">Idéal pour micro List/Buy</div>
              </div>
            </button>

            <div className="mt-2">
              <p className="text-xs text-amber-400/90 mb-2">
                Ou coller erd1 — <strong>lecture seule</strong> (ne signe pas List/Buy/Bid)
              </p>
              <input
                className="w-full p-3 rounded-lg bg-[#111118] border border-[#2a2a3a] text-xs mono text-gray-300 focus:outline-none focus:border-purple-500"
                placeholder="erd1..."
                value={manualAddr}
                onChange={e => setManualAddr(e.target.value)}
              />
              <button type="button" onClick={handleManual} className="btn-secondary w-full mt-2 text-sm">
                Utiliser l’adresse (lecture seule)
              </button>
            </div>

            {connectError && (
              <p className="text-xs text-amber-400 mt-3 leading-relaxed">{connectError}</p>
            )}

            <button
              type="button"
              onClick={() => {
                setShowWalletModal(false)
                setConnectError('')
              }}
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
