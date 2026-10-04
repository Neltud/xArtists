/** Minimal canvas equity curve from shadow fills (paper). */
import { useEffect, useRef } from 'react'
import type { ShadowFill } from '../../lia/shadowLedger'

type Props = {
  fills: ShadowFill[]
  startEquity?: number
  className?: string
}

/** Build cumulative equity path (USDC-centric + rough EGLD@1 unit weight). */
function series(fills: ShadowFill[], start = 110): number[] {
  const ordered = [...fills].sort((a, b) => a.at - b.at)
  let eq = start
  const out = [eq]
  for (const f of ordered) {
    // Toy mark: BUY reduces USDC-like, SELL increases; amount * 0.1 as noise scale
    if (f.side === 'BUY') eq -= f.amount * (f.price || 1) * 0.01 + f.feeEgld
    else if (f.side === 'SELL') eq += f.amount * (f.price || 1) * 0.01 - f.feeEgld
    else if (f.side === 'FLATTEN') eq *= 0.99
    else eq -= f.feeEgld
    out.push(eq)
  }
  return out
}

export default function ShadowEquityChart({ fills, startEquity = 110, className = '' }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth || 320
    const h = canvas.clientHeight || 120
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const pts = series(fills, startEquity)
    ctx.clearRect(0, 0, w, h)

    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    for (let i = 1; i < 4; i++) {
      const y = (h * i) / 4
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    if (pts.length < 2) {
      ctx.fillStyle = 'rgba(161,161,170,0.8)'
      ctx.font = '12px sans-serif'
      ctx.fillText('Pas assez de fills shadow pour une courbe', 12, h / 2)
      return
    }

    const min = Math.min(...pts)
    const max = Math.max(...pts)
    const span = max - min || 1
    const pad = 8

    const up = pts[pts.length - 1] >= pts[0]
    ctx.strokeStyle = up ? 'rgba(52,211,153,0.9)' : 'rgba(251,113,133,0.9)'
    ctx.lineWidth = 2
    ctx.beginPath()
    pts.forEach((v, i) => {
      const x = pad + (i / (pts.length - 1)) * (w - pad * 2)
      const y = pad + (1 - (v - min) / span) * (h - pad * 2)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // fill under
    const lastX = pad + (w - pad * 2)
    const lastY = pad + (1 - (pts[pts.length - 1] - min) / span) * (h - pad * 2)
    ctx.lineTo(lastX, h - pad)
    ctx.lineTo(pad, h - pad)
    ctx.closePath()
    ctx.fillStyle = up ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)'
    ctx.fill()

    ctx.fillStyle = 'rgba(228,228,231,0.7)'
    ctx.font = '10px monospace'
    ctx.fillText(max.toFixed(2), pad, 12)
    ctx.fillText(min.toFixed(2), pad, h - 4)
  }, [fills, startEquity])

  return (
    <canvas
      ref={ref}
      className={`w-full h-[120px] rounded-xl bg-black/40 border border-white/10 ${className}`}
      aria-label="Courbe equity shadow"
    />
  )
}
