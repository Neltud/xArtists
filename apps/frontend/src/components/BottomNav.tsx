import { NavLink } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import { mobileNavRoutes } from '../config/routeRegistry'

/** Mobile hubs — explore / packs / market / museum / wallet */
export default function BottomNav() {
  const { t } = useI18n()
  const items = mobileNavRoutes().map(r => ({
    to: r.path,
    label: t(r.labelKey),
    end: r.path === '/',
  }))

  // Ensure max 5 for touch targets
  const shown = items.slice(0, 5)

  return (
    <nav
      className="hud-bottom-nav fixed inset-x-0 bottom-0 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label={t('nav.home')}
    >
      <div
        className="grid gap-0.5 px-1.5 pb-1 pt-1.5"
        style={{ gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))` }}
      >
        {shown.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `hud-nav-item flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl py-2 text-[11px] font-semibold tracking-wide transition active:scale-95 ${
                isActive ? 'hud-nav-item-active' : 'active:bg-white/5'
              }`
            }
          >
            <span className="truncate max-w-full px-0.5">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
