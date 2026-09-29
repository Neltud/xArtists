import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { LINKS, PRIMARY_NAV } from '../config/links'
import { OPEN_CONNECT_EVENT, requestOpenAssets } from '../lib/walletEvents'
import { loginWithXPortalMainnet } from '../lib/xportalWc'
import SideNav from './SideNav'

function isValidErd(addr: string): boolean {
  return /^erd1[a-z0-9]{58}$/i.test(addr.trim())
}

function getCallbackUrl(): string {
  if (typeof window === 'undefined') return LINKS.dapp
  return `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, '/') || '/xArtists/'}`
}

function qrUrl(data: string, size = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(data)}`
}

const DESKTOP_NAV = PRIMARY_NAV.filter(n =>
  ['/', '/museum', '/agents', '/tours', '/wallet', '/marketplace'].includes(n.to),
)

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [manualAddr, setManualAddr] = useState('')
  const [connectError, setConnectError] = useState('')
  const [wcUri, setWcUri] = useState<string | null>(null)
  const [wcWaiting, setWcWaiting] = useState(false)
  const { connected, shortAddress, connect, disconnect, address, method } = useWallet()
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (menuOpen || showWalletModal) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen, showWalletModal])

  useEffect(() => {
    const open = () => {
      setShowWalletModal(true)
      setConnectError('')
      setWcUri(null)
      setWcWaiting(false)
    }
    window.addEventListener(OPEN_CONNECT_EVENT, open)
    return () => window.removeEventListener(OPEN_CONNECT_EVENT, open)
  }, [])

  const closeModal = () => {
    setShowWalletModal(false)
    setWcUri(null)
    setWcWaiting(false)
    setConnectError('')
  }

  const openWebWallet = () => {
    window.location.href = LINKS.walletLogin(getCallbackUrl())
  }

  const openXPortalDeepLink = async () => {
    setConnectError('')
    setWcUri(null)
    setWcWaiting(true)
    setConnectError('Connexion xPortal — scanne le QR ou ouvre l app…')
    try {
      const res = await loginWithXPortalMainnet(p => {
        if (p.uri) setWcUri(p.uri)
        if (p.message) setConnectError(p.message)
        if (p.phase === 'waiting') setWcWaiting(true)
        if (p.phase === 'done' || p.phase === 'error') setWcWaiting(false)
      })
      if (!res.ok) {
        setWcWaiting(false)
        setConnectError(res.error + ' — Web Wallet reste disponible.')
        return
      }
      const linked = connect(res.address, 'xportal')
      if (!linked.ok) {
        setConnectError(linked.error || 'Session refusee')
        setWcWaiting(false)
      } else {
        closeModal()
      }
    } catch (e) {
      setWcWaiting(false)
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
      const res = connect(String(addr).trim(), 'defi_wallet')
      if (!res.ok) setConnectError(res.error || 'Connexion echouee')
      else closeModal()
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
    const res = connect(manualAddr.trim(), 'paste_readonly')
    if (!res.ok) setConnectError(res.error || 'Echec')
    else {
      closeModal()
      setManualAddr('')
    }
  }

  const copyUri = async () => {
    if (!wcUri) return
    try {
      await navigator.clipboard.writeText(wcUri)
      setConnectError('URI WalletConnect copiee — colle dans xPortal si besoin.')
    } catch {
      setConnectError('Copie impossible — scanne le QR.')
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-3 sm:px-4">
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="rounded-lg border border-white/10 p-2 text-white hover:bg-white/5"
              aria-label="Ouvrir le menu"
              onClick={() => setMenuOpen(true)}
            >
              ☰
            </button>
            <NavLink to="/" className="flex items-center gap-2" aria-label="Accueil">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-sm font-bold text-white">
                xA
              </span>
              <span className="hidden sm:inline text-sm font-semibold text-white">xArtists</span>
            </NavLink>
          </div>

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
                  setWcUri(null)
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
          </div>
        </div>
      </header>

      <SideNav open={menuOpen} onClose={() => setMenuOpen(false)} />

      {showWalletModal && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/75 p-3"
          role="dialog"
          aria-modal
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c0c14] p-4 shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">MultiversX mainnet</p>
            <h2 className="display text-xl mb-1">Connecter le wallet</h2>
            <p className="text-[12px] text-zinc-500 leading-relaxed">
              Web Wallet recommande. xPortal : QR sur ecran (desktop) ou app mobile.
            </p>

            {wcUri && (
              <div className="rounded-xl border border-violet-500/30 bg-violet-950/30 p-4 space-y-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-200">
                  Scanne avec xPortal
                </p>
                <img
                  src={qrUrl(wcUri)}
                  alt="QR WalletConnect xPortal"
                  width={220}
                  height={220}
                  className="mx-auto rounded-lg bg-white p-2"
                />
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Ouvre xPortal → Scan QR (ou WalletConnect) sur ton telephone.
                  Laisse cette fenetre ouverte jusqu a l approbation.
                </p>
                <button type="button" className="btn-secondary text-xs w-full" onClick={copyUri}>
                  Copier l URI WalletConnect
                </button>
                {wcWaiting && (
                  <p className="text-[11px] text-amber-200/90 animate-pulse">
                    En attente d approbation dans xPortal…
                  </p>
                )}
              </div>
            )}

            {!wcUri && (
              <>
                <button type="button" className="btn-primary w-full text-left" onClick={openWebWallet}>
                  Web Wallet
                  <span className="block text-[11px] font-normal opacity-80">
                    wallet.multiversx.com — recommande
                  </span>
                </button>
                <button
                  type="button"
                  className="btn-secondary w-full text-left"
                  onClick={openXPortalDeepLink}
                  disabled={wcWaiting}
                >
                  xPortal
                  <span className="block text-[11px] font-normal text-zinc-400">
                    QR code + WalletConnect mainnet
                  </span>
                </button>
                <button type="button" className="btn-secondary w-full text-left" onClick={openExtension}>
                  Extension
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
                    Utiliser l adresse
                  </button>
                </div>
              </>
            )}

            {connectError && (
              <p className="text-[12px] text-amber-200/90 leading-relaxed">{connectError}</p>
            )}

            <button
              type="button"
              className="text-[12px] text-zinc-500 w-full text-center pt-1"
              onClick={closeModal}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </>
  )
}
