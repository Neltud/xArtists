/**
 * Header produit — menu, wallet, i18n, Mode Pitch B2B.
 * Hubs canoniques uniquement (pas de Slot/Casino).
 */
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect, requestOpenAssets } from '../lib/walletEvents'
import { useI18n } from '../i18n/I18nContext'
import { isPitchMode, setPitchMode, syncPitchModeClass } from '../lib/pitchMode'
import LangSwitcher from './LangSwitcher'
import SideNav from './SideNav'
import LoginModal from './LoginModal'

export default function Header() {
  const { t } = useI18n()
  const { connected, shortAddress, disconnect, address, method, sessionLive } = useWallet()
  const [menuOpen, setMenuOpen] = useState(false)
  const [pitch, setPitch] = useState(() => isPitchMode())

  useEffect(() => {
    syncPitchModeClass()
  }, [])

  const live = connected && (method !== 'xportal' || sessionLive === true)

  /** 4 hubs canoniques — Accueil / Packs / Market / Museum */
  const topNav = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/agents', label: t('nav.packs') },
    { to: '/market', label: t('nav.market') },
    { to: '/museum', label: t('nav.museum') },
  ]

  const togglePitch = () => {
    const next = !pitch
    setPitchMode(next)
    setPitch(next)
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
            <button
              type="button"
              onClick={togglePitch}
              title={pitch ? 'Désactiver le mode pitch' : 'Activer le mode pitch (démo B2B)'}
              className={`hidden sm:inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
                pitch
                  ? 'border-amber-400/45 bg-amber-500/15 text-amber-100'
                  : 'border-white/12 text-zinc-400 hover:border-white/20'
              }`}
            >
              Pitch
            </button>
            <LangSwitcher />
            {connected ? (
              <>
                <button
                  type="button"
                  onClick={() => requestOpenAssets()}
                  className="hidden sm:inline-flex max-w-[9rem] truncate rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-zinc-200"
                  title={address || ''}
                >
                  {live ? '\u25cf' : '\u25cb'} {shortAddress}
                </button>
                <button type="button" onClick={() => void disconnect()} className="btn-secondary text-[11px] min-h-[36px] px-2">
                  {t('nav.disconnect') || 'Out'}
                </button>
              </>
            ) : (
              <button type="button" onClick={requestOpenConnect} className="btn-primary text-[11px] min-h-[36px] px-3">
                {t('nav.wallet')}
              </button>
            )}
          </div>
        </div>
      </header>
      <SideNav open={menuOpen} onClose={() => setMenuOpen(false)} />
      <LoginModal />
    </>
  )
}
