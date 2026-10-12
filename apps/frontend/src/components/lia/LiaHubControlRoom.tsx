/**
 * LIA Hub — salle de contrôle 3D · 3 écrans holo Pack Sponsors (PULSE / YIELD / SENTINEL).
 * CanvasTexture animées + dispose strict au unmount.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { PackId } from '../../config/agentPacks'
import { ProgressUnpackLoader } from './ProgressUnpackLoader'
import { HoloPackModal } from './HoloPackModal'

type ScreenKind = PackId

const SCREEN_META: {
  id: ScreenKind
  title: string
  color: string
  accent: number
}[] = [
  { id: 'pulse', title: 'PULSE', color: '#34d399', accent: 0x34d399 },
  { id: 'yield', title: 'YIELD', color: '#2dd4bf', accent: 0x2dd4bf },
  { id: 'sentinel', title: 'SENTINEL', color: '#a78bfa', accent: 0xa78bfa },
]

function drawPulse(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = '#05050a'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(52,211,153,0.85)'
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let x = 0; x < w; x++) {
    const y =
      h * 0.5 +
      Math.sin(x * 0.04 + t * 3) * 28 +
      Math.sin(x * 0.11 + t * 5) * 12
    if (x === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.fillStyle = '#6ee7b7'
  ctx.font = '600 18px ui-monospace, monospace'
  ctx.fillText('PULSE · waveform', 16, 28)
  ctx.fillStyle = '#a7f3d0'
  ctx.font = '13px ui-monospace, monospace'
  ctx.fillText(`req/s  ${(80 + Math.sin(t * 2) * 30).toFixed(0)}`, 16, 52)
  ctx.fillText(`latency  ${(12 + Math.abs(Math.sin(t)) * 8).toFixed(1)} ms`, 16, 72)
}

function drawYield(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = '#05050a'
  ctx.fillRect(0, 0, w, h)
  // concentric liquidity rings
  const cx = w * 0.28
  const cy = h * 0.55
  for (let i = 1; i <= 5; i++) {
    ctx.strokeStyle = `rgba(45,212,191,${0.15 + i * 0.08})`
    ctx.beginPath()
    ctx.arc(cx, cy, 18 + i * 14 + Math.sin(t + i) * 3, 0, Math.PI * 2)
    ctx.stroke()
  }
  // candle-like bars
  const baseX = w * 0.52
  for (let i = 0; i < 12; i++) {
    const bh = 20 + Math.abs(Math.sin(t * 1.5 + i * 0.4)) * 60
    ctx.fillStyle = i % 2 === 0 ? '#2dd4bf' : '#5eead4'
    ctx.fillRect(baseX + i * 14, h * 0.75 - bh, 10, bh)
  }
  ctx.fillStyle = '#99f6e4'
  ctx.font = '600 18px ui-monospace, monospace'
  ctx.fillText('YIELD · $TRO sleeve', 16, 28)
  ctx.font = '13px ui-monospace, monospace'
  ctx.fillText(`TVL  ${(110 + Math.sin(t) * 8).toFixed(1)}k`, 16, 52)
  ctx.fillText(`APR est.  ${(6 + Math.sin(t * 0.7) * 1.2).toFixed(1)}%`, 16, 72)
}

function drawSentinel(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = '#05050a'
  ctx.fillRect(0, 0, w, h)
  // hash rain
  ctx.font = '11px ui-monospace, monospace'
  for (let row = 0; row < 10; row++) {
    const offset = Math.floor(t * 8 + row * 3) % 16
    let hex = ''
    for (let i = 0; i < 16; i++) {
      hex += '0123456789abcdef'[(i + offset + row) % 16]
    }
    ctx.fillStyle = `rgba(167,139,250,${0.35 + (row % 3) * 0.15})`
    ctx.fillText(hex, 12, 40 + row * 16)
  }
  // radar
  const cx = w * 0.78
  const cy = h * 0.55
  ctx.strokeStyle = 'rgba(167,139,250,0.5)'
  for (let r = 20; r <= 60; r += 20) {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  const ang = t * 2
  ctx.strokeStyle = '#c4b5fd'
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + Math.cos(ang) * 60, cy + Math.sin(ang) * 60)
  ctx.stroke()
  ctx.fillStyle = '#ddd6fe'
  ctx.font = '600 16px ui-monospace, monospace'
  ctx.fillText('SENTINEL · zero-trust', 16, 24)
  ctx.font = '12px ui-monospace, monospace'
  ctx.fillText('JWT · pulse pack gate', 16, h - 28)
  ctx.fillText('SHA-256 stream · OK', 16, h - 12)
}

const DRAWERS: Record<ScreenKind, typeof drawPulse> = {
  pulse: drawPulse,
  yield: drawYield,
  sentinel: drawSentinel,
}

export default function LiaHubControlRoom() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(8)
  const [ready, setReady] = useState(false)
  const [selected, setSelected] = useState<PackId | null>(null)
  const [hint, setHint] = useState('Survole / clique un écran holo')

  const focusScreen = useCallback((id: PackId | null) => {
    setSelected(id)
  }, [])

  useEffect(() => {
    const host = mountRef.current
    if (!host) return

    let disposed = false
    let raf = 0
    let renderer: THREE.WebGLRenderer | null = null
    const disposables: { dispose: () => void }[] = []
    const textures: THREE.CanvasTexture[] = []
    const canvases: HTMLCanvasElement[] = []
    const meshes: THREE.Mesh[] = []

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x05050c)
    scene.fog = new THREE.FogExp2(0x05050c, 0.045)

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80)
    camera.position.set(0, 1.55, 5.2)
    camera.lookAt(0, 1.2, 0)

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
      renderer.setSize(host.clientWidth || 640, host.clientHeight || 400, false)
      renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none'
      host.appendChild(renderer.domElement)
      setProgress(25)

      scene.add(new THREE.AmbientLight(0x6b5cff, 0.35))
      const key = new THREE.PointLight(0x22d3ee, 1.2, 20)
      key.position.set(0, 3, 2)
      scene.add(key)
      const rim = new THREE.PointLight(0xa855f7, 0.9, 16)
      rim.position.set(-2, 2, -1)
      scene.add(rim)

      // floor grid
      const grid = new THREE.GridHelper(14, 28, 0x4c1d95, 0x1e1b4b)
      grid.position.y = 0
      scene.add(grid)
      setProgress(40)

      // back wall
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0x0f0a1a,
        metalness: 0.4,
        roughness: 0.7,
        emissive: 0x1e1035,
        emissiveIntensity: 0.25,
      })
      disposables.push(wallMat)
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(12, 4.5), wallMat)
      wall.position.set(0, 2, -2.2)
      scene.add(wall)
      disposables.push(wall.geometry)

      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()

      SCREEN_META.forEach((meta, i) => {
        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 320
        canvases.push(canvas)
        const tex = new THREE.CanvasTexture(canvas)
        tex.colorSpace = THREE.SRGBColorSpace
        textures.push(tex)
        const mat = new THREE.MeshStandardMaterial({
          map: tex,
          emissive: meta.accent,
          emissiveMap: tex,
          emissiveIntensity: 0.55,
          roughness: 0.35,
          metalness: 0.2,
        })
        disposables.push(mat)
        const geom = new THREE.PlaneGeometry(2.4, 1.5, 16, 8)
        // slight curve via vertex z
        const pos = geom.attributes.position
        for (let vi = 0; vi < pos.count; vi++) {
          const x = pos.getX(vi)
          pos.setZ(vi, -0.08 * (x * x))
        }
        pos.needsUpdate = true
        geom.computeVertexNormals()
        disposables.push(geom)
        const mesh = new THREE.Mesh(geom, mat)
        const x = (i - 1) * 2.7
        mesh.position.set(x, 1.55, -1.5)
        mesh.userData.packId = meta.id
        scene.add(mesh)
        meshes.push(mesh)

        // neon frame
        const frame = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.5, 1.6)),
          new THREE.LineBasicMaterial({ color: meta.accent }),
        )
        frame.position.copy(mesh.position)
        frame.position.z += 0.02
        scene.add(frame)
        disposables.push(frame.geometry)
        if (Array.isArray((frame.material as THREE.Material).dispose)) {
          /* */
        } else {
          disposables.push(frame.material as THREE.Material)
        }
      })

      setProgress(70)

      const clock = new THREE.Clock()
      let camTarget = new THREE.Vector3(0, 1.2, 0)
      let camPos = camera.position.clone()

      const onPointer = (ev: PointerEvent) => {
        if (!renderer || disposed) return
        const rect = renderer.domElement.getBoundingClientRect()
        pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObjects(meshes)
        if (hits.length) {
          const id = hits[0].object.userData.packId as PackId
          setHint(`Pack ${id.toUpperCase()} · clic pour ouvrir`)
          renderer.domElement.style.cursor = 'pointer'
          if (ev.type === 'pointerup') {
            focusScreen(id)
            const m = hits[0].object as THREE.Mesh
            camTarget = m.position.clone().add(new THREE.Vector3(0, 0, 0.2))
            camPos = m.position.clone().add(new THREE.Vector3(0, 0.15, 2.1))
          }
        } else {
          setHint('Survole / clique un écran holo')
          renderer.domElement.style.cursor = 'default'
        }
      }

      renderer.domElement.addEventListener('pointermove', onPointer)
      renderer.domElement.addEventListener('pointerup', onPointer)

      const animate = () => {
        if (disposed || !renderer) return
        raf = requestAnimationFrame(animate)
        const t = clock.getElapsedTime()
        canvases.forEach((c, i) => {
          const ctx = c.getContext('2d')
          if (!ctx) return
          DRAWERS[SCREEN_META[i].id](ctx, c.width, c.height, t)
          textures[i].needsUpdate = true
        })
        // ease camera
        camera.position.lerp(camPos, 0.04)
        const look = new THREE.Vector3().copy(camTarget)
        camera.lookAt(look)
        try {
          renderer.render(scene, camera)
        } catch {
          /* */
        }
      }
      animate()
      setProgress(100)
      setReady(true)

      const ro = new ResizeObserver(() => {
        if (!renderer || disposed) return
        const w = host.clientWidth || 1
        const h = host.clientHeight || 1
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h, false)
      })
      ro.observe(host)

      return () => {
        disposed = true
        cancelAnimationFrame(raf)
        ro.disconnect()
        renderer?.domElement.removeEventListener('pointermove', onPointer)
        renderer?.domElement.removeEventListener('pointerup', onPointer)
        textures.forEach(tex => tex.dispose())
        disposables.forEach(d => {
          try {
            d.dispose()
          } catch {
            /* */
          }
        })
        scene.traverse(obj => {
          const mesh = obj as THREE.Mesh
          if (mesh.geometry) mesh.geometry.dispose()
          const mat = mesh.material
          if (mat) {
            const list = Array.isArray(mat) ? mat : [mat]
            list.forEach(m => {
              const std = m as THREE.MeshStandardMaterial
              if (std.map) std.map.dispose()
              if (std.emissiveMap) std.emissiveMap.dispose()
              m.dispose()
            })
          }
        })
        try {
          renderer?.dispose()
        } catch {
          /* */
        }
        if (renderer && host.contains(renderer.domElement)) {
          host.removeChild(renderer.domElement)
        }
      }
    } catch {
      setHint('WebGL indisponible — ouvrir les packs via /agents')
      setProgress(100)
      setReady(true)
      return () => {
        disposed = true
      }
    }
  }, [focusScreen])

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-purple-500/30 bg-black/80 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/80">LIA Hub · Control Room</p>
          <p className="text-[12px] text-zinc-400">{hint}</p>
        </div>
        <div className="flex gap-1">
          {SCREEN_META.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => focusScreen(s.id)}
              className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold uppercase text-zinc-300 hover:border-cyan-400/40 min-h-[36px]"
              style={{ color: s.color }}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>
      <div ref={mountRef} className="relative h-[min(52vh,420px)] w-full bg-black">
        {!ready ? <ProgressUnpackLoader progress={progress} /> : null}
      </div>
      <HoloPackModal packId={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
