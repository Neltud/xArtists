import {localizeChild as xaLocalize, renderChild as xaRender} from '../../i18n/phraseRuntime'
/**
 * LIA Hub — salle de contrôle 3D · 3 écrans holo distincts (PULSE/YIELD/SENTINEL).
 * 30 FPS · pool $TRO réelle injectée sur YIELD · dispose strict.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { PackId } from '../../config/agentPacks'
import { ProgressUnpackLoader } from './ProgressUnpackLoader'
import { HoloPackModal } from './HoloPackModal'
import { drawPulseScreen, drawYieldScreen, drawSentinelScreen } from './holoRenderers'
import { fetchTroEgldPool, type TroEgldPoolSnapshot } from '../../services/poolService'

type ScreenKind = PackId

const SCREEN_META: {
  id: ScreenKind
  title: string
  color: string
  accent: number
}[] = [
  { id: 'pulse', title: 'PULSE', color: '#34d399', accent: 0x34d399 },
  { id: 'yield', title: 'YIELD', color: '#fbbf24', accent: 0xfbbf24 },
  { id: 'sentinel', title: 'SENTINEL', color: '#a78bfa', accent: 0xa78bfa },
]

const TEX_INTERVAL_MS = 1000 / 30

const poolRef: { current: TroEgldPoolSnapshot | null } = { current: null }

const DRAWERS: Record<
  ScreenKind,
  (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void
> = {
  pulse: drawPulseScreen,
  yield: (ctx, w, h, t) => drawYieldScreen(ctx, w, h, t, poolRef.current),
  sentinel: drawSentinelScreen,
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
    void fetchTroEgldPool().then(s => {
      if (!disposed) poolRef.current = s
    })
    const poolTimer = window.setInterval(() => {
      void fetchTroEgldPool().then(s => {
        if (!disposed) poolRef.current = s
      })
    }, 60_000)

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
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      })
      const isMobile =
        typeof window !== 'undefined' &&
        (window.innerWidth < 768 || window.devicePixelRatio <= 1.5)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5))
      renderer.setSize(host.clientWidth || 640, host.clientHeight || 400, false)
      renderer.domElement.style.cssText =
        'display:block;width:100%;height:100%;touch-action:none'
      host.appendChild(renderer.domElement)
      setProgress(25)

      scene.add(new THREE.AmbientLight(0x6b5cff, 0.35))
      const key = new THREE.PointLight(0x22d3ee, 1.2, 20)
      key.position.set(0, 3, 2)
      scene.add(key)
      const rim = new THREE.PointLight(0xa855f7, 0.9, 16)
      rim.position.set(-2, 2, -1)
      scene.add(rim)

      const grid = new THREE.GridHelper(14, 28, 0x4c1d95, 0x1e1b4b)
      scene.add(grid)
      setProgress(40)

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
        canvas.width = isMobile ? 320 : 512
        canvas.height = isMobile ? 200 : 320
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
        const pos = geom.attributes.position
        for (let vi = 0; vi < pos.count; vi++) {
          const x = pos.getX(vi)
          pos.setZ(vi, -0.08 * (x * x))
        }
        pos.needsUpdate = true
        geom.computeVertexNormals()
        disposables.push(geom)
        const mesh = new THREE.Mesh(geom, mat)
        mesh.position.set((i - 1) * 2.7, 1.55, -1.5)
        mesh.userData.packId = meta.id
        scene.add(mesh)
        meshes.push(mesh)

        const frame = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.5, 1.6)),
          new THREE.LineBasicMaterial({ color: meta.accent }),
        )
        frame.position.copy(mesh.position)
        frame.position.z += 0.02
        scene.add(frame)
        disposables.push(frame.geometry)
        disposables.push(frame.material as THREE.Material)
      })

      setProgress(70)

      const clock = new THREE.Clock()
      let camTarget = new THREE.Vector3(0, 1.2, 0)
      let camPos = camera.position.clone()
      let lastTex = 0

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
        const now = performance.now()
        const t = clock.getElapsedTime()
        if (now - lastTex >= TEX_INTERVAL_MS) {
          lastTex = now
          canvases.forEach((c, i) => {
            const ctx = c.getContext('2d')
            if (!ctx) return
            DRAWERS[SCREEN_META[i].id](ctx, c.width, c.height, t)
            textures[i].needsUpdate = true
          })
        }
        camera.position.lerp(camPos, 0.04)
        camera.lookAt(camTarget)
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
        window.clearInterval(poolTimer)
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
        window.clearInterval(poolTimer)
      }
    }
  }, [focusScreen])

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-purple-500/30 bg-black/80 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/80">
            {xaRender("LIA Hub · Control Room ")}</p>
          <p className="text-[12px] text-zinc-400">{xaRender(hint)}</p>
        </div>
        <div className="flex gap-1">
          {xaRender(SCREEN_META.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => focusScreen(s.id)}
              className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold uppercase text-zinc-300 hover:border-cyan-400/40 min-h-[36px]"
              style={{ color: s.color }}
            >
              {xaRender(s.title)}
            </button>
          )))}
        </div>
      </div>
      <div ref={mountRef} className="relative h-[min(52vh,420px)] w-full bg-black">
        {xaRender(!ready ? <ProgressUnpackLoader progress={progress} /> : null)}
      </div>
      <HoloPackModal packId={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
