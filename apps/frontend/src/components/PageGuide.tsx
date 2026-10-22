import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * Guide page — uniquement le « ? », plus de titre répété à côté du H1.
 */
import InfoTip from './InfoTip'
import { PAGE_GUIDE, type PageGuideKey } from '../content/helpCopy'

export default function PageGuide({
  page,
  className = '',
}: {
  page: PageGuideKey
  className?: string
  defaultOpen?: boolean
}) {
  const guide = PAGE_GUIDE[page]
  if (!guide) return null

  return (
    <div className={`flex justify-end mb-2 ${className}`}>
      <InfoTip tone={guide.warn ? 'warn' : 'info'}>
        <strong className="block mb-1.5 text-[11px] font-semibold text-white">{xaRender(guide.title)}</strong>
        <ul className="list-disc pl-3.5 space-y-1 text-zinc-400">
          {xaRender(guide.bullets.map(b => (
            <li key={b}>{xaRender(b)}</li>
          )))}
        </ul>
        {xaRender(guide.warn && (
          <p className="mt-2 text-amber-300/90 border-t border-white/10 pt-2">{xaRender(guide.warn)}</p>
        ))}
      </InfoTip>
    </div>
  )
}
