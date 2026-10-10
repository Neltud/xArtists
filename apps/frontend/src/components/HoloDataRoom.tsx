/**
 * Salle holo 360° — éclairage fort mobile, zoom caméra au clic, modal inspect 2D HD.
 * Résilience: webglcontextlost / restored + retry UI.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { PackId } from '../config/agentPacks'

type Theme = { primary: number; secondary: number; fog: number; label: string }

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
  } catch { /* */ }
  if (out.egld == null) {
    try {
      const r = await fetch('https://api.multiversx.com/economics', { cache: 'no-store' })
      if (r.ok) {
        const j = await r.json()
        out.egld = Number(j.price) || null
      }
    } catch { /* */ }
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

/** Minimal canvas texture for a labeled panel */
function paintSimplePanel(title: string, lines: string[], theme: Theme): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 768
  const ctx = canvas.getContext('2d')!
  const prim = hexCss(theme.primary)
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, 1024, 768)
  ctx.strokeStyle = prim
  ctx.lineWidth = 12
  ctx.strokeRect(20, 20, 984, 728)
  ctx.fillStyle = '#fafafa'
  ctx.font = 'bold 42px system-ui'
  ctx.fillText(title, 48, 80)
  ctx.font = '28px monospace'
  lines.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? prim : '#d4d4d8'
    ctx.fillText(line, 48, 140 + i * 48)
  })
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
  const [contextLost, setContextLost] = useState(false)
  const [sceneKey, setSceneKey] = useState(0)
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
    let disposed = false
    let paused = false
    const disposables: { dispose: () => void }[] = []
    const theme = THEMES[mode] || THEMES.hub

    const onCtxLost = (e: Event) => {
      e.preventDefault()
      paused = true
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      setContextLost(true)
      console.warn('[HoloDataRoom] webglcontextlost')
    }
    const onCtxRestored = () => {
      setContextLost(false)
      setSceneKey(k => k + 1)
    }

    try {
      const w = Math.max(320, host.clientWidth || 400)
      const h = Math.max(420, height)
      const isMobile = w < 640

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(theme.fog)
      scene.fog = new THREE.FogExp2(theme.fog, 0.01)

      const baseFov = isMobile ? 38 : 55
      const camera = new THREE.PerspectiveCamera(baseFov, w / h, 0.1, 80)
      camera.position.set(0, isMobile ? 1.65 : 1.7, isMobile ? 0.05 : 0.28)

      renderer = new THREE.WebGLRenderer({
        antialias: !isMobile,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.35 : 2))
      host.innerHTML = ''
      host.appendChild(renderer.domElement)

      const canvas = renderer.domElement
      canvas.addEventListener('webglcontextlost', onCtxLost, false)
      canvas.addEventListener('webglcontextrestored', onCtxRestored, false)

      scene.add(new THREE.AmbientLight(0xffffff, 1.5))
      const dir = new THREE.DirectionalLight(0xffffff, 1.1)
      dir.position.set(4, 8, 3)
      scene.add(dir)
      scene.add(new THREE.PointLight(theme.primary, 1.4, 20).translateY(3))

      const floorGeo = new THREE.CircleGeometry(8, 32)
      const floorMat = new THREE.MeshStandardMaterial({ color: 0x050508, metalness: 0.7, roughness: 0.3 })
      const floor = new THREE.Mesh(floorGeo, floorMat)
      floor.rotation.x = -Math.PI / 2
      scene.add(floor)
      disposables.push(floorGeo, floorMat)

      const kinds: PanelKind[] = ['prices', 'signals', 'coords', 'sheet', 'oscillo', 'depth']
      const panels: THREE.Mesh[] = []
      const radius = 3.35

      kinds.forEach((kind, i) => {
        const lines = [
          `UTC ${snap.ts}`,
          `sent ${snap.sentiment.toFixed(2)} · vol ${snap.vol.toFixed(2)}`,
          `BTC ${fmtUsd(snap.btc)}  ETH ${fmtUsd(snap.eth)}`,
          `EGLD ${fmtUsd(snap.egld)}  SOL ${fmtUsd(snap.sol)}`,
          PANEL_TITLES[kind],
        ]
        const tex = paintSimplePanel(PANEL_TITLES[kind], lines, theme)
        const mat = new THREE.MeshStandardMaterial({
          map: tex,
          emissive: new THREE.Color(theme.primary),
          emissiveIntensity: 0.85,
          roughness: 0.3,
          metalness: 0.35,
        })
        const geo = new THREE.PlaneGeometry(1.8, 1.35)
        const mesh = new THREE.Mesh(geo, mat)
        const ang = (i / kinds.length) * Math.PI * 2 - Math.PI / 2
        mesh.position.set(Math.cos(ang) * radius, 1.55, Math.sin(ang) * radius)
        mesh.lookAt(0, 1.55, 0)
        mesh.userData.baseY = 1.55
        scene.add(mesh)
        panels.push(mesh)
        disposables.push(geo, mat, tex)
      })

      const t0 = performance.now()
      const animate = () => {
        if (disposed || !renderer || paused) {
          raf = 0
          return
        }
        raf = requestAnimationFrame(animate)
        try {
          const t = (performance.now() - t0) / 1000
          panels.forEach((p, i) => {
            p.position.y = (p.userData.baseY as number) + Math.sin(t * 1.1 + i * 0.7) * 0.04
            const m = p.material as THREE.MeshStandardMaterial
            m.emissiveIntensity = 0.78 + Math.sin(t * 1.2 + i) * 0.12
          })
          renderer.render(scene, camera)
        } catch (err) {
          console.warn('[HoloDataRoom] render', err)
          paused = true
          setContextLost(true)
        }
      }
      animate()

      const onResize = () => {
        if (!host || !renderer || disposed) return
        const nw = Math.max(320, host.clientWidth || 400)
        const nh = Math.max(420, height)
        camera.aspect = nw / nh
        camera.updateProjectionMatrix()
        renderer.setSize(nw, nh)
      }
      window.addEventListener('resize', onResize)

      return () => {
        disposed = true
        paused = true
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        if (renderer) {
          const el = renderer.domElement
          el.removeEventListener('webglcontextlost', onCtxLost)
          el.removeEventListener('webglcontextrestored', onCtxRestored)
          renderer.dispose()
        }
        host.innerHTML = ''
        disposables.forEach(d => {
          try {
            d.dispose()
          } catch {
            /* */
          }
        })
      }
    } catch (e) {
      console.error('[HoloDataRoom]', e)
      setFailed(true)
    }
  }, [mode, height, failed, sceneKey, sentiment, volatility, snap.btc, snap.egld, snap.ts])

  if (failed) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/50 p-6 text-center text-sm text-zinc-400 space-y-2">
        <p>WebGL indisponible — utilise le tape prix HTML ci-dessus.</p>
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => {
            setFailed(false)
            setContextLost(false)
            setSceneKey(k => k + 1)
          }}
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-cyan-500/20 bg-black/40" style={{ minHeight: height }}>
      <div ref={hostRef} className="w-full" style={{ height }} />
      {contextLost && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/70 p-4">
          <p className="text-xs text-amber-100 text-center">GPU context perdu</p>
          <button
            type="button"
            className="btn-primary text-xs"
            onClick={() => {
              setContextLost(false)
              setSceneKey(k => k + 1)
            }}
          >
            Relancer 3D
          </button>
        </div>
      )}
    </div>
  )
}
