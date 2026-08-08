import { useState } from 'react'
import { PAGE_GUIDE, HELP, type HelpKey } from '../content/helpCopy'
import InfoTip from './InfoTip'

type Props = {
  page: keyof typeof PAGE_GUIDE | string
  className?: string
}

/**
 * Collapsible page intro — clarifies role of the screen + deep tips.
 */
export default function PageGuide({ page, className = '' }: Props) {
  const g = PAGE_GUIDE[page]
  const [open, setOpen] = useState(true)
  if (!g) return null

  return (
    <div
      className={`mb-4 rounded-xl border border-[#2a2a3a] bg-[#111118]/90 px-3 py-2.5 ${className}`}
      role="note"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
            {g.title}
            <InfoTip text={g.body} label={`À propos : ${g.title}`} />
          </p>
          {open && <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{g.body}</p>}
        </div>
        <button
          type="button"
          className="text-[10px] text-gray-500 shrink-0 underline"
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
        >
          {open ? 'Réduire' : 'Détails'}
        </button>
      </div>
      {open && g.tips && g.tips.length > 0 && (
        <ul className="mt-2 space-y-1.5 border-t border-[#2a2a3a] pt-2">
          {g.tips.map((key: HelpKey) => (
            <li key={key} className="text-[10px] text-gray-500 flex gap-2 items-start">
              <InfoTip k={key} />
              <span className="leading-snug">{HELP[key]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
