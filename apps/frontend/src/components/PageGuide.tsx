/**
 * PageGuide — collapsible honest guide per page.
 * Best practice: always surface LIA scope, paper vs live, SC readiness.
 */
import { useState } from 'react'
import { PAGE_GUIDE, type PageGuideKey } from '../content/helpCopy'

interface PageGuideProps {
  page: PageGuideKey
  className?: string
  defaultOpen?: boolean
}

export default function PageGuide({ page, className = '', defaultOpen = false }: PageGuideProps) {
  const [open, setOpen] = useState(defaultOpen)
  const guide = PAGE_GUIDE[page]
  if (!guide) return null

  return (
    <div
      className={`mb-6 rounded-xl border border-gray-800 bg-gray-900/60 overflow-hidden ${className}`}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-800/50 transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <span aria-hidden>📘</span>
          Guide — {guide.title}
        </span>
        <span className="text-xs text-gray-500">{open ? 'Masquer' : 'Afficher'}</span>
      </button>
      {open && (
        <div className="border-t border-gray-800 px-4 py-3 space-y-2">
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
            {guide.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          {guide.warn && (
            <p className="mt-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs text-orange-300">
              ⚠️ {guide.warn}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
