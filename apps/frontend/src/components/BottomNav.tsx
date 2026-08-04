import { NavLink } from 'react-router-dom'

/** Mobile bottom bar — DAO + Galerie accessibles (manquaient vs desktop PRIMARY_NAV) */
const ITEMS = [
  { to: '/', label: 'Home', emoji: '📊', end: true },
  { to: '/gallery', label: 'Galerie', emoji: '🖼️' },
  { to: '/marketplace', label: 'Market', emoji: '🛒' },
  { to: '/dao', label: 'DAO', emoji: '🗳️' },
  { to: '/wallet', label: 'Wallet', emoji: '👛' },
]

export default function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-[#2a2a3a]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Navigation principale mobile"
    >
      <div className="flex items-stretch justify-around h-14 sm:h-16 max-w-lg mx-auto">
        {ITEMS.map(({ to, label, emoji, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium transition-colors touch-manipulation min-h-[44px] ${
                isActive ? 'text-purple-400' : 'text-gray-500'
              }`
            }
          >
            <span className="text-lg sm:text-xl leading-none" aria-hidden>
              {emoji}
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
