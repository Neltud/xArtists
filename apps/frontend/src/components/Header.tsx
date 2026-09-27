import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { LINKS, PRIMARY_NAV, SECONDARY_NAV } from '../config/links'
import { OPEN_CONNECT_EVENT, requestOpenAssets } from '../lib/walletEvents'
import { loginWithXPortalMainnet } from '../lib/xportalWc'

function isValidErd(addr: string): boolean {
  return /^erd1[a-z0-9]{58}$/i.test(addr.trim())
}

function getCallbackUrl(): string {
  if (typeof window === 'undefined') return LINKS.dapp
  return `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, '/') || '/xArtists/'}`
}

const DESKTOP_NAV = PRIMARY_NAV.filter(n =>
  ['/', '/museum', '/agents', '/tours', '/wallet', '/marketplace'].includes(n.to),
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

  const openXPortalDeepLink = async () => {
    setConnectError('Connexion xPortal mainnet (WalletConnect)…')
    try {
      const res = await loginWithXPortalMainnet(p => {
        if (p.message) setConnectError(p.message)
      })
      if (!res.ok) {
        setConnectError(res.error + ' — Web Wallet reste disponible.')
        return
      }
      const linked = connect(res.address, 'xportal')
      if (!linked.ok) setConnectError(linked.error || 'Session refusée')
      else setShowWalletModal(false)
    } catch (e) {
      setConnectError(
        (e instanceof Error ? e.message : 'Erreur xPortal') + ' — utilise Web Wallet.',
      )
    }
  }

  const openExtension = async () => {
    setConnectError('')
    try {
      const provider = (window as unknown as { elrondWallet?: { login: () => Promise<string> } })
        .elrondWallet
      if (!provider?.login) {
        setConnectError('Extension MultiversX introuvable. Utilise Web Wallet.')
        return
      }
      const addr = await provider.login()
      const res = connect(String(addr).trim(), 'extension')
      if (!res.ok) setConnectError(res.error || 'Connexion échouée')
      else setShowWalletModal(false)
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : 'Erreur extension')
    }
  }

  const submitManual = () => {
    setConnectError('')
    if (!isValidErd(manualAddr)) {
      setConnectError('Adresse erd1 invalide')
      return
    }
    const res = connect(manualAddr.trim(), 'paste')
    if (!res.ok) setConnectError(res.error || 'Échec')
    else {
      setShowWalletModal(false)
      setManualAddr('')
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-3 sm:px-4">
          <NavLink to="/" className="flex items-center gap-2 shrink-0" aria-label="Accueil">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-sm font-bold text-white">
              xA
            </span>
            <span className="hidden sm:inline text-sm font-semibold text-white">xArtists</span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1">
            {DESKTOP_NAV.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition ${
                    isActive ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {connected ? (
              <button
                type="button"
                onClick={() => requestOpenAssets()}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] text-zinc-200"
                title={address}
              >
                {shortAddress}
                {method ? ` · ${method}` : ''}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowWalletModal(true)
                  setConnectError('')
                }}
                className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-1.5 text-[12px] font-semibold text-white shadow"
              >
                Connect
              </button>
            )}
            {connected && (
              <button
                type="button"
                onClick={() => disconnect()}
                className="hidden sm:inline text-[11px] text-zinc-500 hover:text-zinc-300"
              >
                Out
              </button>
            )}
            <button
              type="button"
              className="md:hidden rounded-lg border border-white/10 p-2 text-white"
              aria-label="Menu"
              onClick={() => setMenuOpen(o => !o)}
            >
              ☰
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-white/5 bg-zinc-950 px-3 py-3 max-h-[70vh] overflow-y-auto">
            <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">Navigation</p>
            <div className="flex flex-col gap-1">
              {[...PRIMARY_NAV, ...SECONDARY_NAV].map(n => (
                <NavLink
                  key={n.to + n.label}
                  to={n.to}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
                >
                  {n.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </header>

      {showWalletModal && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/75 p-3"
          role="dialog"
          aria-modal
          onClick={() => setShowWalletModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c0c14] p-4 shadow-2xl space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">MultiversX mainnet</p>
            <h2 className="display text-xl mb-1">Connecter le wallet</h2>
            <p className="text-[12px] text-zinc-500 leading-relaxed">
              Web Wallet recommandé sur GitHub Pages. xPortal via WalletConnect si le module se charge.
            </p>

            <button type="button" className="btn-primary w-full text-left" onClick={openWebWallet}>
              🌐 Web Wallet
              <span className="block text-[11px] font-normal opacity-80">
                wallet.multiversx.com — recommandé
              </span>
            </button>
            <button type="button" className="btn-secondary w-full text-left" onClick={openXPortalDeepLink}>
              📱 xPortal
              <span className="block text-[11px] font-normal text-zinc-400">WalletConnect mainnet</span>
            </button>
            <button type="button" className="btn-secondary w-full text-left" onClick={openExtension}>
              🦊 Extension
              <span className="block text-[11px] font-normal text-zinc-400">Navigateur</span>
            </button>

            <p className="text-[11px] text-zinc-600 pt-1">Ou coller erd1 — lecture seule</p>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white mono"
                placeholder="erd1…"
                value={manualAddr}
                onChange={e => setManualAddr(e.target.value)}
              />
              <button type="button" className="btn-secondary text-xs" onClick={submitManual}>
                Utiliser l’adresse
              </button>
            </div>

            {connectError && (
              <p className="text-[12px] text-amber-200/90 leading-relaxed">{connectError}</p>
            )}

            <button
              type="button"
              className="text-[12px] text-zinc-500 w-full text-center pt-1"
              onClick={() => setShowWalletModal(false)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </>
  )
}
