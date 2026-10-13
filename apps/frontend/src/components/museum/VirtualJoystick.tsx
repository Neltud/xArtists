/** Joystick virtuel discret — bas gauche, mobile / pointer coarse. */
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

  const reset = () => {
    active.current = false
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
    const max = r.width * 0.35
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
    hold.current.left = nx < -0.35
    hold.current.right = nx > 0.35
    hold.current.up = ny < -0.35
    hold.current.down = ny > 0.35
  }

  return (
    <div
      ref={baseRef}
      className="absolute bottom-6 left-4 z-20 h-24 w-24 rounded-full border border-white/20 bg-black/45 backdrop-blur-md touch-none select-none md:hidden"
      style={{ touchAction: 'none' }}
      onPointerDown={e => {
        active.current = true
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        onMove(e.clientX, e.clientY)
      }}
      onPointerMove={e => onMove(e.clientX, e.clientY)}
      onPointerUp={reset}
      onPointerCancel={reset}
      aria-label="Joystick navigation"
    >
      <div
        ref={knobRef}
        className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/40 bg-cyan-500/25 shadow-lg"
      />
    </div>
  )
}
