/**
 * ATC SAMPLE stage — no YouTube.
 * Canvas graphic waiting room + optional HTML5 audio (éphémère / in-memory).
 */
import { useEffect, useRef } from 'react'

export default function EphemeralStage({
  title = 'Masterclass Sfumato',
  subtitle = 'Flux live éphémère — pas d’enregistrement disque',
}: {
  title?: string
  subtitle?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let running = true
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const t0 = performance.now()
    const draw = () => {
      if (!running) return
      raf = requestAnimationFrame(draw)
      const t = (performance.now() - t0) / 1000
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.fillStyle = '#08060c'
      ctx.fillRect(0, 0, w, h)

      // soft fog layers
      for (let i = 0; i < 5; i++) {
        const y = h * 0.3 + Math.sin(t * 0.4 + i) * 40 + i * 28
        const grd = ctx.createLinearGradient(0, y - 30, 0, y + 30)
        grd.addColorStop(0, 'transparent')
        grd.addColorStop(0.5, `rgba(196, 165, 116, ${0.04 + i * 0.02})`)
        grd.addColorStop(1, 'transparent')
        ctx.fillStyle = grd
        ctx.fillRect(0, y - 40, w, 80)
      }

      // sfumato rings
      ctx.strokeStyle = 'rgba(212, 175, 119, 0.25)'
      ctx.lineWidth = 1.5
      for (let i = 0; i < 4; i++) {
        ctx.beginPath()
        ctx.arc(w * 0.5, h * 0.42, 40 + i * 36 + Math.sin(t + i) * 6, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.fillStyle = '#f5f0e8'
      ctx.font = '600 18px system-ui,sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(title, w / 2, h * 0.72)
      ctx.fillStyle = '#a1a1aa'
      ctx.font = '13px system-ui,sans-serif'
      ctx.fillText(subtitle, w / 2, h * 0.72 + 26)
      ctx.fillStyle = 'rgba(212,175,119,0.7)'
      ctx.font = '11px system-ui,sans-serif'
      ctx.fillText('Demande au mentor ci-dessous · chapitres via RAG timestamps', w / 2, h * 0.72 + 48)
    }
    draw()

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [title, subtitle])

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black aspect-video">
      <canvas ref={ref} className="h-full w-full w-full block" style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
