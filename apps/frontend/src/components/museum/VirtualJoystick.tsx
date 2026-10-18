/**
 * Analog virtual joystick — left zone for walk.
 * Isolated pointer capture so right-hand look works simultaneously.
 */
import { useRef } from 'react'

type Props = {
  /** Continuous stick: x/y in [-1, 1], y negative = forward */
  onChange?: (x: number, y: number) => void
  className?: string
}

export default function VirtualJoystick({ onChange, className = '' }: Props) {
  const baseRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const active = useRef(false)
  const pointerId = useRef<number | null>(null)

  const emit = (x: number, y: number) => {
    onChange?.(x, y)
  }

  const reset = () => {
    active.current = false
    pointerId.current = null
    emit(0, 0)
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(-50%, -50%)'
    }
  }

  const onMove = (clientX: number, clientY: number) => {
    const base = baseRef.current
    if (!base || !active.current) return
    const r = base.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    let dx = clientX - cx
    let dy = clientY - cy
    const max = r.width * 0.38
    const len = Math.hypot(dx, dy) || 1
    if (len > max) {
      dx = (dx / len) * max
      dy = (dy / len) * max
    }
    if (knobRef.current) {
      knobRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`
    }
    emit(dx / max, dy / max)
  }

  return (
    <div
      ref={baseRef}
      className={`h-28 w-28 rounded-full border backdrop-blur-md touch-none select-none ${className}`}
      style={{
        touchAction: 'none',
        borderColor: 'var(--xa-border-strong)',
        background: 'rgba(16, 18, 15, 0.75)',
        minWidth: 112,
        minHeight: 112,
      }}
      onPointerDown={e => {
        e.stopPropagation()
        e.preventDefault()
        active.current = true
        pointerId.current = e.pointerId
        ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
        onMove(e.clientX, e.clientY)
      }}
      onPointerMove={e => {
        if (pointerId.current != null && e.pointerId !== pointerId.current) return
        e.stopPropagation()
        onMove(e.clientX, e.clientY)
      }}
      onPointerUp={e => {
        if (pointerId.current != null && e.pointerId !== pointerId.current) return
        e.stopPropagation()
        try {
          ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
        } catch {
          /* */
        }
        reset()
      }}
      onPointerCancel={e => {
        e.stopPropagation()
        reset()
      }}
      aria-label="Walk joystick"
    >
      <div
        ref={knobRef}
        className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg"
        style={{
          position: 'absolute',
          border: '1px solid var(--xa-accent)',
          background: 'var(--xa-accent-soft)',
        }}
      />
    </div>
  )
}
