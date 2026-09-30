/**
 * Spatial Continuity — light data-tunnel overlay (no GSAP dep).
 * Used when entering Command Center; Museum code untouched.
 */
import { useEffect, useState } from 'react'

type Props = {
  active: boolean
  onDone?: () => void
  durationMs?: number
}

export default function DataTunnelTransition({ active, onDone, durationMs = 900 }: Props) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!active) return
    setShow(true)
    const t = window.setTimeout(() => {
      setShow(false)
      onDone?.()
    }, durationMs)
    return () => window.clearTimeout(t)
  }, [active, durationMs, onDone])

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-[90] pointer-events-none overflow-hidden bg-black/80"
      aria-hidden
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-px bg-gradient-to-b from-transparent via-cyan-400/80 to-transparent"
            style={{
              height: '140%',
              left: `${(i / 24) * 100}%`,
              transform: `rotate(${(i % 5) - 2}deg)`,
              animation: `xartists-tunnel ${0.4 + (i % 7) * 0.05}s linear infinite`,
              opacity: 0.35 + (i % 3) * 0.15,
            }}
          />
        ))}
        <p className="relative z-10 text-[11px] tracking-[0.3em] uppercase text-cyan-200/90 font-semibold">
          Entering Command Center
        </p>
      </div>
      <style>{`
        @keyframes xartists-tunnel {
          from { transform: translateY(-30%) scaleY(0.6); opacity: 0.1; }
          to { transform: translateY(30%) scaleY(1.2); opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}
