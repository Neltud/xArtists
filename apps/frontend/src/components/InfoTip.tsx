import { useId, useState, useRef, useEffect } from 'react'
import { HELP, type HelpKey } from '../content/helpCopy'

type Props = {
  /** Key in HELP map, or raw text via `text` */
  k?: HelpKey
  text?: string
  label?: string
  className?: string
}

/**
 * Accessible info bubble — click/tap or keyboard.
 * Mobile-friendly (no hover-only).
 */
export default function InfoTip({ k, text, label = 'Info', className = '' }: Props) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const body = text || (k ? HELP[k] : '')

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!body) return null

  return (
    <span ref={ref} className={`info-tip relative inline-flex align-middle ${className}`}>
      <button
        type="button"
        className="info-tip-btn"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(v => !v)
        }}
      >
        i
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="info-tip-panel"
        >
          {body}
          <button
            type="button"
            className="mt-2 text-[10px] text-purple-300 underline"
            onClick={() => setOpen(false)}
          >
            Fermer
          </button>
        </span>
      )}
    </span>
  )
}

/** Inline label + tip */
export function LabelWithTip({
  children,
  k,
  text,
}: {
  children: React.ReactNode
  k?: HelpKey
  text?: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {children}
      <InfoTip k={k} text={text} />
    </span>
  )
}
