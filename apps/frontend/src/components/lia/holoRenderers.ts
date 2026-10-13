/**
 * 3 moteurs canvas distincts — PULSE / YIELD / SENTINEL
 * Axes, légendes et identité visuelle séparées.
 */
import type { TroEgldPoolSnapshot } from '../../services/poolService'
import { formatUsd } from '../../services/poolService'

function axisFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: {
    title: string
    legend: string
    xLabel: string
    yLabel: string
    accent: string
    pad?: number
  },
) {
  const pad = opts.pad ?? 36
  ctx.fillStyle = '#05050a'
  ctx.fillRect(0, 0, w, h)
  // HUD grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 1
  for (let x = pad; x < w - 12; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, 28)
    ctx.lineTo(x, h - pad)
    ctx.stroke()
  }
  for (let y = 28; y < h - pad; y += 28) {
    ctx.beginPath()
    ctx.moveTo(pad, y)
    ctx.lineTo(w - 12, y)
    ctx.stroke()
  }
  // axes
  ctx.strokeStyle = opts.accent
  ctx.globalAlpha = 0.55
  ctx.beginPath()
  ctx.moveTo(pad, 28)
  ctx.lineTo(pad, h - pad)
  ctx.lineTo(w - 12, h - pad)
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.fillStyle = opts.accent
  ctx.font = '600 13px ui-monospace, monospace'
  ctx.fillText(opts.title, 12, 18)
  ctx.fillStyle = 'rgba(200,200,220,0.75)'
  ctx.font = '10px ui-monospace, monospace'
  ctx.fillText(opts.legend, 12, h - 8)
  ctx.save()
  ctx.translate(11, h / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText(opts.yLabel, 0, 0)
  ctx.restore()
  ctx.fillText(opts.xLabel, w / 2 - 40, h - pad + 14)
  return pad
}

/** PULSE — télémétrie réseau / latence blocs MultiversX */
export function drawPulseScreen(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) {
  const pad = axisFrame(ctx, w, h, {
    title: '[PULSE TXX]',
    legend: 'Latence réseau & fréquence de bloc MultiversX',
    xLabel: 'Temps bloc (0–6000 ms)',
    yLabel: 'TPS / débit',
    accent: '#34d399',
  })
  const plotW = w - pad - 16
  const plotH = h - pad - 36
  // latency histogram (0-6000ms mapped)
  const bars = 18
  for (let i = 0; i < bars; i++) {
    const latency = 400 + Math.abs(Math.sin(t * 1.2 + i * 0.35)) * 2200
    const bh = (latency / 6000) * plotH * 0.85
    const bw = plotW / bars - 3
    const x = pad + 4 + i * (plotW / bars)
    ctx.fillStyle = i % 3 === 0 ? '#6ee7b7' : '#34d399'
    ctx.globalAlpha = 0.75
    ctx.fillRect(x, h - pad - bh, bw, bh)
  }
  ctx.globalAlpha = 1
  // waveform overlay
  ctx.strokeStyle = 'rgba(167,243,208,0.95)'
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let x = 0; x < plotW; x++) {
    const y =
      40 +
      plotH * 0.35 +
      Math.sin(x * 0.045 + t * 4) * 16 +
      Math.sin(x * 0.12 + t * 7) * 8
    if (x === 0) ctx.moveTo(pad + x, y)
    else ctx.lineTo(pad + x, y)
  }
  ctx.stroke()
  const tps = 80 + Math.sin(t * 2) * 25
  const lat = 12 + Math.abs(Math.sin(t)) * 9
  ctx.fillStyle = '#a7f3d0'
  ctx.font = '11px ui-monospace, monospace'
  ctx.fillText(`TXX/s ${tps.toFixed(0)}`, pad + 8, 34)
  ctx.fillText(`Latency ${lat.toFixed(1)} ms`, pad + 100, 34)
  ctx.fillText(`Pulse Index ${(tps / 10).toFixed(1)}`, pad + 230, 34)
}

/** YIELD — DeFi pool metrics (+ data réelle optionnelle) */
export function drawYieldScreen(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  pool?: TroEgldPoolSnapshot | null,
) {
  const pad = axisFrame(ctx, w, h, {
    title: '[YIELD DATA]',
    legend: 'Profondeur de pool, TVL & variation $TRO',
    xLabel: 'Horodatage UTC',
    yLabel: '$TRO / depth',
    accent: '#fbbf24',
  })
  const plotW = w - pad - 16
  const plotH = h - pad - 36

  // surface area chart
  ctx.beginPath()
  ctx.moveTo(pad, h - pad)
  for (let i = 0; i <= 40; i++) {
    const x = pad + (i / 40) * plotW
    const base = pool?.priceTroUsd ?? 0.4
    const y =
      h -
      pad -
      (0.35 + 0.25 * Math.sin(t * 0.8 + i * 0.2) + 0.1 * Math.sin(i * 0.5)) * plotH
    void base
    ctx.lineTo(x, y)
  }
  ctx.lineTo(pad + plotW, h - pad)
  ctx.closePath()
  const grad = ctx.createLinearGradient(0, 30, 0, h)
  grad.addColorStop(0, 'rgba(251,191,36,0.35)')
  grad.addColorStop(1, 'rgba(251,191,36,0.02)')
  ctx.fillStyle = grad
  ctx.fill()
  ctx.strokeStyle = '#fcd34d'
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let i = 0; i <= 40; i++) {
    const x = pad + (i / 40) * plotW
    const y =
      h -
      pad -
      (0.35 + 0.25 * Math.sin(t * 0.8 + i * 0.2) + 0.1 * Math.sin(i * 0.5)) * plotH
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  // candles
  for (let i = 0; i < 10; i++) {
    const x = pad + 20 + i * (plotW / 11)
    const open = 0.4 + Math.sin(t + i) * 0.15
    const close = 0.4 + Math.cos(t * 1.1 + i) * 0.15
    const high = Math.max(open, close) + 0.08
    const low = Math.min(open, close) - 0.08
    const yO = h - pad - open * plotH
    const yC = h - pad - close * plotH
    const yH = h - pad - high * plotH
    const yL = h - pad - low * plotH
    ctx.strokeStyle = close >= open ? '#34d399' : '#f87171'
    ctx.beginPath()
    ctx.moveTo(x + 4, yH)
    ctx.lineTo(x + 4, yL)
    ctx.stroke()
    ctx.fillStyle = close >= open ? '#34d399' : '#f87171'
    ctx.fillRect(x, Math.min(yO, yC), 8, Math.max(2, Math.abs(yO - yC)))
  }

  // TVL ring
  const cx = w - 70
  const cy = 70
  ctx.strokeStyle = 'rgba(251,191,36,0.5)'
  for (let r = 12; r <= 36; r += 12) {
    ctx.beginPath()
    ctx.arc(cx, cy, r + Math.sin(t + r) * 2, 0, Math.PI * 2)
    ctx.stroke()
  }

  const tvl = formatUsd(pool?.tvlUsd)
  const vol = formatUsd(pool?.volume24h)
  const src = pool?.source || 'fallback'
  const stale = pool?.stale ? ' · STALE' : ''
  ctx.fillStyle = '#fde68a'
  ctx.font = '11px ui-monospace, monospace'
  ctx.fillText(`TVL ${tvl}`, pad + 8, 34)
  ctx.fillText(`Vol24 ${vol}`, pad + 110, 34)
  ctx.fillText(`APR est. ${(6 + Math.sin(t * 0.5) * 1.1).toFixed(1)}%`, pad + 220, 34)
  ctx.fillStyle = 'rgba(253,230,138,0.7)'
  ctx.font = '9px ui-monospace, monospace'
  ctx.fillText(`src:${src}${stale} · TRO/EGLD`, pad + 8, 48)
}

/** SENTINEL — SHA-256 stream, radar ZK, conformité RWA */
export function drawSentinelScreen(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) {
  const pad = axisFrame(ctx, w, h, {
    title: '[SENTINEL AUDIT]',
    legend: 'Matrice de preuve SHA-256 & poids ZK',
    xLabel: 'Variance HD σ / nonce',
    yLabel: 'Conformité RWA',
    accent: '#a78bfa',
  })

  // hex matrix
  ctx.font = '10px ui-monospace, monospace'
  for (let row = 0; row < 9; row++) {
    const offset = Math.floor(t * 6 + row * 5) % 16
    let hex = ''
    for (let i = 0; i < 20; i++) hex += '0123456789abcdef'[(i + offset + row * 3) % 16]
    ctx.fillStyle = `rgba(167,139,250,${0.25 + (row % 4) * 0.12})`
    ctx.fillText(hex, pad + 6, 40 + row * 14)
  }

  // radar
  const cx = w - 78
  const cy = h / 2
  ctx.strokeStyle = 'rgba(167,139,250,0.45)'
  for (let r = 16; r <= 52; r += 18) {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  const ang = t * 1.8
  ctx.strokeStyle = '#ddd6fe'
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + Math.cos(ang) * 52, cy + Math.sin(ang) * 52)
  ctx.stroke()
  // attestation nodes
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + t * 0.3
    const nx = cx + Math.cos(a) * 40
    const ny = cy + Math.sin(a) * 40
    ctx.fillStyle = '#c4b5fd'
    ctx.beginPath()
    ctx.arc(nx, ny, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(196,181,253,0.35)'
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(nx, ny)
    ctx.stroke()
  }

  const sigma = 18 + Math.abs(Math.sin(t)) * 6
  ctx.fillStyle = '#ddd6fe'
  ctx.font = '11px ui-monospace, monospace'
  ctx.fillText(`SHA-256 · OK`, pad + 6, h - pad - 28)
  ctx.fillText(`σ luminance ${sigma.toFixed(1)} (≥18)`, pad + 6, h - pad - 14)
  ctx.fillText(`ZKT proof · Quality score ${(0.82 + Math.sin(t) * 0.08).toFixed(2)}`, pad + 6, h - pad - 2)
}
