/**
 * Menu — Public (intelligence) vs Compte vs On-chain vs Infos.
 * UMPS §3 : deux univers (public Model C / privé ops).
 */
import { NavLink } from 'react-router-dom'
import { PRIMARY_NAV, SECONDARY_NAV } from '../config/links'
import { useWallet } from '../context/WalletContext'
import { clearXPortalSession } from '../lib/xportalWc'
import { requestOpenConnect } from '../lib/walletEvents'
import { useI18n } from '../i18n/I18nContext'

/** Compte = session utilisateur + ops personnelles */
const ACCOUNT = ['/wallet', '/portfolio', '/my-packs', '/command-center']
/** Public = preuve d’intelligence & marchés (Model C) */
const PUBLIC = ['/lia', '/market', '/lp', '/museum', '/marketplace', '/agents']
const INFO = ['/legal', '/go-live', '/sitemap']

export default function SideNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const { connected, shortAddress, method, disconnect } = useWallet()

  if (!open) return null

  const all = [...PRIMARY_NAV, ...SECONDARY_NAV]
  const byPath = (paths: string[]) => {
    const set = new Set(paths)
    const out: typeof all = []
    for (const p of paths) {
      const hit = all.find(i => i.to === p)
      if (hit && !out.some(x => x.to === hit.to)) out.push(hit)
    }
    // also any primary not listed elsewhere
    for (const i of all) {
      if (set.has(i.to) && !out.some(x => x.to === i.to)) out.push(i)
    }
    return out
  }

  const publicItems = byPath(PUBLIC)
  // Principal cœur hors public dupliqué
  const main = PRIMARY_NAV.filter(i => !ACCOUNT.includes(i.to) && !PUBLIC.includes(i.to))
  const account = byPath(ACCOUNT)
  const more = SECONDARY_NAV.filter(i => INFO.includes(i.to))
  const protocol = SECONDARY_NAV.filter(
    i => !ACCOUNT.includes(i.to) && !INFO.includes(i.to) && !PUBLIC.includes(i.to),
  )

  const sections = [
    {
      title: 'Public · intelligence',
      items: publicItems,
      hint: 'Hub LIA, marchés, pools — transparent, paper-first',
    },
    { title: 'Principal', items: main, hint: '' },
    {
      title: 'Compte',
      items: account,
      hint: 'Wallet, portfolio, salles, command center',
    },
    { title: 'On-chain', items: protocol, hint: '' },
    { title: 'Infos', items: more, hint: 'RCE = Real Capital Engaged (EGLD dans les SC)' },
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
              <p className="text-[10px] text-zinc-600">
                {method === 'xportal' ? 'xPortal' : method || 'session'}
              </p>
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
              <p className="mb-0.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {sec.title}
              </p>
              {sec.hint ? (
                <p className="mb-1.5 px-2 text-[10px] text-zinc-600 leading-snug">{sec.hint}</p>
              ) : (
                <div className="mb-1" />
              )}
              <ul className="space-y-0.5">
                {sec.items.map(item => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition active:scale-[0.98] ${
                          isActive
                            ? 'bg-violet-500/20 text-white'
                            : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                        }`
                      }
                    >
                      <span aria-hidden>{item.emoji}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </div>
  )
}
