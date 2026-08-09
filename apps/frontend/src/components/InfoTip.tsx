/**
 * InfoTip — accessible bubble for honest UX explanations.
 * Best practice: clarify LIA vs user scope, paper vs live, SC status.
 */
import { useId, useState } from 'react'

interface InfoTipProps {
  /** Short label shown next to the trigger (optional) */
  label?: string
  /** Body text of the tip */
  children: React.ReactNode
  /** Visual tone */
  tone?: 'info' | 'warn' | 'ok'
  /** Placement of the popup */
  side?: 'top' | 'bottom'
  className?: string
}

const TONE: Record<NonNullable<InfoTipProps['tone']>, string> = {
  info: 'border-purple-500/40 bg-purple-950/90 text-purple-100',
  warn: 'border-orange-500/40 bg-orange-950/90 text-orange-100',
  ok: 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100',
}

export default function InfoTip({
  label,
  children,
  tone = 'info',
  side = 'bottom',
  className = '',
}: InfoTipProps) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <span className={`relative inline-flex items-center gap-1 ${className}`}>
      {label && <span className="text-xs text-gray-400">{label}</span>}
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        aria-label="Plus d'informations"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-600 bg-gray-800 text-[10px] font-bold text-gray-300 hover:border-purple-500 hover:text-purple-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
      >
        i
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={`absolute z-50 w-64 max-w-[80vw] rounded-lg border px-3 py-2 text-left text-xs leading-relaxed shadow-xl ${TONE[tone]} ${
            side === 'top' ? 'bottom-full mb-2 left-0' : 'top-full mt-2 left-0'
          }`}
        >
          {children}
        </span>
      )}
    </span>
  )
}
