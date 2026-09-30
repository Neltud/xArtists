/**
 * ProjectionBridge — Canvas 2D dashboard → THREE.CanvasTexture (no html2canvas dep).
 * Paints metrics from empireStore; applies texture to CommandWall mesh.
 */
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useEmpireStore, useAgentAccess } from '../store/empireStore'

type Props = {
  sentiment?: number
  /** Called each frame with updated texture */
  onTexture?: (tex: THREE.CanvasTexture) => void
  width?: number
  height?: number
}

export default function ProjectionBridge({ sentiment = 0, onTexture, width = 512, height = 288 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const texRef = useRef<THREE.CanvasTexture | null>(null)
  const empire = useEmpireStore()
  const access = useAgentAccess()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const paint = () => {
      const w = width
      const h = height
      ctx.fillStyle = '#05050a'
      ctx.fillRect(0, 0, w, h)

      // border glow
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)'
      ctx.lineWidth = 2
      ctx.strokeRect(4, 4, w - 8, h - 8)

      ctx.fillStyle = '#67e8f9'
      ctx.font = '10px monospace'
      ctx.fillText('LIVE · COMMAND CENTER', 20, 28)

      const bullish = sentiment >= 0
      ctx.fillStyle = bullish ? '#fbbf24' : '#fb7185'
      ctx.font = 'bold 12px sans-serif'
      ctx.fillText(
        `${bullish ? 'BULLISH' : 'BEARISH'} ${(sentiment * 100).toFixed(0)}%`,
        w - 140,
        28,
      )

      // metrics boxes
      const boxes = [
        { l: 'EGLD', v: empire.wallet.egldBalance ?? '—' },
        { l: 'TRO', v: empire.wallet.troBalance ?? '—' },
        { l: 'PACKS', v: String(access.packs.length) },
      ]
      boxes.forEach((b, i) => {
        const x = 20 + i * 160
        ctx.fillStyle = 'rgba(255,255,255,0.06)'
        ctx.fillRect(x, 48, 140, 56)
        ctx.fillStyle = '#71717a'
        ctx.font = '9px sans-serif'
        ctx.fillText(b.l, x + 10, 68)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 14px monospace'
        ctx.fillText(String(b.v).slice(0, 12), x + 10, 90)
      })

      // bars
      for (let i = 0; i < 16; i++) {
        const barH = 20 + Math.abs(Math.sin(i * 0.7 + sentiment * 3 + Date.now() / 2000)) * 70
        const bw = (w - 40) / 16 - 4
        const x = 20 + i * (bw + 4)
        const y = h - 40 - barH
        const g = ctx.createLinearGradient(0, y + barH, 0, y)
        if (bullish) {
          g.addColorStop(0, '#22d3ee')
          g.addColorStop(1, '#fbbf24')
        } else {
          g.addColorStop(0, '#7f1d1d')
          g.addColorStop(1, '#f43f5e')
        }
        ctx.fillStyle = g
        ctx.fillRect(x, y, bw, barH)
      }

      ctx.fillStyle = '#52525b'
      ctx.font = '9px monospace'
      ctx.fillText(
        `${(empire.wallet.address || 'no wallet').slice(0, 22)} · ${access.source}`,
        20,
        h - 12,
      )

      if (!texRef.current) {
        texRef.current = new THREE.CanvasTexture(canvas)
        texRef.current.colorSpace = THREE.SRGBColorSpace
      } else {
        texRef.current.needsUpdate = true
      }
      onTexture?.(texRef.current)
    }

    paint()
    const id = window.setInterval(paint, 500)
    return () => {
      window.clearInterval(id)
      texRef.current?.dispose()
      texRef.current = null
    }
  }, [
    sentiment,
    empire.wallet.egldBalance,
    empire.wallet.troBalance,
    empire.wallet.address,
    access.packs.length,
    access.source,
    onTexture,
    width,
    height,
  ])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none"
      aria-hidden
    />
  )
}
