/**
 * PageGuide — compact : titre + ? (détails au survol). Pas de gros bloc par défaut.
 */
import InfoTip from './InfoTip'
import { PAGE_GUIDE, type PageGuideKey } from '../content/helpCopy'

interface PageGuideProps {
  page: PageGuideKey
  className?: string
  defaultOpen?: boolean
}

export default function PageGuide({ page, className = '' }: PageGuideProps) {
  const guide = PAGE_GUIDE[page]
  if (!guide) return null

  const tipBody = (
    <>
      <strong className="block mb-1.5 text-[11px] font-semibold text-white">{guide.title}</strong>
      <ul className="list-disc pl-3.5 space-y-1 text-zinc-400">
        {guide.bullets.map(b => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      {guide.warn && (
        <p className="mt-2 text-amber-300/90 border-t border-white/10 pt-2">{guide.warn}</p>
      )}
    </>
  )

  return (
    <div className={`flex items-center gap-1.5 mb-4 ${className}`}>
      <span className="text-[11px] text-zinc-500 font-medium tracking-wide">{guide.title}</span>
      <InfoTip tone={guide.warn ? 'warn' : 'info'}>{tipBody}</InfoTip>
    </div>
  )
}
