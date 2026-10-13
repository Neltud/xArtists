/**
 * Blue Ribbon — ruban néon cyan dont l’écartement suit la conviction LIA (spread vol).
 */
import { useEffect, useRef } from 'react'

type Props = {
  /** 0–1 conviction / confidence */
  conviction?: number
  /** Spread volatilité normalisé 0–1 */
  volSpread?: number
  className?: string
  height?: number
}

export default function LiaRibbonOverlay({
  conviction = 0.65,
  volSpread = 0.35,
  className = '',
  height = 56,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let disposed = false
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)

    const resize = () => {
      const w = canvas.clientWidth || 320
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const bands = 3 + Math.round(volSpread * 4)
    const gap = 4 + volSpread * 10
    const amp = 6 + conviction * 14

    const draw = (t: number) => {
      if (disposed) return
      const w = canvas.clientWidth || 320
      const h = height
      ctx.clearRect(0, 0, w, h)
      for (let b = 0; b < bands; b++) {
        const y0 = h / 2 + (b - (bands - 1) / 2) * gap
        ctx.beginPath()
        for (let x = 0; x <= w; x += 2) {
          const y =
            y0 +
            Math.sin(x * 0.02 + t * 2.2 + b * 0.7) * amp * (0.7 + conviction * 0.5) +
            Math.sin(x * 0.05 + t * 3.5) * amp * 0.25
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(34,211,238,${0.35 + conviction * 0.45 - b * 0.05})`
        ctx.lineWidth = 1.5 + conviction * 1.5
        ctx.shadowColor = 'rgba(34,211,238,0.55)'
        ctx.shadowBlur = 8 + conviction * 12
        ctx.stroke()
      }
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(165,243,252,0.85)'
      ctx.font = '600 10px ui-monospace, system-ui'
      ctx.fillText('BLUE RIBBON', 8, 12)
      ctx.fillStyle = 'rgba(165,243,252,0.55)'
      ctx.font = '9px ui-monospace, system-ui'
      ctx.fillText(
        `conv ${(conviction * 100).toFixed(0)}% · spread ${(volSpread * 100).toFixed(0)}%`,
        8,
        h - 6,
      )
    }

    const start = performance.now()
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      draw((now - start) / 1000)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [conviction, volSpread, height])

  return (
    <canvas
      ref={ref}
      className={`w-full rounded-xl border border-cyan-500/25 bg-black/50 ${className}`}
      style={{ height }}
      aria-label="Blue Ribbon LIA"
    />
  )
}
