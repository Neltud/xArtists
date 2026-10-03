/**
 * Menu — Principal (cœur) + Compte + Infos. Labs hors menu pour éviter la confusion.
 */
import { NavLink } from 'react-router-dom'
import { PRIMARY_NAV, SECONDARY_NAV } from '../config/links'
import { useWallet } from '../context/WalletContext'
import { clearXPortalSession } from '../lib/xportalWc'
import { requestOpenConnect } from '../lib/walletEvents'
import { useI18n } from '../i18n/I18nContext'

const ACCOUNT = ['/wallet', '/portfolio', '/my-packs', '/command-center']
const INFO = ['/legal', '/go-live', '/sitemap']

export default function SideNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const { connected, shortAddress, method, disconnect } = useWallet()

  if (!open) return null

  const main = PRIMARY_NAV.filter(i => !ACCOUNT.includes(i.to))
  const account = [
    ...PRIMARY_NAV.filter(i => ACCOUNT.includes(i.to)),
    ...SECONDARY_NAV.filter(i => ACCOUNT.includes(i.to)),
  ]
  const more = SECONDARY_NAV.filter(i => !ACCOUNT.includes(i.to) && INFO.includes(i.to))
  const protocol = SECONDARY_NAV.filter(
    i => !ACCOUNT.includes(i.to) && !INFO.includes(i.to),
  )

  const sections = [
    { title: 'Principal', items: main },
    { title: 'Compte', items: account },
    { title: 'On-chain', items: protocol },
    { title: 'Infos', items: more },
  ].filter(s => s.items.length > 0)

  return (
    <div className="fixed inset-0 z-[85] flex" role="dialog" aria-modal aria-label="Menu">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-[min(100%,19.5rem)] flex-col border-r border-white/10 bg-[#0a0a12]/98 shadow-2xl animate-[xartists-slide-in-left_0.22s_ease-out]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300/90">
              Menu
            </p>
            <p className="text-sm font-medium text-white">xArtists</p>
          </div>
          <button type="button" className="btn-secondary px-2 py-1 text-xs active:scale-95" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="space-y-2 border-b border-white/5 px-3 py-3">
          {connected ? (
            <>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Wallet</p>
              <p className="mono text-[12px] text-emerald-300/90">{shortAddress || '…'}</p>
              <p className="text-[10px] text-zinc-600">{method === 'xportal' ? 'xPortal' : method || 'session'}</p>
              <button
                type="button"
                className="btn-secondary w-full text-xs active:scale-95"
                onClick={() => {
                  clearXPortalSession()
                  disconnect()
                  onClose()
                }}
              >
                {t('common.disconnect')}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-primary w-full text-sm active:scale-95"
              onClick={() => {
                requestOpenConnect()
                onClose()
              }}
            >
              {t('common.connect')}
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
          {sections.map(sec => (
            <div key={sec.title}>
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
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
                        `flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[13px] transition active:scale-[0.98] ${
                          isActive
                            ? 'border-violet-400/35 bg-violet-500/20 text-white'
                            : 'border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                        }`
                      }
                    >
                      <span className="w-5 text-center text-base leading-none" aria-hidden>
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

        <p className="border-t border-white/5 px-4 py-3 text-[10px] text-zinc-600">
          Mainnet MultiversX · pas un fond d&apos;investissement
        </p>
      </aside>
    </div>
  )
}
