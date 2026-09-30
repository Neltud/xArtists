/**
 * Dynamic reticle / movement arrow HUD for museum spatial navigation.
 */
import { useEffect, useState, type RefObject } from 'react'

type Props = {
  /** Mount element that sets dataset.moving = '1' | '0' */
  movingRef?: RefObject<HTMLElement | null>
}

export default function NavReticle({ movingRef }: Props) {
  const [moving, setMoving] = useState(false)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const el = movingRef?.current
      const m = el?.dataset?.moving === '1'
      setMoving(prev => (prev === m ? prev : m))
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [movingRef])

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center z-10"
      aria-hidden
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        className={`transition-opacity duration-200 ${moving ? 'opacity-90' : 'opacity-40'}`}
      >
        {/* crosshair */}
        <circle
          cx="14"
          cy="14"
          r="3"
          fill="none"
          stroke="rgba(103,232,249,0.85)"
          strokeWidth="1.2"
        />
        <line x1="14" y1="2" x2="14" y2="8" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
        <line x1="14" y1="20" x2="14" y2="26" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
        <line x1="2" y1="14" x2="8" y2="14" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
        <line x1="20" y1="14" x2="26" y2="14" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
        {/* direction chevron when moving */}
        {moving && (
          <polygon
            points="14,5 17,10 11,10"
            fill="rgba(34,211,238,0.9)"
            className="origin-center"
            style={{ transformOrigin: '14px 14px', animation: 'xartists-reticle-pulse 0.8s ease-in-out infinite' }}
          />
        )}
      </svg>
      <style>{`
        @keyframes xartists-reticle-pulse {
          0%, 100% { opacity: 0.7; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>
    </div>
  )
}
