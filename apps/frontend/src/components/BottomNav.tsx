import { NavLink } from 'react-router-dom'

/**
 * Mobile: KPI rétention = Studio mint · Market buy/sell · $TRO · DAO (module séparé).
 * 6 onglets compacts + safe-area.
 */
const ITEMS = [
  { to: '/', label: 'Home', emoji: '📊', end: true },
  { to: '/studio', label: 'Studio', emoji: '🎨' },
  { to: '/marketplace', label: 'Market', emoji: '🛒' },
  { to: '/tro', label: '$TRO', emoji: '🪙' },
  { to: '/dao', label: 'DAO', emoji: '🗳️' },
  { to: '/wallet', label: 'Wallet', emoji: '👛' },
]

export default function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-[#2a2a3a]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Navigation mobile"
    >
      <div className="flex items-stretch justify-around h-14 max-w-xl mx-auto px-0.5">
        {ITEMS.map(({ to, label, emoji, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 gap-0.5 text-[9px] sm:text-[10px] font-medium transition-colors touch-manipulation min-h-[44px] min-w-0 ${
                isActive ? 'text-purple-400' : 'text-gray-500'
              }`
            }
          >
            <span className="text-base sm:text-lg leading-none" aria-hidden>
              {emoji}
            </span>
            <span className="truncate max-w-full">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
