/**
 * Menu latéral — ordre logique · pas de routes mortes.
 */
import { NavLink } from 'react-router-dom'
import { PRIMARY_NAV, SECONDARY_NAV } from '../config/links'
import { useWallet } from '../context/WalletContext'
import { clearXPortalSession } from '../lib/xportalWc'
import { requestOpenConnect } from '../lib/walletEvents'

export default function SideNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { connected, shortAddress, method, disconnect } = useWallet()

  if (!open) return null

  const sections = [
    { title: 'Explorer', items: PRIMARY_NAV },
    { title: 'Protocole', items: SECONDARY_NAV },
  ]

  const doDisconnect = () => {
    clearXPortalSession()
    disconnect()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[85] flex" role="dialog" aria-modal aria-label="Menu navigation">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />
      <aside
        className="relative z-10 h-full w-[min(100%,19rem)] border-r border-white/10 bg-[#0a0a12]/98 shadow-2xl flex flex-col animate-[xartists-slide-in-left_0.22s_ease-out]"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-violet-300/80 font-semibold">Menu</p>
            <p className="text-sm text-white font-medium">xArtists</p>
          </div>
          <button type="button" className="btn-secondary text-xs py-1 px-2" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="px-3 py-3 border-b border-white/5 space-y-2">
          {connected ? (
            <>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Wallet</p>
              <p className="text-[12px] mono text-emerald-300/90">{shortAddress || '…'}</p>
              <p className="text-[10px] text-zinc-600">{method || 'session'}</p>
              <button type="button" className="btn-secondary text-xs w-full" onClick={doDisconnect}>
                Disconnect
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-primary text-sm w-full"
              onClick={() => {
                requestOpenConnect()
                onClose()
              }}
            >
              Connecter
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {sections.map(sec => (
            <div key={sec.title}>
              <p className="px-2 mb-1.5 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                {sec.title}
              </p>
              <ul className="space-y-0.5">
                {sec.items.map(item => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] transition ${
                          isActive
                            ? 'bg-violet-500/20 text-white border border-violet-400/30'
                            : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent'
                        }`
                      }
                    >
                      <span className="text-base leading-none w-5 text-center" aria-hidden>
                        {item.emoji}
                      </span>
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <p className="px-4 py-3 text-[10px] text-zinc-600 border-t border-white/5">
          Mainnet MultiversX · pas un fond d&apos;investissement
        </p>
      </aside>
    </div>
  )
}
