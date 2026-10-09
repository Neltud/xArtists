import { NavLink } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

export default function BottomNav() {
  const { t } = useI18n()
  const items = [
    { to: '/', label: t('nav.home'), icon: '◈', end: true },
    { to: '/museum', label: t('nav.museum'), icon: '🖼', end: false },
    { to: '/marketplace', label: t('nav.market'), icon: '◇', end: false },
    { to: '/slot', label: t('nav.slot'), icon: '✦', end: false },
    { to: '/agents', label: t('nav.packs'), icon: '◎', end: false },
  ] as const

  return (
    <nav
      className="hud-bottom-nav fixed inset-x-0 bottom-0 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Navigation principale"
    >
      <div className="grid grid-cols-5 gap-0.5 px-1.5 pb-1 pt-1.5">
        {items.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `hud-nav-item flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[10px] font-medium transition active:scale-95 ${
                isActive ? 'hud-nav-item-active' : 'text-zinc-500 active:bg-white/5'
              }`
            }
          >
            <span
              className="hud-nav-icon text-base leading-none flex h-8 w-8 items-center justify-center rounded-xl"
              aria-hidden
            >
              {icon}
            </span>
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
