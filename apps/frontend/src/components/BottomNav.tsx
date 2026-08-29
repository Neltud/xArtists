import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/', label: 'Home', icon: '◈', end: true },
  { to: '/marketplace', label: 'Market', icon: '▣' },
  { to: '/agents', label: 'Agents', icon: '◎' },
  { to: '/trading', label: 'Trade', icon: '⚡' },
  { to: '/tours', label: 'Tours', icon: '◉' },
  { to: '/wallet', label: 'Wallet', icon: '◇' },
] as const

export default function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/[0.08] glass"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Navigation principale"
    >
      <div className="grid grid-cols-6 gap-0.5 px-1 pt-1.5 pb-1">
        {ITEMS.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-1.5 rounded-xl text-[10px] font-medium transition-all ${
                isActive
                  ? 'text-cyan-300 bg-violet-500/15'
                  : 'text-zinc-500 active:bg-white/5'
              }`
            }
          >
            <span className="text-base leading-none">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
