/**
 * Salle holographique 360° — murs projetés avec graphiques, tableaux, axes, chiffres live.
 * Style monument (HomeMenuHall) + densité data max.
 */
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { PackId } from '../config/agentPacks'

type Theme = {
  primary: number
  secondary: number
  fog: number
  label: string
}

const THEMES: Record<PackId | 'hub', Theme> = {
  pulse: { primary: 0x10b981, secondary: 0x34d399, fog: 0x04110c, label: 'PULSE · FULL' },
  yield: { primary: 0xf59e0b, secondary: 0xfbbf24, fog: 0x120e04, label: 'YIELD · DEFI' },
  sentinel: { primary: 0x38bdf8, secondary: 0x7dd3fc, fog: 0x040816, label: 'SENTINEL · GUARD' },
  hub: { primary: 0x22d3ee, secondary: 0xa78bfa, fog: 0x05030a, label: 'COMMAND HUB' },
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
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.7
  // X
  ctx.beginPath()
  ctx.moveTo(x0, y0 + h)
  ctx.lineTo(x0 + w, y0 + h)
  ctx.stroke()
  // Y
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x0, y0 + h)
  ctx.stroke()
  // ticks
  ctx.globalAlpha = 0.4
  for (let i = 0; i <= 5; i++) {
    const tx = x0 + (w * i) / 5
    ctx.beginPath()
    ctx.moveTo(tx, y0 + h)
    ctx.lineTo(tx, y0 + h + 6)
    ctx.stroke()
    const ty = y0 + (h * i) / 5
    ctx.beginPath()
    ctx.moveTo(x0 - 6, ty)
    ctx.lineTo(x0, ty)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  ctx.fillStyle = color
  ctx.font = '18px monospace'
  ctx.fillText(xLabel, x0 + w - 40, y0 + h + 28)
  ctx.save()
  ctx.translate(x0 - 18, y0 + 20)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText(yLabel, 0, 0)
  ctx.restore()
}

function paintPriceChart(snap: LiveSnap, theme: Theme, title: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 768
  const ctx = canvas.getContext('2d')!
  const prim = hexCss(theme.primary)
  const sec = hexCss(theme.secondary)

  ctx.fillStyle = '#06050c'
  ctx.fillRect(0, 0, 1024, 768)
  // grid
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  for (let x = 0; x < 1024; x += 64) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 768)
    ctx.stroke()
  }
  for (let y = 0; y < 768; y += 64) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(1024, y)
    ctx.stroke()
  }

  ctx.strokeStyle = prim
  ctx.lineWidth = 10
  ctx.strokeRect(24, 24, 976, 720)

  ctx.fillStyle = prim
  ctx.font = 'bold 36px system-ui'
  ctx.fillText(title, 56, 72)
  ctx.fillStyle = '#a1a1aa'
  ctx.font = '22px monospace'
  ctx.fillText(`UTC ${snap.ts} · live`, 56, 108)

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
  const chartX = 100
  const chartY = 160
  const chartW = 820
  const chartH = 420
  drawAxes(ctx, chartX, chartY, chartW, chartH, sec, 'asset', 'log$')

  const bw = chartW / rows.length
  rows.forEach(([lab, v], i) => {
    const h = (vals[i] / max) * (chartH - 20)
    const x = chartX + i * bw + 20
    const y = chartY + chartH - h
    const g = ctx.createLinearGradient(x, y, x, chartY + chartH)
    g.addColorStop(0, prim)
    g.addColorStop(1, 'rgba(0,0,0,0.2)')
    ctx.fillStyle = g
    ctx.fillRect(x, y, bw - 40, h)
    ctx.fillStyle = '#fafafa'
    ctx.font = 'bold 22px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(lab, x + (bw - 40) / 2, chartY + chartH + 36)
    ctx.fillStyle = sec
    ctx.font = '18px monospace'
    const txt = v != null ? (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v.toFixed(0)}`) : '—'
    ctx.fillText(txt, x + (bw - 40) / 2, y - 12)
    ctx.textAlign = 'left'
  })

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function paintSignalTable(snap: LiveSnap, theme: Theme, packLabel: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 768
  const ctx = canvas.getContext('2d')!
  const prim = hexCss(theme.primary)

  ctx.fillStyle = '#05040a'
  ctx.fillRect(0, 0, 1024, 768)
  ctx.strokeStyle = prim
  ctx.lineWidth = 8
  ctx.strokeRect(20, 20, 984, 728)

  ctx.fillStyle = prim
  ctx.font = 'bold 32px system-ui'
  ctx.fillText(`SIGNALS · ${packLabel}`, 48, 68)
  ctx.fillStyle = '#71717a'
  ctx.font = '18px monospace'
  ctx.fillText('kind | score | status | t', 48, 100)

  const kinds =
    packLabel.includes('YIELD')
      ? ['YIELD_CLAIM', 'LP_REBAL', 'COMPOUND', 'HATOM', 'CLAIM_Q', 'POOL_Δ']
      : packLabel.includes('SENTINEL')
        ? ['GUARD', 'DRAWDOWN', 'ALERT', 'RISK', 'BOARD', 'WATCH']
        : ['MICRO_ARB', 'MOMENTUM', 'MEAN_REV', 'BOARD', 'FLOW', 'PULSE']

  const headerY = 140
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.fillRect(40, headerY, 944, 40)
  ctx.fillStyle = '#a1a1aa'
  ctx.font = 'bold 20px monospace'
  ;['#', 'SIGNAL', 'SCORE', 'STATUS', 'UTC'].forEach((h, i) => {
    ctx.fillText(h, 56 + i * 180, headerY + 28)
  })

  kinds.forEach((k, i) => {
    const y = 200 + i * 70
    const score = 55 + ((i * 17 + Math.floor(snap.sentiment * 20) + i * 3) % 40)
    const status = score > 75 ? 'HOT' : score > 60 ? 'ACTIVE' : 'IDLE'
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent'
    ctx.fillRect(40, y - 20, 944, 60)
    ctx.fillStyle = '#e4e4e7'
    ctx.font = '22px monospace'
    ctx.fillText(String(i + 1).padStart(2, '0'), 56, y + 10)
    ctx.fillStyle = prim
    ctx.font = 'bold 22px monospace'
    ctx.fillText(k, 236, y + 10)
    ctx.fillStyle = score > 70 ? '#34d399' : '#fbbf24'
    ctx.fillText(String(score), 416, y + 10)
    ctx.fillStyle = status === 'HOT' ? '#f43f5e' : '#a1a1aa'
    ctx.fillText(status, 596, y + 10)
    ctx.fillStyle = '#71717a'
    ctx.fillText(snap.ts, 776, y + 10)
  })

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function paintCoords(theme: Theme, snap: LiveSnap): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 768
  const ctx = canvas.getContext('2d')!
  const prim = hexCss(theme.primary)
  const sec = hexCss(theme.secondary)

  ctx.fillStyle = '#04030a'
  ctx.fillRect(0, 0, 1024, 768)
  ctx.strokeStyle = prim
  ctx.lineWidth = 8
  ctx.strokeRect(20, 20, 984, 728)

  ctx.fillStyle = prim
  ctx.font = 'bold 32px system-ui'
  ctx.fillText('COORD · AXES · MATRIX', 48, 70)

  // 3D-ish axis diagram
  const ox = 280
  const oy = 420
  ctx.strokeStyle = '#f43f5e'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(ox, oy)
  ctx.lineTo(ox + 220, oy)
  ctx.stroke()
  ctx.fillStyle = '#f43f5e'
  ctx.font = '24px monospace'
  ctx.fillText('X · time', ox + 230, oy + 8)

  ctx.strokeStyle = '#22c55e'
  ctx.beginPath()
  ctx.moveTo(ox, oy)
  ctx.lineTo(ox, oy - 200)
  ctx.stroke()
  ctx.fillStyle = '#22c55e'
  ctx.fillText('Y · price', ox - 20, oy - 210)

  ctx.strokeStyle = '#3b82f6'
  ctx.beginPath()
  ctx.moveTo(ox, oy)
  ctx.lineTo(ox - 120, oy + 100)
  ctx.stroke()
  ctx.fillStyle = '#3b82f6'
  ctx.fillText('Z · vol', ox - 180, oy + 120)

  // origin point
  ctx.fillStyle = sec
  ctx.beginPath()
  ctx.arc(ox, oy, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = '18px monospace'
  ctx.fillText('O (0,0,0)', ox + 12, oy - 12)

  // metrics block
  ctx.fillStyle = 'rgba(255,255,255,0.05)'
  ctx.fillRect(520, 140, 440, 480)
  ctx.strokeStyle = sec
  ctx.lineWidth = 2
  ctx.strokeRect(520, 140, 440, 480)

  const metrics: [string, string][] = [
    ['sentiment', snap.sentiment.toFixed(3)],
    ['volatility', snap.vol.toFixed(3)],
    ['EGLD USD', snap.egld != null ? snap.egld.toFixed(2) : '—'],
    ['BTC USD', snap.btc != null ? Math.round(snap.btc).toLocaleString() : '—'],
    ['ETH USD', snap.eth != null ? Math.round(snap.eth).toLocaleString() : '—'],
    ['SOL USD', snap.sol != null ? snap.sol.toFixed(1) : '—'],
    ['TAO USD', snap.tao != null ? snap.tao.toFixed(0) : '—'],
    ['GOLD USD', snap.gold != null ? snap.gold.toFixed(0) : '—'],
    ['epoch', snap.ts],
    ['frame', 'holo-360'],
  ]
  metrics.forEach(([k, v], i) => {
    const y = 190 + i * 40
    ctx.fillStyle = '#71717a'
    ctx.font = '20px monospace'
    ctx.fillText(k, 548, y)
    ctx.fillStyle = prim
    ctx.font = 'bold 22px monospace'
    ctx.fillText(v, 760, y)
  })

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function paintSpreadsheet(snap: LiveSnap, theme: Theme): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 768
  const ctx = canvas.getContext('2d')!
  const prim = hexCss(theme.primary)

  ctx.fillStyle = '#03020a'
  ctx.fillRect(0, 0, 1024, 768)
  ctx.strokeStyle = prim
  ctx.lineWidth = 8
  ctx.strokeRect(20, 20, 984, 728)

  ctx.fillStyle = prim
  ctx.font = 'bold 28px system-ui'
  ctx.fillText('TABLEUR · MARKET MATRIX', 48, 64)

  const cols = ['Asset', 'USD', 'log10', 'w-score', 'bias']
  const assets: [string, number | null][] = [
    ['BTC', snap.btc],
    ['ETH', snap.eth],
    ['SOL', snap.sol],
    ['TAO', snap.tao],
    ['EGLD', snap.egld],
    ['XAU', snap.gold],
  ]

  const colW = [160, 160, 160, 160, 160]
  const startX = 60
  const startY = 100

  // header
  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  ctx.fillRect(startX, startY, 900, 44)
  ctx.fillStyle = '#e4e4e7'
  ctx.font = 'bold 20px monospace'
  let x = startX + 12
  cols.forEach((c, i) => {
    ctx.fillText(c, x, startY + 30)
    x += colW[i]
  })

  assets.forEach(([name, usd], row) => {
    const y = startY + 50 + row * 70
    ctx.fillStyle = row % 2 ? 'rgba(255,255,255,0.03)' : 'transparent'
    ctx.fillRect(startX, y - 20, 900, 64)
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
    x = startX + 12
    cells.forEach((cell, i) => {
      ctx.fillStyle = i === 0 ? prim : i === 4 ? (bias === 'LONG' ? '#34d399' : '#f43f5e') : '#d4d4d8'
      ctx.font = i === 0 ? 'bold 22px monospace' : '20px monospace'
      ctx.fillText(cell, x, y + 18)
      x += colW[i]
    })
  })

  ctx.fillStyle = '#52525b'
  ctx.font = '16px monospace'
  ctx.fillText('paper scores · not investment advice · axes log10 USD', 48, 720)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function paintSparkline(theme: Theme, snap: LiveSnap): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 768
  const ctx = canvas.getContext('2d')!
  const prim = hexCss(theme.primary)
  const sec = hexCss(theme.secondary)

  ctx.fillStyle = '#05040c'
  ctx.fillRect(0, 0, 1024, 768)
  ctx.strokeStyle = prim
  ctx.lineWidth = 8
  ctx.strokeRect(20, 20, 984, 728)

  ctx.fillStyle = prim
  ctx.font = 'bold 32px system-ui'
  ctx.fillText('OSCILLO · SENTIMENT / VOL', 48, 70)

  const x0 = 80
  const y0 = 140
  const w = 860
  const h = 480
  drawAxes(ctx, x0, y0, w, h, sec, 't', 'σ')

  // synthetic series from sentiment/vol
  ctx.beginPath()
  ctx.strokeStyle = prim
  ctx.lineWidth = 3
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
  ctx.lineWidth = 2
  ctx.setLineDash([8, 8])
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

  ctx.fillStyle = prim
  ctx.font = '20px monospace'
  ctx.fillText(`sent ${snap.sentiment.toFixed(2)}  vol ${snap.vol.toFixed(2)}`, 80, 680)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

type Props = {
  mode?: PackId | 'hub'
  sentiment?: number
  volatility?: number
  height?: number
}

export default function HoloDataRoom({
  mode = 'hub',
  sentiment = 0.1,
  volatility = 0.35,
  height = 520,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
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

  useEffect(() => {
    const host = hostRef.current
    if (!host || failed) return

    let renderer: THREE.WebGLRenderer | null = null
    let raf = 0
    const disposables: { dispose: () => void }[] = []
    const theme = THEMES[mode] || THEMES.hub

    try {
      const w = Math.max(320, host.clientWidth || 400)
      const h = Math.max(400, height)

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(theme.fog)
      scene.fog = new THREE.FogExp2(theme.fog, 0.032)

      const camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 80)
      camera.position.set(0, 1.65, 0.15)

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
      host.innerHTML = ''
      host.appendChild(renderer.domElement)

      scene.add(new THREE.AmbientLight(0xffffff, 0.4))
      const key = new THREE.DirectionalLight(0xffffff, 0.9)
      key.position.set(3, 6, 2)
      scene.add(key)
      const p1 = new THREE.PointLight(theme.primary, 1.4, 22)
      p1.position.set(-3, 2.5, 2)
      scene.add(p1)
      const p2 = new THREE.PointLight(theme.secondary, 1.0, 20)
      p2.position.set(3, 2, -2)
      scene.add(p2)

      const floorGeo = new THREE.CircleGeometry(8.5, 48)
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x0a0810,
        metalness: 0.6,
        roughness: 0.3,
      })
      const floor = new THREE.Mesh(floorGeo, floorMat)
      floor.rotation.x = -Math.PI / 2
      scene.add(floor)
      disposables.push(floorGeo, floorMat)

      // floor grid helper look via ring
      const grid = new THREE.GridHelper(14, 28, theme.primary, 0x1a1520)
      grid.position.y = 0.02
      scene.add(grid)

      const ringGeo = new THREE.TorusGeometry(5.8, 0.035, 8, 64)
      const ringMat = new THREE.MeshBasicMaterial({ color: theme.primary })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2
      ring.position.y = 3.4
      scene.add(ring)
      disposables.push(ringGeo, ringMat)

      const panels: THREE.Mesh[] = []
      const live: LiveSnap = { ...snap, sentiment, vol: volatility }
      const textures = [
        paintPriceChart(live, theme, `PRICES · ${theme.label}`),
        paintSignalTable(live, theme, theme.label),
        paintCoords(theme, live),
        paintSpreadsheet(live, theme),
        paintSparkline(theme, live),
        paintPriceChart(live, theme, `DEPTH · ${theme.label}`),
      ]

      const n = textures.length
      const radius = 4.8
      textures.forEach((tex, i) => {
        const mat = new THREE.MeshStandardMaterial({
          map: tex,
          emissive: new THREE.Color(theme.primary),
          emissiveIntensity: 0.2,
          roughness: 0.35,
          metalness: 0.25,
        })
        const geo = new THREE.PlaneGeometry(2.4, 1.85)
        const mesh = new THREE.Mesh(geo, mat)
        const ang = (i / n) * Math.PI * 2 - Math.PI / 2
        mesh.position.set(Math.cos(ang) * radius, 1.7, Math.sin(ang) * radius)
        mesh.lookAt(0, 1.7, 0)
        mesh.userData.baseY = 1.7
        scene.add(mesh)
        panels.push(mesh)
        disposables.push(geo, mat, tex)
      })

      // center holo pillar
      const pillarGeo = new THREE.CylinderGeometry(0.08, 0.12, 2.8, 12)
      const pillarMat = new THREE.MeshStandardMaterial({
        color: theme.primary,
        emissive: theme.primary,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.7,
      })
      const pillar = new THREE.Mesh(pillarGeo, pillarMat)
      pillar.position.y = 1.4
      scene.add(pillar)
      disposables.push(pillarGeo, pillarMat)

      let yaw = 0
      let targetYaw = 0
      let dragging = false
      let lastX = 0

      const onDown = (ev: PointerEvent) => {
        dragging = true
        lastX = ev.clientX
        if (renderer) renderer.domElement.style.cursor = 'grabbing'
      }
      const onUp = () => {
        dragging = false
        if (renderer) renderer.domElement.style.cursor = 'grab'
      }
      const onMove = (ev: PointerEvent) => {
        if (!dragging) return
        targetYaw -= (ev.clientX - lastX) * 0.005
        lastX = ev.clientX
      }

      renderer.domElement.style.cursor = 'grab'
      renderer.domElement.addEventListener('pointerdown', onDown)
      window.addEventListener('pointerup', onUp)
      renderer.domElement.addEventListener('pointermove', onMove)

      const t0 = performance.now()
      const animate = () => {
        raf = requestAnimationFrame(animate)
        if (!renderer) return
        const t = (performance.now() - t0) / 1000
        if (!dragging) targetYaw += 0.0015
        yaw += (targetYaw - yaw) * 0.08
        camera.position.x = Math.sin(yaw) * 0.12
        camera.position.z = Math.cos(yaw) * 0.12
        camera.position.y = 1.65 + Math.sin(t * 0.4) * 0.04
        camera.rotation.set(0, yaw, 0)

        panels.forEach((p, i) => {
          p.position.y = (p.userData.baseY as number) + Math.sin(t * 0.8 + i * 0.4) * 0.05
          const m = p.material as THREE.MeshStandardMaterial
          m.emissiveIntensity = 0.15 + Math.sin(t * 1.2 + i) * 0.08
        })
        ring.rotation.z = t * 0.12
        pillar.rotation.y = t * 0.4
        renderer.render(scene, camera)
      }
      animate()

      const onResize = () => {
        if (!renderer || !host) return
        const nw = Math.max(320, host.clientWidth || 400)
        const nh = Math.max(400, height)
        camera.aspect = nw / nh
        camera.updateProjectionMatrix()
        renderer.setSize(nw, nh)
      }
      window.addEventListener('resize', onResize)

      return () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        window.removeEventListener('pointerup', onUp)
        if (renderer) {
          renderer.domElement.removeEventListener('pointerdown', onDown)
          renderer.domElement.removeEventListener('pointermove', onMove)
          renderer.dispose()
          if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement)
        }
        disposables.forEach(d => {
          try {
            d.dispose()
          } catch {
            /* */
          }
        })
      }
    } catch (e) {
      console.warn('[HoloDataRoom] WebGL fail', e)
      setFailed(true)
      return () => cancelAnimationFrame(raf)
    }
  }, [mode, failed, height]) // snap refresh via separate UI strip

  if (failed) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/60 p-4 space-y-3">
        <p className="text-[12px] text-zinc-400">Holo 360 indisponible — tableur 2D</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] mono">
            <thead>
              <tr className="text-zinc-500 text-left">
                <th className="p-1">Asset</th>
                <th className="p-1">USD</th>
              </tr>
            </thead>
            <tbody className="text-zinc-200">
              {(
                [
                  ['BTC', snap.btc],
                  ['ETH', snap.eth],
                  ['SOL', snap.sol],
                  ['EGLD', snap.egld],
                  ['TAO', snap.tao],
                  ['GOLD', snap.gold],
                ] as const
              ).map(([k, v]) => (
                <tr key={k} className="border-t border-white/5">
                  <td className="p-1">{k}</td>
                  <td className="p-1 tabular-nums">{v != null ? v.toFixed(2) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_0_60px_rgba(34,211,238,0.12)]">
      <div className="absolute top-2 left-3 z-10 flex flex-wrap gap-2 pointer-events-none">
        <span className="text-[9px] uppercase tracking-wider text-cyan-300/90 font-semibold">
          HOLO 360 · {THEMES[mode]?.label || mode}
        </span>
        <span className="text-[9px] rounded-full border border-white/15 px-2 py-0.5 text-zinc-300 tabular-nums">
          EGLD {snap.egld != null ? `$${snap.egld.toFixed(2)}` : '—'}
        </span>
        <span className="text-[9px] rounded-full border border-white/15 px-2 py-0.5 text-zinc-300 tabular-nums">
          BTC {snap.btc != null ? `$${Math.round(snap.btc / 1000)}k` : '—'}
        </span>
      </div>
      <div ref={hostRef} className="w-full" style={{ minHeight: height }} />
      <p className="absolute bottom-2 left-3 right-3 text-center text-[10px] text-zinc-400 pointer-events-none">
        Glisse pour tourner · 6 murs data (prix · signaux · axes · tableur · oscillo · depth)
      </p>
    </div>
  )
}
