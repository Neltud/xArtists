/**
 * Salle holo 360° — éclairage fort mobile, zoom caméra au clic, modal inspect 2D HD.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { PackId } from '../config/agentPacks'

type Theme = {
  primary: number
  secondary: number
  fog: number
  label: string
}

const THEMES: Record<PackId | 'hub', Theme> = {
  pulse: { primary: 0x10b981, secondary: 0x34d399, fog: 0x0a1a14, label: 'PULSE · FULL' },
  yield: { primary: 0xf59e0b, secondary: 0xfbbf24, fog: 0x1a1408, label: 'YIELD · DEFI' },
  sentinel: { primary: 0x38bdf8, secondary: 0x7dd3fc, fog: 0x0a1220, label: 'SENTINEL · GUARD' },
  hub: { primary: 0x22d3ee, secondary: 0xa78bfa, fog: 0x0c1018, label: 'COMMAND HUB' },
}

type LiveSnap = {
  btc: number | null
  eth: number | null
  sol: number | null
  egld: number | null
  tao: number | null
  gold: number | null
  sentiment: number
  vol: number
  ts: string
}

type PanelKind = 'prices' | 'signals' | 'coords' | 'sheet' | 'oscillo' | 'depth'

const PANEL_TITLES: Record<PanelKind, string> = {
  prices: 'Prix live',
  signals: 'Signaux',
  coords: 'Axes & métriques',
  sheet: 'Tableur',
  oscillo: 'Oscillo',
  depth: 'Depth',
}

async function fetchSnap(): Promise<Partial<LiveSnap>> {
  const out: Partial<LiveSnap> = { ts: new Date().toISOString().slice(11, 19) }
  try {
    const r = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,bittensor,elrond-erd-2,pax-gold&vs_currencies=usd',
      { cache: 'no-store' },
    )
    if (r.ok) {
      const j = await r.json()
      out.btc = Number(j.bitcoin?.usd) || null
      out.eth = Number(j.ethereum?.usd) || null
      out.sol = Number(j.solana?.usd) || null
      out.tao = Number(j.bittensor?.usd) || null
      out.egld = Number(j['elrond-erd-2']?.usd) || null
      out.gold = Number(j['pax-gold']?.usd) || null
    }
  } catch {
    /* */
  }
  if (out.egld == null) {
    try {
      const r = await fetch('https://api.multiversx.com/economics', { cache: 'no-store' })
      if (r.ok) {
        const j = await r.json()
        out.egld = Number(j.price) || null
      }
    } catch {
      /* */
    }
  }
  return out
}

function hexCss(n: number) {
  return `#${n.toString(16).padStart(6, '0')}`
}

function fmtUsd(v: number | null) {
  if (v == null) return '—'
  if (v >= 1000) return `$${Math.round(v).toLocaleString()}`
  if (v >= 10) return `$${v.toFixed(2)}`
  return `$${v.toFixed(3)}`
}

function drawAxes(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
  color: string,
  xLabel: string,
  yLabel: string,
) {
  ctx.strokeStyle = color
  ctx.lineWidth = 4
  ctx.globalAlpha = 0.95
  ctx.beginPath()
  ctx.moveTo(x0, y0 + h)
  ctx.lineTo(x0 + w, y0 + h)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x0, y0 + h)
  ctx.stroke()
  ctx.globalAlpha = 0.5
  for (let i = 0; i <= 5; i++) {
    const tx = x0 + (w * i) / 5
    ctx.beginPath()
    ctx.moveTo(tx, y0 + h)
    ctx.lineTo(tx, y0 + h + 8)
    ctx.stroke()
    const ty = y0 + (h * i) / 5
    ctx.beginPath()
    ctx.moveTo(x0 - 8, ty)
    ctx.lineTo(x0, ty)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  ctx.fillStyle = '#f4f4f5'
  ctx.font = 'bold 22px system-ui'
  ctx.fillText(xLabel, x0 + w - 50, y0 + h + 32)
  ctx.save()
  ctx.translate(x0 - 22, y0 + 28)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText(yLabel, 0, 0)
  ctx.restore()
}

function paintPriceChart(snap: LiveSnap, theme: Theme, title: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1280
  canvas.height = 960
  const ctx = canvas.getContext('2d')!
  const prim = hexCss(theme.primary)
  const sec = hexCss(theme.secondary)

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, 1280, 960)
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  for (let x = 0; x < 1280; x += 64) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 960)
    ctx.stroke()
  }
  for (let y = 0; y < 960; y += 64) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(1280, y)
    ctx.stroke()
  }

  ctx.strokeStyle = prim
  ctx.lineWidth = 16
  ctx.strokeRect(28, 28, 1224, 904)

  ctx.fillStyle = '#fafafa'
  ctx.font = 'bold 48px system-ui'
  ctx.fillText(title, 64, 88)
  ctx.fillStyle = sec
  ctx.font = '28px monospace'
  ctx.fillText(`UTC ${snap.ts} · LIVE`, 64, 132)

  const rows: [string, number | null][] = [
    ['BTC', snap.btc],
    ['ETH', snap.eth],
    ['SOL', snap.sol],
    ['TAO', snap.tao],
    ['EGLD', snap.egld],
    ['GOLD', snap.gold],
  ]
  const vals = rows.map(([, v]) => (v && v > 0 ? Math.log10(v + 1) : 0))
  const max = Math.max(...vals, 1)
  const chartX = 110
  const chartY = 180
  const chartW = 1040
  const chartH = 520
  drawAxes(ctx, chartX, chartY, chartW, chartH, sec, 'asset', 'log$')

  const bw = chartW / rows.length
  rows.forEach(([lab, v], i) => {
    const h = (vals[i] / max) * (chartH - 24)
    const x = chartX + i * bw + 24
    const y = chartY + chartH - h
    const g = ctx.createLinearGradient(x, y, x, chartY + chartH)
    g.addColorStop(0, prim)
    g.addColorStop(1, 'rgba(0,0,0,0.15)')
    ctx.fillStyle = g
    ctx.fillRect(x, y, bw - 48, h)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 32px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(lab, x + (bw - 48) / 2, chartY + chartH + 48)
    ctx.fillStyle = sec
    ctx.font = 'bold 26px monospace'
    ctx.fillText(fmtUsd(v), x + (bw - 48) / 2, y - 16)
    ctx.textAlign = 'left'
  })

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function paintSignalTable(snap: LiveSnap, theme: Theme, packLabel: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1280
  canvas.height = 960
  const ctx = canvas.getContext('2d')!
  const prim = hexCss(theme.primary)

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, 1280, 960)
  ctx.strokeStyle = prim
  ctx.lineWidth = 14
  ctx.strokeRect(24, 24, 1232, 912)

  ctx.fillStyle = '#fafafa'
  ctx.font = 'bold 44px system-ui'
  ctx.fillText(`SIGNALS · ${packLabel}`, 56, 86)

  const kinds = packLabel.includes('YIELD')
    ? ['YIELD_CLAIM', 'LP_REBAL', 'COMPOUND', 'HATOM', 'CLAIM_Q', 'POOL_Δ']
    : packLabel.includes('SENTINEL')
      ? ['GUARD', 'DRAWDOWN', 'ALERT', 'RISK', 'BOARD', 'WATCH']
      : ['MICRO_ARB', 'MOMENTUM', 'MEAN_REV', 'BOARD', 'FLOW', 'PULSE']

  const headerY = 140
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.fillRect(48, headerY, 1184, 48)
  ctx.fillStyle = '#e4e4e7'
  ctx.font = 'bold 26px monospace'
  ;['#', 'SIGNAL', 'SCORE', 'STATUS', 'UTC'].forEach((h, i) => {
    ctx.fillText(h, 72 + i * 220, headerY + 34)
  })

  kinds.forEach((k, i) => {
    const y = 220 + i * 90
    const score = 55 + ((i * 17 + Math.floor(snap.sentiment * 20) + i * 3) % 40)
    const status = score > 75 ? 'HOT' : score > 60 ? 'ACTIVE' : 'IDLE'
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'transparent'
    ctx.fillRect(48, y - 28, 1184, 80)
    ctx.fillStyle = '#f4f4f5'
    ctx.font = '28px monospace'
    ctx.fillText(String(i + 1).padStart(2, '0'), 72, y + 12)
    ctx.fillStyle = prim
    ctx.font = 'bold 28px monospace'
    ctx.fillText(k, 292, y + 12)
    ctx.fillStyle = score > 70 ? '#34d399' : '#fbbf24'
    ctx.fillText(String(score), 512, y + 12)
    ctx.fillStyle = status === 'HOT' ? '#fb7185' : '#a1a1aa'
    ctx.fillText(status, 732, y + 12)
    ctx.fillStyle = '#a1a1aa'
    ctx.fillText(snap.ts, 952, y + 12)
  })

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function paintCoords(theme: Theme, snap: LiveSnap): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1280
  canvas.height = 960
  const ctx = canvas.getContext('2d')!
  const prim = hexCss(theme.primary)
  const sec = hexCss(theme.secondary)

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, 1280, 960)
  ctx.strokeStyle = prim
  ctx.lineWidth = 14
  ctx.strokeRect(24, 24, 1232, 912)

  ctx.fillStyle = '#fafafa'
  ctx.font = 'bold 44px system-ui'
  ctx.fillText('COORD · AXES · MATRIX', 56, 86)

  const ox = 320
  const oy = 520
  ctx.strokeStyle = '#f43f5e'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(ox, oy)
  ctx.lineTo(ox + 260, oy)
  ctx.stroke()
  ctx.fillStyle = '#fda4af'
  ctx.font = 'bold 28px monospace'
  ctx.fillText('X · time', ox + 270, oy + 10)

  ctx.strokeStyle = '#22c55e'
  ctx.beginPath()
  ctx.moveTo(ox, oy)
  ctx.lineTo(ox, oy - 240)
  ctx.stroke()
  ctx.fillStyle = '#86efac'
  ctx.fillText('Y · price', ox - 24, oy - 255)

  ctx.strokeStyle = '#3b82f6'
  ctx.beginPath()
  ctx.moveTo(ox, oy)
  ctx.lineTo(ox - 140, oy + 120)
  ctx.stroke()
  ctx.fillStyle = '#93c5fd'
  ctx.fillText('Z · vol', ox - 210, oy + 145)

  ctx.fillStyle = sec
  ctx.beginPath()
  ctx.arc(ox, oy, 10, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.fillRect(620, 160, 560, 620)
  ctx.strokeStyle = sec
  ctx.lineWidth = 3
  ctx.strokeRect(620, 160, 560, 620)

  const metrics: [string, string][] = [
    ['sentiment', snap.sentiment.toFixed(3)],
    ['volatility', snap.vol.toFixed(3)],
    ['EGLD', fmtUsd(snap.egld)],
    ['BTC', fmtUsd(snap.btc)],
    ['ETH', fmtUsd(snap.eth)],
    ['SOL', fmtUsd(snap.sol)],
    ['TAO', fmtUsd(snap.tao)],
    ['GOLD', fmtUsd(snap.gold)],
    ['epoch', snap.ts],
  ]
  metrics.forEach(([k, v], i) => {
    const y = 220 + i * 58
    ctx.fillStyle = '#a1a1aa'
    ctx.font = '26px monospace'
    ctx.fillText(k, 660, y)
    ctx.fillStyle = '#fafafa'
    ctx.font = 'bold 28px monospace'
    ctx.fillText(v, 900, y)
  })

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function paintSpreadsheet(snap: LiveSnap, theme: Theme): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1280
  canvas.height = 960
  const ctx = canvas.getContext('2d')!
  const prim = hexCss(theme.primary)

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, 1280, 960)
  ctx.strokeStyle = prim
  ctx.lineWidth = 14
  ctx.strokeRect(24, 24, 1232, 912)

  ctx.fillStyle = '#fafafa'
  ctx.font = 'bold 40px system-ui'
  ctx.fillText('TABLEUR · MARKET MATRIX', 56, 82)

  const cols = ['Asset', 'USD', 'log10', 'w-score', 'bias']
  const assets: [string, number | null][] = [
    ['BTC', snap.btc],
    ['ETH', snap.eth],
    ['SOL', snap.sol],
    ['TAO', snap.tao],
    ['EGLD', snap.egld],
    ['XAU', snap.gold],
  ]
  const colW = [180, 200, 180, 180, 160]
  const startX = 72
  const startY = 120

  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.fillRect(startX, startY, 1120, 52)
  ctx.fillStyle = '#f4f4f5'
  ctx.font = 'bold 26px monospace'
  let x = startX + 16
  cols.forEach((c, i) => {
    ctx.fillText(c, x, startY + 36)
    x += colW[i]
  })

  assets.forEach(([name, usd], row) => {
    const y = startY + 70 + row * 90
    ctx.fillStyle = row % 2 ? 'rgba(255,255,255,0.05)' : 'transparent'
    ctx.fillRect(startX, y - 28, 1120, 84)
    const logv = usd && usd > 0 ? Math.log10(usd + 1) : 0
    const wscore = Math.round(40 + logv * 12 + snap.sentiment * 10)
    const bias = snap.sentiment >= 0 ? 'LONG' : 'SHORT'
    const cells = [
      name,
      usd != null ? usd.toFixed(usd >= 100 ? 0 : 2) : '—',
      logv.toFixed(3),
      String(wscore),
      bias,
    ]
    x = startX + 16
    cells.forEach((cell, i) => {
      ctx.fillStyle =
        i === 0 ? prim : i === 4 ? (bias === 'LONG' ? '#34d399' : '#f43f5e') : '#f4f4f5'
      ctx.font = i === 0 ? 'bold 30px monospace' : '26px monospace'
      ctx.fillText(cell, x, y + 20)
      x += colW[i]
    })
  })

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function paintSparkline(theme: Theme, snap: LiveSnap): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1280
  canvas.height = 960
  const ctx = canvas.getContext('2d')!
  const prim = hexCss(theme.primary)
  const sec = hexCss(theme.secondary)

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, 1280, 960)
  ctx.strokeStyle = prim
  ctx.lineWidth = 14
  ctx.strokeRect(24, 24, 1232, 912)

  ctx.fillStyle = '#fafafa'
  ctx.font = 'bold 44px system-ui'
  ctx.fillText('OSCILLO · SENTIMENT / VOL', 56, 86)

  const x0 = 100
  const y0 = 160
  const w = 1080
  const h = 580
  drawAxes(ctx, x0, y0, w, h, sec, 't', 'σ')

  ctx.beginPath()
  ctx.strokeStyle = prim
  ctx.lineWidth = 4
  for (let i = 0; i <= 80; i++) {
    const t = i / 80
    const wave =
      Math.sin(t * Math.PI * 4 + snap.sentiment * 2) * 0.35 +
      Math.sin(t * Math.PI * 9) * snap.vol * 0.4 +
      snap.sentiment * 0.2
    const x = x0 + t * w
    const y = y0 + h / 2 - wave * (h * 0.4)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  ctx.beginPath()
  ctx.strokeStyle = sec
  ctx.lineWidth = 3
  ctx.setLineDash([10, 10])
  for (let i = 0; i <= 80; i++) {
    const t = i / 80
    const wave = Math.cos(t * Math.PI * 3) * snap.vol * 0.5
    const x = x0 + t * w
    const y = y0 + h / 2 - wave * (h * 0.35)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = '#fafafa'
  ctx.font = 'bold 28px monospace'
  ctx.fillText(`sent ${snap.sentiment.toFixed(2)}   vol ${snap.vol.toFixed(2)}`, 100, 860)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function InspectModal({
  kind,
  snap,
  theme,
  onClose,
}: {
  kind: PanelKind
  snap: LiveSnap
  theme: Theme
  onClose: () => void
}) {
  const prim = hexCss(theme.primary)
  const assets: [string, number | null][] = [
    ['BTC', snap.btc],
    ['ETH', snap.eth],
    ['SOL', snap.sol],
    ['TAO', snap.tao],
    ['EGLD', snap.egld],
    ['GOLD', snap.gold],
  ]

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-3"
      role="dialog"
      aria-modal
      onClick={onClose}
    >
      <div
        className="glass-hud w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 space-y-4 shadow-[0_0_40px_rgba(34,211,238,0.2)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-tech uppercase tracking-widest text-cyan-300/90">
              Inspect · {PANEL_TITLES[kind]}
            </p>
            <h2 className="text-lg font-bold text-white font-tech">{theme.label}</h2>
            <p className="text-[11px] text-zinc-500 mono">UTC {snap.ts}</p>
          </div>
          <button type="button" className="btn-secondary text-xs px-3 py-1.5" onClick={onClose}>
            ✕ Fermer
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {assets.map(([lab, v]) => (
            <div key={lab} className="rounded-xl border border-white/10 bg-black/40 p-3">
              <p className="text-[10px] text-zinc-500 font-tech">{lab}</p>
              <p className="text-lg font-bold tabular-nums text-white" style={{ color: prim }}>
                {fmtUsd(v)}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-1">
          <p className="text-[11px] text-zinc-400">
            Sentiment <span className="text-white font-mono">{snap.sentiment.toFixed(3)}</span>
          </p>
          <p className="text-[11px] text-zinc-400">
            Volatility <span className="text-white font-mono">{snap.vol.toFixed(3)}</span>
          </p>
          <div className="h-2 rounded-full bg-white/10 mt-2 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, Math.abs(snap.sentiment) * 100 + 40)}%`,
                background: prim,
              }}
            />
          </div>
        </div>

        {(kind === 'signals' || kind === 'sheet') && (
          <p className="text-[10px] text-zinc-600">
            Scores paper · pas un conseil d'investissement
          </p>
        )}
      </div>
    </div>
  )
}

type Props = {
  mode?: PackId | 'hub'
  sentiment?: number
  volatility?: number
  height?: number
}

const KINDS: PanelKind[] = ['prices', 'signals', 'coords', 'sheet', 'oscillo', 'depth']

export default function HoloDataRoom({
  mode = 'hub',
  sentiment = 0.1,
  volatility = 0.35,
  height = 520,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const [inspect, setInspect] = useState<PanelKind | null>(null)
  const zoomApi = useRef<{ zoomTo: (i: number) => void; reset: () => void } | null>(null)
  const [snap, setSnap] = useState<LiveSnap>({
    btc: null,
    eth: null,
    sol: null,
    egld: null,
    tao: null,
    gold: null,
    sentiment,
    vol: volatility,
    ts: '--:--:--',
  })

  useEffect(() => {
    let c = false
    const run = async () => {
      const p = await fetchSnap()
      if (!c)
        setSnap(s => ({
          ...s,
          ...p,
          sentiment,
          vol: volatility,
          ts: p.ts || new Date().toISOString().slice(11, 19),
        }))
    }
    void run()
    const id = window.setInterval(() => void run(), 45_000)
    return () => {
      c = true
      window.clearInterval(id)
    }
  }, [sentiment, volatility])

  const resetZoom = useCallback(() => {
    zoomApi.current?.reset()
    setZoomed(false)
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host || failed) return

    let renderer: THREE.WebGLRenderer | null = null
    let raf = 0
    const disposables: { dispose: () => void }[] = []
    const theme = THEMES[mode] || THEMES.hub

    try {
      const w = Math.max(320, host.clientWidth || 400)
      const h = Math.max(420, height)

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(theme.fog)
      scene.fog = new THREE.FogExp2(theme.fog, 0.01)

      const isMobile = w < 640
      const baseFov = isMobile ? 38 : 55
      const camera = new THREE.PerspectiveCamera(baseFov, w / h, 0.1, 80)
      const homePos = new THREE.Vector3(0, isMobile ? 1.65 : 1.7, isMobile ? 0.05 : 0.28)
      camera.position.copy(homePos)
      let camTarget = homePos.clone()
      let lookAt = new THREE.Vector3(0, 1.65, 0)
      let lookTarget = lookAt.clone()
      let fovTarget = baseFov

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      host.innerHTML = ''
      host.appendChild(renderer.domElement)

      scene.add(new THREE.AmbientLight(0xffffff, 1.5))
      const key = new THREE.DirectionalLight(0xffffff, 1.8)
      key.position.set(2, 8, 4)
      scene.add(key)
      const fill = new THREE.DirectionalLight(0xaaccff, 1.0)
      fill.position.set(-4, 3, -2)
      scene.add(fill)
      const spot = new THREE.SpotLight(theme.primary, 2.2, 24, Math.PI / 4.2, 0.35, 1)
      spot.position.set(0, 4.5, 0)
      spot.target.position.set(0, 1.5, 0)
      scene.add(spot)
      scene.add(spot.target)
      const p1 = new THREE.PointLight(theme.primary, 2.4, 30)
      p1.position.set(-2, 3, 2)
      scene.add(p1)
      const p2 = new THREE.PointLight(theme.secondary, 2.0, 26)
      p2.position.set(2.5, 2.5, -1.5)
      scene.add(p2)

      const floorGeo = new THREE.CircleGeometry(8.5, 48)
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x141820,
        metalness: 0.55,
        roughness: 0.35,
        emissive: theme.primary,
        emissiveIntensity: 0.18,
      })
      const floor = new THREE.Mesh(floorGeo, floorMat)
      floor.rotation.x = -Math.PI / 2
      scene.add(floor)
      disposables.push(floorGeo, floorMat)

      const grid = new THREE.GridHelper(14, 28, theme.primary, theme.secondary)
      grid.position.y = 0.02
      scene.add(grid)

      const ringGeo = new THREE.TorusGeometry(5.6, 0.04, 8, 64)
      const ringMat = new THREE.MeshBasicMaterial({ color: theme.primary })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2
      ring.position.y = 3.3
      scene.add(ring)
      disposables.push(ringGeo, ringMat)

      const panels: THREE.Mesh[] = []
      const live: LiveSnap = { ...snap, sentiment, vol: volatility }
      const makers = [
        () => paintPriceChart(live, theme, `PRICES · ${theme.label}`),
        () => paintSignalTable(live, theme, theme.label),
        () => paintCoords(theme, live),
        () => paintSpreadsheet(live, theme),
        () => paintSparkline(live, theme),
        () => paintPriceChart(live, theme, `DEPTH · ${theme.label}`),
      ]

      const n = makers.length
      const radius = isMobile ? 3.35 : 4.0
      makers.forEach((mk, i) => {
        const tex = mk()
        const mat = new THREE.MeshStandardMaterial({
          map: tex,
          emissive: new THREE.Color(theme.primary),
          emissiveIntensity: 0.85,
          roughness: 0.22,
          metalness: 0.15,
        })
        const geo = new THREE.PlaneGeometry(2.55, 1.95)
        const mesh = new THREE.Mesh(geo, mat)
        const ang = (i / n) * Math.PI * 2 - Math.PI / 2
        mesh.position.set(Math.cos(ang) * radius, 1.75, Math.sin(ang) * radius)
        mesh.lookAt(0, 1.75, 0)
        mesh.userData.baseY = 1.75
        mesh.userData.kind = KINDS[i]
        mesh.userData.index = i
        mesh.userData.ang = ang
        scene.add(mesh)
        panels.push(mesh)
        disposables.push(geo, mat, tex)
      })

      const pillarGeo = new THREE.CylinderGeometry(0.08, 0.12, 2.8, 12)
      const pillarMat = new THREE.MeshStandardMaterial({
        color: theme.primary,
        emissive: theme.primary,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.75,
      })
      const pillar = new THREE.Mesh(pillarGeo, pillarMat)
      pillar.position.y = 1.4
      scene.add(pillar)
      disposables.push(pillarGeo, pillarMat)

      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()

      const onPointer = (ev: PointerEvent) => {
        const rect = renderer!.domElement.getBoundingClientRect()
        pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObjects(panels)
        if (hits.length) {
          const idx = hits[0].object.userData.index as number
          const kind = hits[0].object.userData.kind as PanelKind
          const ang = hits[0].object.userData.ang as number
          const r = radius * 0.55
          camTarget.set(Math.cos(ang) * r, 1.7, Math.sin(ang) * r)
          lookTarget.set(Math.cos(ang) * radius, 1.75, Math.sin(ang) * radius)
          fovTarget = isMobile ? 32 : 42
          setZoomed(true)
          setInspect(kind)
        }
      }
      renderer.domElement.addEventListener('pointerdown', onPointer)

      zoomApi.current = {
        zoomTo: (i: number) => {
          const mesh = panels[i]
          if (!mesh) return
          const ang = mesh.userData.ang as number
          const r = radius * 0.55
          camTarget.set(Math.cos(ang) * r, 1.7, Math.sin(ang) * r)
          lookTarget.set(Math.cos(ang) * radius, 1.75, Math.sin(ang) * radius)
          fovTarget = isMobile ? 32 : 42
          setZoomed(true)
        },
        reset: () => {
          camTarget.copy(homePos)
          lookTarget.set(0, 1.65, 0)
          fovTarget = baseFov
          setZoomed(false)
        },
      }

      let t0 = performance.now()
      const animate = () => {
        raf = requestAnimationFrame(animate)
        const t = (performance.now() - t0) / 1000
        camera.position.lerp(camTarget, 0.08)
        lookAt.lerp(lookTarget, 0.08)
        camera.lookAt(lookAt)
        camera.fov += (fovTarget - camera.fov) * 0.08
        camera.updateProjectionMatrix()
        panels.forEach((m, i) => {
          m.position.y = m.userData.baseY + Math.sin(t * 1.1 + i * 0.7) * 0.04
          const mat = m.material as THREE.MeshStandardMaterial
          mat.emissiveIntensity = 0.78 + Math.sin(t * 1.2 + i) * 0.12
        })
        ring.rotation.z = t * 0.15
        renderer!.render(scene, camera)
      }
      animate()

      const onResize = () => {
        if (!host || !renderer) return
        const nw = Math.max(320, host.clientWidth || 400)
        const nh = Math.max(420, height)
        camera.aspect = nw / nh
        camera.updateProjectionMatrix()
        renderer.setSize(nw, nh)
      }
      window.addEventListener('resize', onResize)

      return () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        renderer?.domElement.removeEventListener('pointerdown', onPointer)
        renderer?.dispose()
        host.innerHTML = ''
        disposables.forEach(d => {
          try {
            d.dispose()
          } catch {
            /* */
          }
        })
        zoomApi.current = null
      }
    } catch (e) {
      console.error('[HoloDataRoom]', e)
      setFailed(true)
    }
  }, [mode, height, failed, sentiment, volatility, snap.btc, snap.egld])

  const theme = THEMES[mode] || THEMES.hub

  if (failed) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/50 p-6 text-center text-sm text-zinc-400">
        WebGL indisponible — utilise le tape prix HTML ci-dessus.
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-cyan-500/20 bg-black/40">
      <div ref={hostRef} style={{ height, width: '100%' }} className="touch-none" />
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 pointer-events-auto">
        {zoomed && (
          <button type="button" className="btn-secondary text-xs" onClick={resetZoom}>
            ✕ Dézoomer
          </button>
        )}
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => setInspect(inspect ? null : 'prices')}
        >
          🔍 Inspecter
        </button>
      </div>

      {inspect && (
        <InspectModal kind={inspect} snap={snap} theme={theme} onClose={() => setInspect(null)} />
      )}
    </div>
  )
}
