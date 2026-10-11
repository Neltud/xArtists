/**
 * Accueil 360° — galerie néon cyberpunk + résilience WebGL (context loss).
 * Mobile-safe: pixelRatio ≤ 1.25, pause onglet caché, fallback grille HTML.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { isWebGLAvailable } from '../../lib/webglSupport'

type Exhibit = {
  id: string
  label: string
  sub: string
  path: string
  color: number
  neon: number
  glyph: 'museum' | 'market' | 'slot' | 'packs' | 'command' | 'lia' | 'stake' | 'studio'
}

const EXHIBITS: Exhibit[] = [
  { id: 'museum', label: 'Musée', sub: 'Galerie 3D', path: '/museum', color: 0xffd700, neon: 0xffd700, glyph: 'museum' },
  { id: 'market', label: 'Marché', sub: 'NFT · RWA', path: '/marketplace', color: 0x00f3ff, neon: 0x00f3ff, glyph: 'market' },
  { id: 'slot', label: 'Slot', sub: 'EGLD', path: '/slot', color: 0xff007f, neon: 0xff007f, glyph: 'slot' },
  { id: 'packs', label: 'Packs', sub: 'Pulse complet', path: '/agents', color: 0x00f3ff, neon: 0x22d3ee, glyph: 'packs' },
  { id: 'cc', label: 'Command', sub: 'Hub holo', path: '/command-center', color: 0xa855f7, neon: 0xc084fc, glyph: 'command' },
  { id: 'lia', label: 'LIA', sub: 'Signaux IA', path: '/lia', color: 0x00f3ff, neon: 0x60a5fa, glyph: 'lia' },
  { id: 'stake', label: 'Staking', sub: '$TRO', path: '/staking', color: 0xffd700, neon: 0x4ade80, glyph: 'stake' },
  { id: 'studio', label: 'Studio', sub: 'Phygital NFT', path: '/studio', color: 0xff007f, neon: 0xf472b6, glyph: 'studio' },
]

function FallbackGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
      {EXHIBITS.map(ex => (
        <Link
          key={ex.id}
          to={ex.path}
          className="rounded-2xl border border-cyan-400/25 bg-black/70 p-4 hover:border-fuchsia-400/50 transition shadow-[0_0_20px_rgba(0,243,255,0.08)]"
        >
          <p className="text-base font-semibold text-white">{ex.label}</p>
          <p className="text-[12px] text-zinc-400">{ex.sub}</p>
        </Link>
      ))}
    </div>
  )
}

export default function HomeMenuHall() {
  const [failed, setFailed] = useState(() => !isWebGLAvailable())

  if (failed || !isWebGLAvailable()) {
    return (
      <div className="relative w-full overflow-hidden rounded-2xl border border-violet-500/25 bg-[#03010a]">
        <FallbackGrid />
        <p className="px-4 pb-3 text-[11px] text-zinc-500">
          WebGL indisponible — menu simplifié. Activez l'accélération graphique si possible.
        </p>
      </div>
    )
  }

  return <HomeMenuHallCanvas onFatal={() => setFailed(true)} />
}

function HomeMenuHallCanvas({ onFatal }: { onFatal: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [contextLost, setContextLost] = useState(false)
  const [sceneKey, setSceneKey] = useState(0)
  const [sceneReady, setSceneReady] = useState(false)

  const retryScene = useCallback(() => {
    setContextLost(false)
    setSceneReady(false)
    setSceneKey(k => k + 1)
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    setSceneReady(false)
    if (!isWebGLAvailable()) {
      onFatal()
      return
    }

    let renderer: THREE.WebGLRenderer | null = null
    let raf = 0
    let disposed = false
    let paused = false
    let sceneBooted = false
    const disposables: { dispose: () => void }[] = []

    const onCtxLost = (e: Event) => {
      e.preventDefault()
      paused = true
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      setContextLost(true)
    }
    const onCtxRestored = () => {
      setContextLost(false)
      setSceneKey(k => k + 1)
    }
    const onVisibility = () => {
      paused = document.hidden
    }

    try {
      const isMobile = (host.clientWidth || 400) < 640
      const w = Math.max(300, host.clientWidth || 400)
      const h = Math.max(isMobile ? 440 : 500, Math.min(isMobile ? 560 : 740, Math.floor(w * (isMobile ? 1.05 : 1.1))))

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x000000)
      scene.fog = new THREE.FogExp2(0x05020c, 0.022)

      const camRadius = isMobile ? 3.6 : 4.2
      const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 90)
      camera.position.set(0, 1.8, camRadius)
      camera.lookAt(0, 1.4, 0)

      renderer = new THREE.WebGLRenderer({
        antialias: !isMobile,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
        alpha: false,
      })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75))
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15
      host.innerHTML = ''
      host.appendChild(renderer.domElement)

      const canvas = renderer.domElement
      canvas.addEventListener('webglcontextlost', onCtxLost, false)
      canvas.addEventListener('webglcontextrestored', onCtxRestored, false)
      document.addEventListener('visibilitychange', onVisibility)

      scene.add(new THREE.AmbientLight(0xb0a8d0, 0.55))
      const key = new THREE.DirectionalLight(0xffe8ff, 0.85)
      key.position.set(3, 10, 2)
      scene.add(key)
      const spot = new THREE.SpotLight(0x00f3ff, 2.8, 32, Math.PI / 4.5, 0.4, 1.1)
      spot.position.set(0, 7.5, 0)
      spot.target.position.set(0, 0, 0)
      scene.add(spot)
      scene.add(spot.target)
      scene.add(new THREE.PointLight(0xff007f, 2.0, 18).translateX(-5).translateY(3.2))
      scene.add(new THREE.PointLight(0x00f3ff, 1.8, 18).translateX(5).translateY(2.8))
      scene.add(new THREE.PointLight(0xffd700, 1.4, 16).translateY(5).translateZ(-2))
      scene.add(new THREE.PointLight(0xa855f7, 1.6, 20).translateY(2))

      const floorGeo = new THREE.CircleGeometry(10, isMobile ? 32 : 48)
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x050508,
        metalness: 0.8,
        roughness: 0.2,
        emissive: new THREE.Color(0x0c0820),
        emissiveIntensity: 0.45,
      })
      const floor = new THREE.Mesh(floorGeo, floorMat)
      floor.rotation.x = -Math.PI / 2
      scene.add(floor)
      disposables.push(floorGeo, floorMat)

      const grid = new THREE.GridHelper(18, isMobile ? 24 : 36, 0xa855f7, 0x1a0a30)
      grid.position.y = 0.015
      const gridMat = grid.material as THREE.LineBasicMaterial | THREE.LineBasicMaterial[]
      if (Array.isArray(gridMat)) gridMat.forEach(m => { m.transparent = true; m.opacity = 0.85 })
      else { gridMat.transparent = true; gridMat.opacity = 0.85 }
      scene.add(grid)

      const panels: THREE.Mesh[] = []
      const n = EXHIBITS.length
      const radius = 5.0

      EXHIBITS.forEach((ex, i) => {
        const mat = new THREE.MeshStandardMaterial({
          color: 0x111118,
          emissive: new THREE.Color(ex.neon),
          emissiveIntensity: 1.15,
          roughness: 0.22,
          metalness: 0.55,
        })
        const geo = new THREE.PlaneGeometry(2.15, 2.7)
        const mesh = new THREE.Mesh(geo, mat)
        const ang = (i / n) * Math.PI * 2 - Math.PI / 2
        const px = Math.cos(ang) * radius
        const pz = Math.sin(ang) * radius
        mesh.position.set(px, 1.55, pz)
        mesh.lookAt(0, 1.55, 0)
        mesh.userData.path = ex.path
        mesh.userData.baseY = 1.55
        mesh.userData.label = ex.label
        scene.add(mesh)
        panels.push(mesh)
        disposables.push(geo, mat)

        const pl = new THREE.PointLight(ex.neon, 1.6, 8)
        pl.position.set(px * 0.7, 1.9, pz * 0.7)
        scene.add(pl)

        // label sprite
        const c = document.createElement('canvas')
        c.width = 512
        c.height = 128
        const ctx = c.getContext('2d')!
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.roundRect(40, 24, 432, 80, 16)
        ctx.fill()
        ctx.strokeStyle = `#${ex.neon.toString(16).padStart(6, '0')}`
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 36px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(ex.label, 256, 74)
        const tex = new THREE.CanvasTexture(c)
        tex.colorSpace = THREE.SRGBColorSpace
        const sm = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
        const sprite = new THREE.Sprite(sm)
        sprite.position.set(px, 3.1, pz)
        sprite.scale.set(1.8, 0.45, 1)
        scene.add(sprite)
        disposables.push(tex, sm)
      })

      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()
      let dragging = false
      let lastX = 0
      let yaw = 0
      let targetYaw = 0

      const onDown = (ev: PointerEvent) => {
        dragging = true
        lastX = ev.clientX
        canvas.style.cursor = 'grabbing'
      }
      const onUp = (ev: PointerEvent) => {
        if (!dragging) return
        const dx = Math.abs(ev.clientX - lastX)
        dragging = false
        canvas.style.cursor = 'grab'
        if (dx > 8) return
        const rect = canvas.getBoundingClientRect()
        pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObjects(panels, false)
        if (hits.length) {
          const path = hits[0].object.userData.path as string
          if (path) window.location.assign(path.startsWith('/') ? path : `/${path}`)
        }
      }
      const onMove = (ev: PointerEvent) => {
        if (!dragging) return
        const dx = ev.clientX - lastX
        lastX = ev.clientX
        targetYaw += dx * 0.005
      }
      canvas.style.cursor = 'grab'
      canvas.style.touchAction = 'none'
      canvas.addEventListener('pointerdown', onDown)
      canvas.addEventListener('pointerup', onUp)
      canvas.addEventListener('pointerleave', () => {
        dragging = false
        canvas.style.cursor = 'grab'
      })
      canvas.addEventListener('pointermove', onMove)

      const t0 = performance.now()
      const animate = () => {
        if (disposed || !renderer || paused) {
          raf = 0
          return
        }
        if (!sceneBooted) {
          sceneBooted = true
          setSceneReady(true)
        }
        raf = requestAnimationFrame(animate)
        try {
          const t = (performance.now() - t0) / 1000
          if (!dragging) targetYaw += 0.00085
          yaw += (targetYaw - yaw) * 0.08
          camera.position.x = Math.sin(yaw) * camRadius
          camera.position.z = Math.cos(yaw) * camRadius
          camera.lookAt(0, 1.4, 0)
          panels.forEach((p, i) => {
            p.position.y = (p.userData.baseY as number) + Math.sin(t * 0.9 + i * 0.5) * 0.1
          })
          renderer.render(scene, camera)
        } catch {
          /* frame skip */
        }
      }
      animate()

      return () => {
        disposed = true
        if (raf) cancelAnimationFrame(raf)
        canvas.removeEventListener('pointerdown', onDown)
        canvas.removeEventListener('pointerup', onUp)
        canvas.removeEventListener('pointermove', onMove)
        canvas.removeEventListener('webglcontextlost', onCtxLost)
        canvas.removeEventListener('webglcontextrestored', onCtxRestored)
        document.removeEventListener('visibilitychange', onVisibility)
        disposables.forEach(d => {
          try {
            d.dispose()
          } catch {
            /* */
          }
        })
        try {
          renderer?.dispose()
        } catch {
          /* */
        }
        if (host.contains(canvas)) host.removeChild(canvas)
      }
    } catch (err) {
      console.warn('[HomeMenuHall]', err)
      onFatal()
      return () => {
        disposed = true
      }
    }
  }, [sceneKey, onFatal])

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-violet-500/25 bg-[#03010a] shadow-[0_0_40px_rgba(0,243,255,0.12),0_0_120px_rgba(168,85,247,0.1)]">
      <div ref={hostRef} className="w-full min-h-[440px] sm:min-h-[500px]" />
      {!sceneReady && !contextLost && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/50 backdrop-blur-md border border-white/5">
          <div className="h-9 w-9 rounded-full border-2 border-fuchsia-400/30 border-t-cyan-300 animate-spin" />
          <p className="text-[12px] text-cyan-100/85 font-medium tracking-wide">Chargement de la galerie 3D…</p>
        </div>
      )}
      {contextLost && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/75 backdrop-blur-sm p-4">
          <p className="text-sm text-amber-100 text-center max-w-sm">
            Contexte GPU perdu. Relancez la scène.
          </p>
          <button type="button" className="btn-primary text-sm" onClick={retryScene}>
            Relancer la galerie 3D
          </button>
        </div>
      )}
      <p className="absolute bottom-3 left-3 right-3 text-center text-[11px] text-cyan-100/70 pointer-events-none font-tech tracking-wide">
        Glisse pour tourner · clique une porte holographique
      </p>
    </div>
  )
}
