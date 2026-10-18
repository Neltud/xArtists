/**
 * Header produit — menu, wallet, i18n, Mode Pitch B2B.
 * Style protocol (soul-aligned): sobre, contrasté, peu de glow.
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

  const topNav = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/agents', label: t('nav.packs') },
    { to: '/market', label: t('nav.market') },
    { to: '/museum', label: t('nav.museum') },
    { to: '/sale', label: t('sale.title') },
  ]

  const togglePitch = () => {
    const next = !pitch
    setPitchMode(next)
    setPitch(next)
  }

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{
          borderColor: 'var(--xa-border)',
          background: 'rgba(10, 10, 15, 0.92)',
        }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-zinc-100 transition"
              style={{ borderColor: 'var(--xa-border)', background: 'rgba(255,255,255,0.03)' }}
              aria-label="Menu"
              onClick={() => setMenuOpen(true)}
            >
              <span className="text-lg leading-none" aria-hidden>
                ☰
              </span>
            </button>
            <Link to="/" className="flex min-w-0 items-center gap-2">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{ background: 'var(--xa-text)', color: 'var(--xa-bg)' }}
              >
                xA
              </span>
              <span className="hidden truncate text-sm font-semibold tracking-tight sm:inline" style={{ color: 'var(--xa-text)' }}>
                xArtists
              </span>
            </Link>
          </div>

          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Navigation">
            {topNav.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
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
              title={pitch ? 'Pitch off' : 'Pitch on'}
              className={`hidden sm:inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
                pitch
                  ? 'border-amber-400/40 bg-amber-500/10 text-amber-100'
                  : 'border-white/10 text-zinc-400 hover:border-white/20'
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
                  className="hidden sm:inline-flex max-w-[9rem] truncate rounded-full border px-2.5 py-1 text-[11px] font-medium text-zinc-200"
                  style={{ borderColor: 'var(--xa-border)', background: 'rgba(255,255,255,0.03)' }}
                  title={address || ''}
                >
                  {live ? '\u25cf' : '\u25cb'} {shortAddress}
                </button>
                <button type="button" onClick={() => void disconnect()} className="btn-secondary text-[11px] min-h-[36px] px-2">
                  {t('common.disconnect')}
                </button>
              </>
            ) : (
              <button type="button" onClick={requestOpenConnect} className="btn-primary text-[11px] min-h-[36px] px-3">
                {t('common.connect')}
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
