/**
 * Header — menu, wallet, i18n · graphite + acid green.
 */
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect, requestOpenAssets } from '../lib/walletEvents'
import { useI18n } from '../i18n/I18nContext'
import { isPitchMode, setPitchMode, syncPitchModeClass } from '../lib/pitchMode'
import { primaryNavRoutes } from '../config/routeRegistry'
import LangSwitcher from './LangSwitcher'
import SideNav from './SideNav'
import LoginModal from './LoginModal'
import NetworkBadge from './ui/NetworkBadge'

export default function Header() {
  const { t } = useI18n()
  const { connected, shortAddress, disconnect, address, method, sessionLive } = useWallet()
  const [menuOpen, setMenuOpen] = useState(false)
  const [pitch, setPitch] = useState(() => isPitchMode())

  useEffect(() => {
    syncPitchModeClass()
  }, [])

  const live = connected && (method !== 'xportal' || sessionLive === true)

  const topNav = primaryNavRoutes().map(r => ({
    to: r.path,
    label: t(r.labelKey),
    end: r.path === '/',
  }))

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
          background: 'rgba(16, 18, 15, 0.92)',
        }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition"
              style={{ borderColor: 'var(--xa-border)', background: 'rgba(255,255,255,0.03)', color: 'var(--xa-text)' }}
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
                style={{ background: 'var(--xa-accent)', color: '#10120f' }}
              >
                xA
              </span>
              <span
                className="hidden truncate text-sm font-semibold tracking-tight sm:inline"
                style={{ color: 'var(--xa-text)' }}
              >
                xArtists
              </span>
            </Link>
            <NetworkBadge className="hidden sm:inline-flex" />
          </div>

          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Navigation">
            {topNav.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-[12px] font-medium transition min-h-[40px] inline-flex items-center ${
                    isActive
                      ? 'text-[var(--xa-bg)]'
                      : 'text-[var(--xa-text-muted)] hover:text-[var(--xa-text)] hover:bg-white/5'
                  }`
                }
                style={({ isActive }) =>
                  isActive ? { background: 'var(--xa-accent)' } : undefined
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
              className={`hidden sm:inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition min-h-[36px] ${
                pitch
                  ? 'border-[var(--xa-accent)] bg-[var(--xa-accent-soft)] text-[var(--xa-accent)]'
                  : 'border-[var(--xa-border)] text-[var(--xa-text-muted)]'
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
                  className="hidden sm:inline-flex max-w-[9rem] truncate rounded-full border px-2.5 py-1 text-[11px] font-medium min-h-[36px]"
                  style={{
                    borderColor: 'var(--xa-border)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--xa-text)',
                  }}
                  title={address || ''}
                >
                  {live ? '\u25cf' : '\u25cb'} {shortAddress}
                </button>
                <button
                  type="button"
                  onClick={() => void disconnect()}
                  className="btn-secondary text-[11px] min-h-[40px] px-2"
                >
                  {t('common.disconnect')}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={requestOpenConnect}
                className="btn-primary text-[11px] min-h-[40px] px-3"
              >
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
