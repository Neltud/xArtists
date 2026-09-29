/**
 * Menu lateral gauche → droite : toutes les pages.
 */
import { NavLink } from 'react-router-dom'
import { PRIMARY_NAV, SECONDARY_NAV } from '../config/links'

const EXTRA = [
  { to: '/venues', label: 'Comptes / Venues', emoji: '◎' },
  { to: '/lp', label: 'LP Pools', emoji: '💧' },
  { to: '/hatom', label: 'Hatom', emoji: '🌊' },
  { to: '/tip', label: 'Tip LIA', emoji: '✦' },
  { to: '/burnify', label: 'Burnify', emoji: '🔥' },
  { to: '/ads', label: 'Ads', emoji: '📢' },
  { to: '/sitemap', label: 'Plan du site', emoji: '🗺' },
  { to: '/demo', label: 'Demo tour', emoji: '▶' },
]

export default function SideNav({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  if (!open) return null

  const sections = [
    { title: 'Principal', items: PRIMARY_NAV },
    { title: 'Protocol', items: SECONDARY_NAV },
    { title: 'Plus', items: EXTRA },
  ]

  return (
    <div className="fixed inset-0 z-[85] flex" role="dialog" aria-modal aria-label="Menu navigation">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Fermer le menu"
        onClick={onClose}
      />
      <aside
        className="relative z-10 h-full w-[min(100%,20rem)] border-r border-white/10 bg-[#0a0a12]/98 shadow-2xl flex flex-col"
        style={{ animation: 'xartists-slide-in-left 0.22s ease-out' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-violet-300/80 font-semibold">
              Navigation
            </p>
            <p className="text-sm text-white font-medium">xArtists</p>
          </div>
          <button type="button" className="btn-secondary text-xs py-1 px-2" onClick={onClose}>
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {sections.map(sec => (
            <div key={sec.title}>
              <p className="px-2 mb-1.5 text-[10px] uppercase tracking-wider text-zinc-600 font-semibold">
                {sec.title}
              </p>
              <ul className="space-y-0.5">
                {sec.items.map(item => (
                  <li key={item.to + item.label}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
                          isActive
                            ? 'bg-violet-500/20 text-white border border-violet-400/30'
                            : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent'
                        }`
                      }
                    >
                      <span className="text-base w-5 text-center opacity-80" aria-hidden>
                        {item.emoji}
                      </span>
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <p className="px-4 py-3 text-[10px] text-zinc-600 border-t border-white/5">
          MultiversX mainnet · fail-closed CODEHASH
        </p>
      </aside>
      <style>{`
        @keyframes xartists-slide-in-left {
          from { transform: translateX(-100%); opacity: 0.6; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
