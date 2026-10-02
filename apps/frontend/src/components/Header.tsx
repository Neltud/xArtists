/**
 * Header produit — menu toujours accessible, wallet clair, i18n.
 */
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { loginWithXPortalMainnet } from '../lib/xportalWc'
import { OPEN_CONNECT_EVENT, requestOpenAssets } from '../lib/walletEvents'
import { useI18n } from '../i18n/I18nContext'
import LangSwitcher from './LangSwitcher'
import SideNav from './SideNav'

export default function Header() {
  const { t } = useI18n()
  const { connected, shortAddress, connect, disconnect, address, method, sessionLive } = useWallet()

  const [menuOpen, setMenuOpen] = useState(false)
  const [walletOpen, setWalletOpen] = useState(false)
  const [error, setError] = useState('')
  const [wcUri, setWcUri] = useState<string | null>(null)
  const [manual, setManual] = useState('')
  const [busy, setBusy] = useState(false)

  const live = connected && (method !== 'xportal' || sessionLive === true)

  const topNav = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/museum', label: t('nav.museum') },
    { to: '/marketplace', label: t('nav.market') },
    { to: '/agents', label: t('nav.packs') },
    { to: '/slot', label: t('nav.slot') },
  ]

  useEffect(() => {
    const open = () => {
      setWalletOpen(true)
      setError('')
      setWcUri(null)
    }
    window.addEventListener(OPEN_CONNECT_EVENT, open)
    return () => window.removeEventListener(OPEN_CONNECT_EVENT, open)
  }, [])

  useEffect(() => {
    const onUri = (e: Event) => {
      const u = (e as CustomEvent).detail?.uri
      if (typeof u === 'string') setWcUri(u)
    }
    window.addEventListener('xartists-wc-uri', onUri)
    return () => window.removeEventListener('xartists-wc-uri', onUri)
  }, [])

  const closeWallet = () => {
    if (busy) return
    setWalletOpen(false)
    setError('')
    setWcUri(null)
  }

  const runXPortal = async () => {
    setBusy(true)
    setError('xPortal…')
    setWcUri(null)
    try {
      const res = await loginWithXPortalMainnet(p => {
        if (p.uri) setWcUri(p.uri)
        if (p.message) setError(p.message)
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      const linked = connect(res.address, 'xportal')
      if (!linked.ok) {
        setError(linked.error || 'Session refusée')
        return
      }
      setWalletOpen(false)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur xPortal')
    } finally {
      setBusy(false)
    }
  }

  const runExtension = async () => {
    setBusy(true)
    setError('')
    try {
      const w = window as unknown as { elrondWallet?: { getAddress?: () => Promise<string> } }
      if (!w.elrondWallet?.getAddress) {
        setError('Extension MultiversX introuvable')
        return
      }
      const addr = await w.elrondWallet.getAddress()
      const r = connect(String(addr).trim(), 'defi_wallet')
      if (!r.ok) setError(r.error || 'Échec')
      else setWalletOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  const runPaste = () => {
    setError('')
    if (!/^erd1[a-z0-9]{58}$/i.test(manual.trim())) {
      setError('Adresse erd1 invalide')
      return
    }
    const r = connect(manual.trim(), 'paste_readonly')
    if (!r.ok) setError(r.error || 'Échec')
    else setWalletOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07070c]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] text-zinc-100 transition hover:bg-white/[0.08]"
              aria-label="Ouvrir le menu"
              onClick={() => setMenuOpen(true)}
            >
              <span className="text-lg leading-none" aria-hidden>
                ☰
              </span>
            </button>
            <Link to="/" className="flex min-w-0 items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-[11px] font-bold text-white shadow-[0_0_24px_-6px_rgba(139,92,246,0.7)]">
                xA
              </span>
              <span className="hidden truncate text-sm font-semibold tracking-tight text-white sm:inline">
                xArtists
              </span>
            </Link>
          </div>

          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Navigation rapide">
            {topNav.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${
                    isActive ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <LangSwitcher />
            {live ? (
              <>
                <button
                  type="button"
                  title={address || ''}
                  onClick={() => requestOpenAssets()}
                  className="max-w-[8.5rem] truncate rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-100 sm:max-w-none"
                >
                  {shortAddress}
                </button>
                <button
                  type="button"
                  onClick={() => disconnect()}
                  className="rounded-full border border-rose-400/35 bg-rose-500/10 px-3 py-1.5 text-[11px] font-semibold text-rose-100 hover:bg-rose-500/20"
                >
                  {t('common.disconnect')}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setWalletOpen(true)
                  setError('')
                  setWcUri(null)
                }}
                className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow-lg shadow-violet-900/30"
              >
                {t('common.connect')}
              </button>
            )}
          </div>
        </div>
      </header>

      <SideNav open={menuOpen} onClose={() => setMenuOpen(false)} />

      {walletOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center"
          onClick={closeWallet}
          role="presentation"
        >
          <div
            className="w-full max-w-md space-y-4 rounded-2xl border border-white/12 bg-[#0c0c14] p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal
            aria-label={t('common.connect')}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">{t('common.connect')}</h2>
                <p className="mt-1 text-[12px] text-zinc-500">
                  xPortal recommandé pour signer sur mainnet.
                </p>
              </div>
              <button type="button" className="btn-secondary px-2 py-1 text-xs" onClick={closeWallet}>
                ×
              </button>
            </div>

            {wcUri && (
              <div className="space-y-2 rounded-xl border border-violet-500/25 bg-violet-500/5 p-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(wcUri)}`}
                  alt="QR WalletConnect"
                  width={200}
                  height={200}
                  className="mx-auto rounded-lg bg-white p-2"
                />
              </div>
            )}

            <button type="button" className="btn-primary w-full" disabled={busy} onClick={() => void runXPortal()}>
              {busy ? 'En attente…' : 'xPortal mainnet'}
            </button>
            <button type="button" className="btn-secondary w-full" disabled={busy} onClick={() => void runExtension()}>
              Extension DeFi Wallet
            </button>
            <div className="space-y-2 border-t border-white/10 pt-3">
              <p className="text-[11px] text-zinc-600">Lecture seule — coller erd1</p>
              <input
                value={manual}
                onChange={e => setManual(e.target.value)}
                placeholder="erd1…"
                className="mono w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-violet-400/40"
              />
              <button type="button" className="btn-secondary w-full text-xs" onClick={runPaste}>
                Lecture seule
              </button>
            </div>
            {error && <p className="text-[12px] leading-relaxed text-amber-200/90">{error}</p>}
          </div>
        </div>
      )}
    </>
  )
}
