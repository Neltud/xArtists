/**
 * Header produit — menu, wallet, i18n. Connexion via LoginModal.
 */
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect, requestOpenAssets } from '../lib/walletEvents'
import { useI18n } from '../i18n/I18nContext'
import LangSwitcher from './LangSwitcher'
import SideNav from './SideNav'
import LoginModal from './LoginModal'

export default function Header() {
  const { t } = useI18n()
  const { connected, shortAddress, disconnect, address, method, sessionLive } = useWallet()
  const [menuOpen, setMenuOpen] = useState(false)

  const live = connected && (method !== 'xportal' || sessionLive === true)

  const topNav = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/museum', label: t('nav.museum') },
    { to: '/marketplace', label: t('nav.market') },
    { to: '/agents', label: t('nav.packs') },
    { to: '/slot', label: t('nav.slot') },
  ]

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
                onClick={() => requestOpenConnect()}
                className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow-lg shadow-violet-900/30"
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
