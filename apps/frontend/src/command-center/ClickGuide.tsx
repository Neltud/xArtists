/** Explications des nœuds 3D — signaux trading, pas Stake/Market. */
import { useI18n } from '../i18n/I18nContext'

export default function ClickGuide() {
  const { t } = useI18n()
  const rows = [
    { color: 'bg-emerald-400', key: 'cc.click.stake' }, // key kept for i18n map → momentum
    { color: 'bg-violet-400', key: 'cc.click.market' }, // → flow
    { color: 'bg-cyan-400', key: 'cc.click.wall' },
    { color: 'bg-amber-300', key: 'cc.click.agent' },
  ]
  return (
    <aside className="rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{t('cc.click.hint')}</p>
      <ul className="space-y-1.5">
        {rows.map(r => (
          <li key={r.key} className="flex items-start gap-2 text-[12px] text-zinc-300">
            <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${r.color}`} />
            <span>{t(r.key)}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
