import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { sdkDappConfig } from '../config/sdkDapp'
import { LINKS, PRIMARY_NAV, SECONDARY_NAV } from '../config/links'
import OraclePriceBadge from './OraclePriceBadge'
import StatusIndicator from './ui/StatusIndicator'
import { OPEN_CONNECT_EVENT, requestOpenAssets } from '../lib/walletEvents'

function isValidErd(addr: string): boolean {
  return /^erd1[a-z0-9]{58}$/i.test(addr.trim())
}

function getCallbackUrl(): string {
  if (typeof window === 'undefined') return LINKS.dapp
  return `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, '/') || '/xArtists/'}`
}

const DESKTOP_NAV = PRIMARY_NAV.filter(n =>
  ['/', '/agents', '/museum', '/tours', '/gallery', '/wallet', '/marketplace', '/my-packs'].includes(
    n.to
  )
)

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

  useEffect(() => {
    const open = () => {
      setShowWalletModal(true)
      setConnectError('')
    }
    window.addEventListener(OPEN_CONNECT_EVENT, open)
    return () => window.removeEventListener(OPEN_CONNECT_EVENT, open)
  }, [])

  const openWebWallet = () => {
    window.location.href = LINKS.walletLogin(getCallbackUrl())
  }

  const openXPortalDeepLink = () => {
    const deep = sdkDappConfig.customNetworkConfig.walletConnectDeepLink
    window.open(deep, '_blank', 'noopener,noreferrer')
    setConnectError('xPortal ouvert. Web Wallet recommandé pour les TX signées.')
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
      setConnectError('Extension MultiversX introuvable. Utilise Web Wallet.')
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : 'Erreur extension')
    }
  }

  const handleManual = () => {
    if (!isValidErd(manualAddr)) {
      setConnectError('Adresse erd1 invalide')
      return
    }
    const res = connect(manualAddr.trim(), 'paste_readonly')
    if (!res.ok) setConnectError(res.error || 'Échec')
    else {
      setShowWalletModal(false)
      setManualAddr('')
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/[0.06] glass">
        <div className="page-wrap flex items-center justify-between gap-3 h-14 sm:h-16">
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-sm font-black text-white shadow-glow">
              xA
            </span>
            <span className="display text-lg text-white group-hover:opacity-90 hidden sm:inline">
              xArtists
            </span>
          </NavLink>

          <nav className="hidden xl:flex items-center gap-0.5 flex-1 justify-center max-w-3xl overflow-x-auto">
            {DESKTOP_NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `nav-pill ${isActive ? 'nav-pill-active' : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <StatusIndicator />
            </div>
            <button
              type="button"
              className="hidden sm:inline-flex btn-secondary text-[10px] !py-1 !px-2"
              onClick={() => requestOpenAssets()}
              title="Asset Hub"
            >
              Assets
            </button>
            <div className="hidden md:block">
              <OraclePriceBadge />
            </div>

            {connected ? (
              <button
                type="button"
                onClick={() => disconnect()}
                className={`mono text-[11px] sm:text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                  method === 'paste_readonly'
                    ? 'border-amber-500/40 text-amber-300 hover:border-rose-500/40'
                    : 'border-emerald-500/30 text-emerald-300 hover:border-rose-500/40'
                }`}
                title={`${address} · ${method || '—'}`}
              >
                {method === 'paste_readonly' ? '👁' : '●'} {shortAddress}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowWalletModal(true)
                  setConnectError('')
                }}
                className="btn-primary text-xs sm:text-sm !py-1.5 !px-3"
              >
                Connect
              </button>
            )}

            <button
              type="button"
              className="xl:hidden p-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px]"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Fermer' : 'Menu'}
              aria-expanded={menuOpen}
            >
              <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div
            className="xl:hidden fixed inset-0 top-14 sm:top-16 z-40 bg-black/70 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          >
            <div
              className="border-b border-white/[0.08] max-h-[calc(100vh-3.5rem)] overflow-y-auto px-3 py-3 flex flex-col gap-0.5 shadow-2xl"
              style={{
                background: 'rgba(8,8,14,0.96)',
                paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="px-3 py-2 flex flex-wrap gap-2 items-center">
                <StatusIndicator />
                <button
                  type="button"
                  className="btn-secondary text-[10px] !py-1 !px-2"
                  onClick={() => {
                    setMenuOpen(false)
                    requestOpenAssets()
                  }}
                >
                  Assets
                </button>
                <OraclePriceBadge />
              </div>
              {PRIMARY_NAV.map(({ to, label, emoji }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium ${
                      isActive
                        ? 'bg-violet-500/20 text-violet-200 border border-violet-400/20'
                        : 'text-zinc-300 active:bg-white/5'
                    }`
                  }
                >
                  <span className="w-7 text-center opacity-80">{emoji || '·'}</span>
                  {label}
                </NavLink>
              ))}
              <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                Lab · pré-mainnet
              </p>
              {SECONDARY_NAV.map(({ to, label, emoji }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm ${
                      isActive ? 'text-cyan-300' : 'text-zinc-500'
                    }`
                  }
                >
                  <span className="w-7 text-center">{emoji || '·'}</span>
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </header>

      {showWalletModal && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm"
          onClick={() => {
            setShowWalletModal(false)
            setConnectError('')
          }}
        >
          <div
            className="card max-w-md w-full rounded-t-3xl sm:rounded-3xl animate-fade-in max-h-[90vh] overflow-y-auto !border-violet-500/20"
            onClick={e => e.stopPropagation()}
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-violet-400/80 mb-1">
              MultiversX
            </p>
            <h2 className="display text-xl mb-2">Connecter le wallet</h2>
            <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
              <strong className="text-zinc-300">Ton</strong> wallet — jamais le wallet protocole LIA.
              Adresse collée = lecture seule.
            </p>

            {[
              {
                title: 'Web Wallet',
                sub: 'wallet.multiversx.com — recommandé',
                icon: '🌐',
                onClick: openWebWallet,
              },
              {
                title: 'xPortal',
                sub: 'App mobile / deep link',
                icon: '📱',
                onClick: openXPortalDeepLink,
              },
              {
                title: 'Extension DeFi',
                sub: 'Chrome List / Buy',
                icon: '🦊',
                onClick: () => void tryExtension(),
              },
            ].map(opt => (
              <button
                key={opt.title}
                type="button"
                onClick={opt.onClick}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-violet-500/40 hover:bg-violet-500/5 transition-all mb-2.5 min-h-[56px] text-left"
              >
                <span className="text-2xl">{opt.icon}</span>
                <div>
                  <div className="font-semibold text-white">{opt.title}</div>
                  <div className="text-xs text-zinc-500">{opt.sub}</div>
                </div>
              </button>
            ))}

            <div className="mt-3 pt-3 divider">
              <p className="text-xs text-amber-400/90 mb-2">Ou coller erd1 — lecture seule</p>
              <input
                className="input-field mono text-xs"
                placeholder="erd1…"
                value={manualAddr}
                onChange={e => setManualAddr(e.target.value)}
              />
              <button type="button" onClick={handleManual} className="btn-secondary w-full mt-2 text-sm">
                Utiliser l’adresse
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
              className="btn-ghost w-full mt-2 text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </>
  )
}
