import { NavLink } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

export default function BottomNav() {
  const { t } = useI18n()
  const items = [
    { to: '/', label: t('nav.home'), icon: '\u25c8', end: true },
    { to: '/museum', label: t('nav.museum'), icon: '\ud83d\uddbc', end: false },
    { to: '/marketplace', label: t('nav.market'), icon: '\u25c7', end: false },
    { to: '/slot', label: t('nav.slot'), icon: '\u2726', end: false },
    { to: '/agents', label: t('nav.packs'), icon: '\u25ce', end: false },
  ] as const

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.07] bg-[#07070c]/92 backdrop-blur-xl md:hidden"
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
              `flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[10px] font-medium transition ${
                isActive
                  ? 'bg-violet-500/15 text-violet-100 shadow-[0_0_20px_-6px_rgba(139,92,246,0.45)]'
                  : 'text-zinc-500 active:bg-white/5'
              }`
            }
          >
            <span className="text-base leading-none" aria-hidden>
              {icon}
            </span>
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
