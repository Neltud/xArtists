/** Nœuds 3D = signaux trading (pas Stake / Marketplace). */
import { useI18n } from '../i18n/I18nContext'

const LABELS: Record<string, { hint: string; rows: { color: string; text: string }[] }> = {
  fr: {
    hint: 'Clique un nœud 3D — signaux live',
    rows: [
      { color: 'bg-emerald-400', text: 'Nœud vert → Momentum / tendance (LIA)' },
      { color: 'bg-violet-400', text: 'Nœud violet → Flux / volatilité (Trading)' },
      { color: 'bg-cyan-400', text: 'Mur central → Pulse / sentiment holo' },
      { color: 'bg-amber-300', text: 'Orbe agent → fiche NFT + engagement clone' },
    ],
  },
  en: {
    hint: 'Click a 3D node — live signals',
    rows: [
      { color: 'bg-emerald-400', text: 'Green node → Momentum / trend (LIA)' },
      { color: 'bg-violet-400', text: 'Violet node → Flow / volatility (Trading)' },
      { color: 'bg-cyan-400', text: 'Center wall → Pulse / holo sentiment' },
      { color: 'bg-amber-300', text: 'Agent orb → NFT card + clone engage' },
    ],
  },
}

export default function ClickGuide() {
  const { lang } = useI18n()
  const pack = LABELS[lang] || LABELS.fr
  return (
    <aside className="rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{pack.hint}</p>
      <ul className="space-y-1.5">
        {pack.rows.map(r => (
          <li key={r.text} className="flex items-start gap-2 text-[12px] text-zinc-300">
            <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${r.color}`} />
            <span>{r.text}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
