/**
 * InfoTip — accessible bubble. Supports HELP keys (k=) or free children.
 */
import { useId, useState } from 'react'
import { HELP } from '../content/helpCopy'

interface InfoTipProps {
  label?: string
  /** HELP key: liaVsUser, paperFirst, … */
  k?: keyof typeof HELP
  children?: React.ReactNode
  tone?: 'info' | 'warn' | 'ok'
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
  k,
  children,
  tone = 'info',
  side = 'bottom',
  className = '',
}: InfoTipProps) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const help = k ? HELP[k] : null
  const body = children ?? (
    help ? (
      <>
        <strong className="block mb-1">{help.title}</strong>
        {help.body}
      </>
    ) : null
  )

  if (!body) return null

  return (
    <span className={`relative inline-flex items-center gap-1 ${className}`}>
      {label && <span className="text-xs text-gray-400">{label}</span>}
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        aria-label="Plus d'informations"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-600 bg-gray-800 text-[10px] font-bold text-gray-300 hover:border-purple-500 hover:text-purple-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        onClick={() => setOpen(v => !v)}
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
          {body}
        </span>
      )}
    </span>
  )
}

/** Compat: pages using k="lia_vs_user" style aliases */
export function LabelWithTip({
  k,
  children,
}: {
  k?: string
  children?: React.ReactNode
}) {
  const map: Record<string, keyof typeof HELP> = {
    lia_vs_user: 'liaVsUser',
    paper_first: 'paperFirst',
    live_trading: 'paperFirst',
    hatom: 'scStatus',
    oracle: 'scStatus',
    portfolio_scenarios: 'paperFirst',
  }
  const key = k ? map[k] || (k as keyof typeof HELP) : undefined
  return <InfoTip k={key in (HELP as object) ? (key as keyof typeof HELP) : 'liaVsUser'}>{children}</InfoTip>
}
