/** Joystick analogique gauche — mobile / pointer coarse · dual-touch ready. */
import { useRef } from 'react'

type Hold = {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
}

type Props = {
  hold: React.MutableRefObject<Hold>
}

export default function VirtualJoystick({ hold }: Props) {
  const baseRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const active = useRef(false)
  const pointerId = useRef<number | null>(null)

  const reset = () => {
    active.current = false
    pointerId.current = null
    hold.current.up = false
    hold.current.down = false
    hold.current.left = false
    hold.current.right = false
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
    const nx = dx / max
    const ny = dy / max
    hold.current.left = nx < -0.28
    hold.current.right = nx > 0.28
    hold.current.up = ny < -0.28
    hold.current.down = ny > 0.28
  }

  return (
    <div
      ref={baseRef}
      className="absolute bottom-8 left-4 z-20 h-28 w-28 rounded-full border backdrop-blur-md touch-none select-none md:hidden"
      style={{
        touchAction: 'none',
        borderColor: 'var(--xa-border-strong)',
        background: 'rgba(16, 18, 15, 0.72)',
        minWidth: 112,
        minHeight: 112,
      }}
      onPointerDown={e => {
        e.stopPropagation()
        active.current = true
        pointerId.current = e.pointerId
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        onMove(e.clientX, e.clientY)
      }}
      onPointerMove={e => {
        if (pointerId.current != null && e.pointerId !== pointerId.current) return
        onMove(e.clientX, e.clientY)
      }}
      onPointerUp={e => {
        if (pointerId.current != null && e.pointerId !== pointerId.current) return
        reset()
      }}
      onPointerCancel={reset}
      aria-label="Joystick walk"
    >
      <div
        ref={knobRef}
        className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg"
        style={{
          border: '1px solid var(--xa-accent)',
          background: 'var(--xa-accent-soft)',
        }}
      />
    </div>
  )
}
