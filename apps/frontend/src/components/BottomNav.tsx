import { NavLink } from 'react-router-dom'

/** Soft-launch mobile nav — cœur produit. */
type NavItem = { to: string; label: string; icon: string; end?: boolean }

const ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: '◈', end: true },
  { to: '/agents', label: 'Packs', icon: '◎' },
  { to: '/museum', label: 'Musée', icon: '🏛' },
  { to: '/tours', label: 'Tours', icon: '◉' },
  { to: '/gallery', label: 'Galerie', icon: '▣' },
  { to: '/wallet', label: 'Wallet', icon: '◇' },
]

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
            end={!!end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-1.5 rounded-xl text-[10px] font-medium transition-all ${
                isActive
                  ? 'text-cyan-300 bg-violet-500/15'
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
