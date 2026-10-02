/** Top bar — wallet honesty + lang switcher. */
import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { loginWithXPortalMainnet } from '../lib/xportalWc'
import { requestOpenAssets } from '../lib/walletEvents'
import SideNav from './SideNav'
import LangSwitcher from './LangSwitcher'
import { useI18n } from '../i18n/I18nContext'

export default function Header() {
  const { t } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [connectError, setConnectError] = useState('')
  const [wcUri, setWcUri] = useState<string | null>(null)
  const [manualAddr, setManualAddr] = useState('')
  const [busy, setBusy] = useState(false)

  const { connected, shortAddress, connect, disconnect, address, method, sessionLive } = useWallet()
  const showAsConnected = connected && (method !== 'xportal' || sessionLive === true)

  const NAV = [
    { to: '/', label: t('nav.home') },
    { to: '/museum', label: t('nav.museum') },
    { to: '/marketplace', label: t('nav.market') },
    { to: '/slot', label: t('nav.slot') },
    { to: '/agents', label: t('nav.packs') },
  ]

  useEffect(() => {
    const onUri = (e: Event) => {
      const d = (e as CustomEvent).detail as { uri?: string }
      if (d?.uri) setWcUri(d.uri)
    }
    window.addEventListener('xartists-wc-uri', onUri)
    return () => window.removeEventListener('xartists-wc-uri', onUri)
  }, [])

  const doDisconnect = () => {
    disconnect()
    setShowWalletModal(false)
    setWcUri(null)
    setConnectError('')
  }

  const doXPortal = async () => {
    setBusy(true)
    setConnectError('xPortal…')
    setWcUri(null)
    try {
      const res = await loginWithXPortalMainnet(p => {
        if (p.uri) setWcUri(p.uri)
        if (p.message) setConnectError(p.message)
      })
      if (!res.ok) {
        setConnectError(res.error)
        setBusy(false)
        return
      }
      const linked = connect(res.address, 'xportal')
      if (!linked.ok) {
        setConnectError(linked.error || 'Session refused')
        setBusy(false)
        return
      }
      setShowWalletModal(false)
      setConnectError('')
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : 'xPortal error')
    } finally {
      setBusy(false)
    }
  }

  const doExtension = async () => {
    setBusy(true)
    setConnectError('')
    try {
      const w = window as unknown as { elrondWallet?: { getAddress?: () => Promise<string> } }
      if (!w.elrondWallet?.getAddress) {
        setConnectError('Extension missing')
        setBusy(false)
        return
      }
      const addr = await w.elrondWallet.getAddress()
      const res = connect(String(addr).trim(), 'defi_wallet')
      if (!res.ok) setConnectError(res.error || 'Fail')
      else setShowWalletModal(false)
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  const doPaste = () => {
    setConnectError('')
    if (!/^erd1[a-z0-9]{58}$/i.test(manualAddr.trim())) {
      setConnectError('erd1 invalid')
      return
    }
    const res = connect(manualAddr.trim(), 'paste_readonly')
    if (!res.ok) setConnectError(res.error || 'Fail')
    else setShowWalletModal(false)
  }

  const copyUri = async () => {
    if (!wcUri) return
    try {
      await navigator.clipboard.writeText(wcUri)
      setConnectError('URI copied')
    } catch {
      setConnectError('Copy failed')
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a12]/0.92] backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-3 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              className="md:hidden rounded-lg border border-white/10 p-2 text-zinc-300"
              onClick={() => setMenuOpen(true)}
              aria-label="Menu"
            >
              ☰
            </button>
            <Link to="/" className="flex items-center gap-2 min-w-0">
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-[11px] font-bold text-white">
                xA
              </span>
              <span className="hidden sm:inline text-sm font-semibold text-white truncate">xArtists</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-1 text-[12px]">
            {NAV.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `px-2.5 py-1 rounded-lg ${isActive ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <LangSwitcher />
            {showAsConnected ? (
              <>
                <button
                  type="button"
                  onClick={() => requestOpenAssets()}
                  className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 sm:px-3 py-1.5 text-[11px] text-emerald-100 max-w-[9rem] truncate"
                  title={address || ''}
                >
                  {shortAddress}
                </button>
                <button
                  type="button"
                  onClick={doDisconnect}
                  className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-rose-200"
                >
                  {t('common.disconnect')}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowWalletModal(true)
                  setConnectError('')
                  setWcUri(null)
                }}
                className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-1.5 text-[12px] font-semibold text-white"
              >
                {t('common.connect')}
              </button>
            )}
          </div>
        </div>
      </header>
      <SideNav open={menuOpen} onClose={() => setMenuOpen(false)} />
      {showWalletModal && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/80 p-3"
          onClick={() => !busy && setShowWalletModal(false)}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0c0c14] p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="display text-xl">{t('common.connect')}</h2>
            {wcUri && (
              <div className="space-y-2 rounded-xl border border-violet-500/20 p-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(wcUri)}`}
                  alt="QR"
                  className="mx-auto rounded-lg bg-white p-2"
                  width={200}
                  height={200}
                />
                <button type="button" className="btn-secondary text-xs w-full" onClick={() => void copyUri()}>
                  Copy URI
                </button>
              </div>
            )}
            <button type="button" className="btn-primary w-full text-sm" disabled={busy} onClick={() => void doXPortal()}>
              {busy ? '…' : 'xPortal mainnet'}
            </button>
            <button type="button" className="btn-secondary w-full text-sm" disabled={busy} onClick={() => void doExtension()}>
              Extension
            </button>
            <input
              value={manualAddr}
              onChange={e => setManualAddr(e.target.value)}
              placeholder="erd1…"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white mono"
            />
            <button type="button" className="btn-secondary w-full text-xs" onClick={doPaste}>
              Read-only
            </button>
            {connectError && <p className="text-[12px] text-amber-200/90">{connectError}</p>}
            <button type="button" className="text-[12px] text-zinc-500 w-full" onClick={() => !busy && setShowWalletModal(false)}>
              ×
            </button>
          </div>
        </div>
      )}
    </>
  )
}
