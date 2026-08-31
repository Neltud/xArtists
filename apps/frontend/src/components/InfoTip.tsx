/**
 * InfoTip — bulle au survol / focus du « ? ». Détails hors du flux principal.
 */
import { useId, useRef, useState } from 'react'
import { HELP } from '../content/helpCopy'

interface InfoTipProps {
  label?: string
  k?: keyof typeof HELP
  children?: React.ReactNode
  tone?: 'info' | 'warn' | 'ok'
  side?: 'top' | 'bottom'
  className?: string
}

const TONE: Record<NonNullable<InfoTipProps['tone']>, string> = {
  info: 'border-violet-500/35 bg-[#12121c]/95 text-zinc-200',
  warn: 'border-amber-500/40 bg-[#1a1408]/95 text-amber-100',
  ok: 'border-emerald-500/35 bg-[#0c1814]/95 text-emerald-100',
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
  const closeTimer = useRef<number | null>(null)
  const help = k ? HELP[k] : null
  const body = children ?? (
    help ? (
      <>
        <strong className="block mb-1 text-[11px] font-semibold text-white">{help.title}</strong>
        <span className="text-zinc-400">{help.body}</span>
      </>
    ) : null
  )

  if (!body) return null

  const show = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const hide = () => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 120)
  }

  return (
    <span
      className={`relative inline-flex items-center gap-1 align-middle ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {label && <span className="text-xs text-zinc-500">{label}</span>}
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        aria-label="Aide"
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-[10px] font-bold text-zinc-400 hover:border-violet-400/50 hover:text-violet-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
        onFocus={show}
        onBlur={hide}
        onClick={e => {
          e.preventDefault()
          setOpen(v => !v)
        }}
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={`absolute z-[60] w-64 max-w-[min(80vw,16rem)] rounded-xl border px-3 py-2 text-left text-[11px] leading-relaxed shadow-2xl backdrop-blur-md ${TONE[tone]} ${
            side === 'top' ? 'bottom-full mb-2 left-0' : 'top-full mt-2 left-0'
          }`}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {body}
        </span>
      )}
    </span>
  )
}

export function LabelWithTip({
  k,
  children,
}: {
  k?: keyof typeof HELP
  children?: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {children}
      {k && <InfoTip k={k} />}
    </span>
  )
}
