/**
 * Brief entry overlay — must not re-trigger on every parent render.
 */
import { useEffect, useRef, useState } from 'react'

type Props = {
  active: boolean
  onDone?: () => void
  durationMs?: number
}

export default function DataTunnelTransition({ active, onDone, durationMs = 700 }: Props) {
  const [show, setShow] = useState(false)
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  const ran = useRef(false)

  useEffect(() => {
    if (!active || ran.current) return
    ran.current = true
    setShow(true)
    const t = window.setTimeout(() => {
      setShow(false)
      doneRef.current?.()
    }, durationMs)
    return () => window.clearTimeout(t)
  }, [active, durationMs])

  // Safety: never leave overlay > 2s even if timer cleared
  useEffect(() => {
    if (!active) return
    const t = window.setTimeout(() => {
      setShow(false)
      doneRef.current?.()
    }, Math.max(durationMs, 2000) + 100)
    return () => window.clearTimeout(t)
  }, [active, durationMs])

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-[90] pointer-events-none overflow-hidden bg-black/75"
      aria-hidden
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-px bg-gradient-to-b from-transparent via-cyan-400/70 to-transparent"
            style={{
              height: '120%',
              left: `${((i + 0.5) / 16) * 100}%`,
              animation: `xartists-tunnel ${0.45 + (i % 5) * 0.06}s linear infinite`,
              opacity: 0.3 + (i % 3) * 0.12,
            }}
          />
        ))}
        <p className="relative z-10 text-[11px] tracking-[0.28em] uppercase text-cyan-100/90 font-semibold">
          Command Center
        </p>
      </div>
      <style>{`
        @keyframes xartists-tunnel {
          from { transform: translateY(-25%); opacity: 0.15; }
          to { transform: translateY(25%); opacity: 0.65; }
        }
      `}</style>
    </div>
  )
}
