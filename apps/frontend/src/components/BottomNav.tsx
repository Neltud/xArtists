import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/', label: 'Home', icon: '◈', end: true },
  { to: '/museum', label: 'Galerie', icon: '🖼', end: false },
  { to: '/agents', label: 'Packs', icon: '◎', end: false },
  { to: '/tours', label: 'Tours', icon: '◉', end: false },
  { to: '/wallet', label: 'Wallet', icon: '◇', end: false },
] as const

export default function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/[0.06] glass"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Navigation principale"
    >
      <div className="grid grid-cols-5 gap-0.5 px-1.5 pt-1.5 pb-1">
        {ITEMS.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 rounded-2xl text-[10px] font-medium transition-all duration-300 ${
                isActive
                  ? 'text-cyan-300 bg-violet-500/20 shadow-[0_0_20px_-6px_rgba(139,92,246,0.5)]'
                  : 'text-zinc-500 active:bg-white/5'
              }`
            }
          >
            <span className="text-base leading-none" aria-hidden>
              {icon}
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
