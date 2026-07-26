import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/', label: 'Home', emoji: '📊', end: true },
  { to: '/agents', label: 'Agents', emoji: '🧠' },
  { to: '/trading', label: 'Trade', emoji: '⚡' },
  { to: '/wallet', label: 'Wallet', emoji: '👛' },
  { to: '/marketplace', label: 'Art', emoji: '🎨' },
]

export default function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-[#2a2a3a]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch justify-around h-16 max-w-lg mx-auto">
        {ITEMS.map(({ to, label, emoji, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-purple-400' : 'text-gray-500'
              }`
            }
          >
            <span className="text-xl leading-none">{emoji}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
