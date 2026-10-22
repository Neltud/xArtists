import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
import { NavLink } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

/** 4 hubs canoniques — Accueil / Packs / Market / Museum */
export default function BottomNav() {
  const { t } = useI18n()
  const items = [
    { to: '/', label: t('nav.home'), icon: '\u25c8', end: true },
    { to: '/agents', label: t('nav.packs'), icon: '\u2726', end: false },
    { to: '/market', label: t('nav.market'), icon: '\u25c7', end: false },
    { to: '/museum', label: t('nav.museum'), icon: '\ud83d\uddbc', end: false },
  ] as const

  return (
    <nav
      className="hud-bottom-nav fixed inset-x-0 bottom-0 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label={t('nav.home')}
    >
      <div className="grid grid-cols-4 gap-0.5 px-1.5 pb-1 pt-1.5">
        {xaRender(items.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `hud-nav-item flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-2xl py-2 text-[11px] font-semibold tracking-wide transition active:scale-95 ${
                isActive ? 'hud-nav-item-active' : 'active:bg-white/5'
              }`
            }
          >
            <span
              className="hud-nav-icon text-base leading-none flex h-8 w-8 items-center justify-center rounded-xl"
              aria-hidden
            >
              {xaRender(icon)}
            </span>
            <span className="truncate max-w-full px-0.5">{xaRender(label)}</span>
          </NavLink>
        )))}
      </div>
    </nav>
  )
}
