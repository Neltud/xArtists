/**
 * Accueil 360° — galerie néon cyberpunk + résilience WebGL (context loss).
 * Dôme double, lumières pulsées, halo sol, stardust + étoiles ambiantes.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useNavigate } from 'react-router-dom'
import { isWebglPaused, WEBGL_PAUSE_EVENT } from '../../lib/webglPause'

type DoorDef = {
  id: string
  label: string
  sub: string
  route: string
  color: number
  accent: string
}

const DOORS: DoorDef[] = [
  {
    id: 'staking',
    label: 'STAKING',
    sub: 'Yield · Pulse',
    route: '/command-center?room=pulse',
    color: 0x22c55e,
    accent: '#22c55e',
  },
  {
    id: 'studio',
    label: 'STUDIO',
    sub: 'Création · Phygital',
    route: '/studio',
    color: 0xec4899,
    accent: '#ec4899',
  },
  {
    id: 'museum',
    label: 'MUSÉE',
    sub: 'Galerie 3D',
    route: '/museum',
    color: 0xfbbf24,
    accent: '#fbbf24',
  },
  {
    id: 'market',
    label: 'MARKET',
    sub: 'Art · RWA',
    route: '/marketplace',
    color: 0x22d3ee,
    accent: '#22d3ee',
  },
]

function makeDoorTexture(label: string, sub: string, accent: string): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 640
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 640)
  g.addColorStop(0, '#0a0a14')
  g.addColorStop(1, '#12121f')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 512, 640)
  ctx.strokeStyle = accent
  ctx.lineWidth = 10
  ctx.strokeRect(18, 18, 476, 604)
  ctx.fillStyle = accent
  ctx.globalAlpha = 0.15
  ctx.fillRect(40, 200, 432, 120)
  ctx.globalAlpha = 1
  ctx.fillStyle = '#f4f4f5'
  ctx.font = 'bold 52px Syne, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(label, 256, 270)
  ctx.fillStyle = accent
  ctx.font = '22px DM Sans, system-ui, sans-serif'
  ctx.fillText(sub, 256, 320)
  ctx.fillStyle = '#a1a1aa'
  ctx.font = '18px Orbitron, system-ui, sans-serif'
  ctx.fillText('ENTRER →', 256, 520)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export default function HomeMenuHall() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [sceneReady, setSceneReady] = useState(false)
  const [contextLost, setContextLost] = useState(false)
  const [webglFailed, setWebglFailed] = useState(false)
  const navigate = useNavigate()
  const navRef = useRef(navigate)
  navRef.current = navigate

  const go = useCallback((route: string) => {
    navRef.current(route)
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let disposed = false
    let raf = 0
    let renderer: THREE.WebGLRenderer | null = null
    const disposables: { dispose: () => void }[] = []

    try {
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x050508)
      scene.fog = new THREE.FogExp2(0x060612, 0.032)

      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
      camera.position.set(0, 1.8, 4.2)
      camera.lookAt(0, 1.15, 0)

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false,
      })
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.25
      renderer.domElement.setAttribute('data-xartists-3d', '1')
      renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none'
      host.appendChild(renderer.domElement)

      const track = <T extends { dispose: () => void }>(o: T): T => {
        disposables.push(o)
        return o
      }

      // —— Ambiance néon ——
      scene.add(new THREE.AmbientLight(0xa5b4fc, 0.32))
      const key = new THREE.DirectionalLight(0xf0f9ff, 1.05)
      key.position.set(2.5, 9, 4)
      scene.add(key)
      const fill = new THREE.DirectionalLight(0x22d3ee, 0.35)
      fill.position.set(-5, 4, -2)
      scene.add(fill)
      const rim = new THREE.PointLight(0xc084fc, 1.6, 28)
      rim.position.set(-3.5, 3.2, 2.5)
      scene.add(rim)
      const rim2 = new THREE.PointLight(0x22d3ee, 1.1, 22)
      rim2.position.set(4, 2.8, 1.5)
      scene.add(rim2)
      const ceilingGlow = new THREE.PointLight(0xa78bfa, 0.85, 35)
      ceilingGlow.position.set(0, 8, -2)
      scene.add(ceilingGlow)

      const floorMat = track(
        new THREE.MeshStandardMaterial({
          color: 0x06060e,
          roughness: 0.12,
          metalness: 0.92,
        }),
      )
      const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(32, 32)), floorMat)
      floor.rotation.x = -Math.PI / 2
      scene.add(floor)

      const floorHalo = new THREE.Mesh(
        track(new THREE.CircleGeometry(3.2, 48)),
        track(
          new THREE.MeshBasicMaterial({
            color: 0x7c3aed,
            transparent: true,
            opacity: 0.12,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
        ),
      )
      floorHalo.rotation.x = -Math.PI / 2
      floorHalo.position.y = 0.02
      scene.add(floorHalo)

      const grid = track(new THREE.GridHelper(32, 64, 0xa78bfa, 0x1e1b4b))
      const gm = grid.material as THREE.Material
      gm.transparent = true
      gm.opacity = 0.55
      scene.add(grid)

      const dome = new THREE.Mesh(
        track(new THREE.SphereGeometry(22, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2)),
        track(
          new THREE.MeshBasicMaterial({
            color: 0x7c3aed,
            wireframe: true,
            transparent: true,
            opacity: 0.28,
          }),
        ),
      )
      dome.position.y = 0.02
      scene.add(dome)

      const domeInner = new THREE.Mesh(
        track(new THREE.SphereGeometry(19.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)),
        track(
          new THREE.MeshBasicMaterial({
            color: 0x22d3ee,
            wireframe: true,
            transparent: true,
            opacity: 0.1,
          }),
        ),
      )
      domeInner.position.y = 0.04
      scene.add(domeInner)

      const starCount = devicePixelRatio > 1.4 ? 60 : 120
      const starPos = new Float32Array(starCount * 3)
      for (let s = 0; s < starCount; s++) {
        const a = Math.random() * Math.PI * 2
        const r = 6 + Math.random() * 12
        starPos[s * 3] = Math.cos(a) * r
        starPos[s * 3 + 1] = 2 + Math.random() * 10
        starPos[s * 3 + 2] = Math.sin(a) * r - 2
      }
      const starGeo = track(new THREE.BufferGeometry())
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
      const stars = new THREE.Points(
        starGeo,
        track(
          new THREE.PointsMaterial({
            color: 0xe0e7ff,
            size: 0.045,
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
        ),
      )
      scene.add(stars)

      const doorGroup = new THREE.Group()
      scene.add(doorGroup)
      const pickables: THREE.Object3D[] = []
      const stardust: THREE.Points[] = []

      DOORS.forEach((d, i) => {
        const x = (i - 1.5) * 2.35
        const tex = track(makeDoorTexture(d.label, d.sub, d.accent))
        const panel = new THREE.Mesh(
          track(new THREE.PlaneGeometry(1.55, 1.95)),
          track(
            new THREE.MeshStandardMaterial({
              map: tex,
              roughness: 0.35,
              metalness: 0.25,
              emissive: d.color,
              emissiveIntensity: 0.45,
            }),
          ),
        )
        panel.position.set(x, 1.25, -1.35)
        panel.userData.route = d.route
        panel.userData.doorId = d.id
        doorGroup.add(panel)
        pickables.push(panel)

        const frame = new THREE.Mesh(
          track(new THREE.BoxGeometry(1.72, 2.15, 0.1)),
          track(
            new THREE.MeshStandardMaterial({
              color: 0x0c0c14,
              emissive: d.color,
              emissiveIntensity: 1.35,
              roughness: 0.3,
              metalness: 0.6,
            }),
          ),
        )
        frame.position.set(x, 1.25, -1.42)
        frame.userData.route = d.route
        doorGroup.add(frame)
        pickables.push(frame)

        const beam = new THREE.Mesh(
          track(new THREE.ConeGeometry(0.42, 1.55, 20, 1, true)),
          track(
            new THREE.MeshBasicMaterial({
              color: d.color,
              transparent: true,
              opacity: 0.32,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
              side: THREE.DoubleSide,
            }),
          ),
        )
        beam.position.set(x, 0.4, -0.95)
        beam.rotation.x = Math.PI
        doorGroup.add(beam)

        const nPts = devicePixelRatio > 1.4 ? 24 : 40
        const positions = new Float32Array(nPts * 3)
        for (let p = 0; p < nPts; p++) {
          positions[p * 3] = (Math.random() - 0.5) * 0.55
          positions[p * 3 + 1] = Math.random() * 1.35
          positions[p * 3 + 2] = (Math.random() - 0.5) * 0.35
        }
        const pGeo = track(new THREE.BufferGeometry())
        pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        const pts = new THREE.Points(
          pGeo,
          track(
            new THREE.PointsMaterial({
              color: d.color,
              size: 0.035,
              transparent: true,
              opacity: 0.65,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
            }),
          ),
        )
        pts.position.set(x, 0.15, -1.0)
        doorGroup.add(pts)
        stardust.push(pts)

        const pl = new THREE.PointLight(d.color, 0.95, 8, 1.8)
        pl.position.set(x, 1.6, -0.4)
        scene.add(pl)
      })

      const canvas = renderer.domElement
      const onCtxLost = (e: Event) => {
        e.preventDefault()
        setContextLost(true)
      }
      const onCtxRestored = () => {
        setContextLost(false)
      }
      canvas.addEventListener('webglcontextlost', onCtxLost, false)
      canvas.addEventListener('webglcontextrestored', onCtxRestored, false)

      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()
      let dragging = false
      let moved = false
      let lastX = 0
      let yaw = 0

      const onDown = (e: PointerEvent) => {
        dragging = true
        moved = false
        lastX = e.clientX
        canvas.setPointerCapture?.(e.pointerId)
      }
      const onMove = (e: PointerEvent) => {
        if (!dragging) return
        const dx = e.clientX - lastX
        if (Math.abs(dx) > 3) moved = true
        lastX = e.clientX
        yaw += dx * 0.004
        yaw = Math.max(-0.45, Math.min(0.45, yaw))
        camera.position.x = Math.sin(yaw) * 4.2
        camera.position.z = Math.cos(yaw) * 4.2
        camera.lookAt(0, 1.15, 0)
      }
      const onUp = (e: PointerEvent) => {
        dragging = false
        try {
          canvas.releasePointerCapture?.(e.pointerId)
        } catch {
          /* */
        }
        if (moved) return
        const rect = canvas.getBoundingClientRect()
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObjects(pickables, true)
        const route = hits[0]?.object.userData?.route as string | undefined
        if (route) go(route)
      }
      canvas.addEventListener('pointerdown', onDown)
      canvas.addEventListener('pointermove', onMove)
      canvas.addEventListener('pointerup', onUp)
      canvas.addEventListener('pointercancel', onUp)

      const onVisibility = () => {
        if (document.hidden) cancelAnimationFrame(raf)
      }
      document.addEventListener('visibilitychange', onVisibility)

      let paused = isWebglPaused()
      const onPause = (e: Event) => {
        const d = (e as CustomEvent).detail
        if (d && typeof d.paused === 'boolean') paused = d.paused
      }
      window.addEventListener(WEBGL_PAUSE_EVENT, onPause)

      const ro = new ResizeObserver(() => {
        if (!renderer || disposed) return
        const w = host.clientWidth || 1
        const h = host.clientHeight || 1
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h, false)
      })
      ro.observe(host)
      renderer.setSize(host.clientWidth || 640, host.clientHeight || 420, false)

      if (!disposed) setSceneReady(true)

      const clock = new THREE.Clock()
      const animate = () => {
        if (disposed) return
        raf = requestAnimationFrame(animate)
        if (paused || document.hidden || contextLost) return
        try {
          const t = clock.getElapsedTime()
          doorGroup.children.forEach((ch, i) => {
            if ((ch as THREE.Mesh).isMesh && ch.userData.route) {
              ch.position.y = 1.25 + Math.sin(t * 1.15 + i * 0.7) * 0.08
            }
          })
          stardust.forEach((pts, i) => {
            const pos = pts.geometry.getAttribute('position') as THREE.BufferAttribute
            for (let p = 0; p < pos.count; p++) {
              let y = pos.getY(p) + 0.01 + i * 0.0015
              if (y > 1.4) y = 0
              pos.setY(p, y)
            }
            pos.needsUpdate = true
            const pm = pts.material as THREE.PointsMaterial
            pm.opacity = 0.5 + Math.sin(t * 2.2 + i) * 0.3
          })
          dome.rotation.y = t * 0.05
          domeInner.rotation.y = -t * 0.03
          stars.rotation.y = t * 0.015
          ;(floorHalo.material as THREE.MeshBasicMaterial).opacity =
            0.08 + Math.sin(t * 1.4) * 0.06
          rim.intensity = 1.4 + Math.sin(t * 1.1) * 0.35
          rim2.intensity = 0.95 + Math.cos(t * 1.3) * 0.3
          ceilingGlow.intensity = 0.7 + Math.sin(t * 0.8) * 0.25
          renderer!.render(scene, camera)
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
        canvas.removeEventListener('pointercancel', onUp)
        canvas.removeEventListener('webglcontextlost', onCtxLost)
        canvas.removeEventListener('webglcontextrestored', onCtxRestored)
        document.removeEventListener('visibilitychange', onVisibility)
        window.removeEventListener(WEBGL_PAUSE_EVENT, onPause)
        ro.disconnect()
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
    } catch {
      if (!disposed) setWebglFailed(true)
      return () => {
        disposed = true
      }
    }
  }, [go])

  return (
    <div className="relative w-full h-[min(70vh,560px)] rounded-2xl overflow-hidden border border-white/10 bg-black">
      <div ref={hostRef} className="absolute inset-0" />
      {!sceneReady && !contextLost && !webglFailed && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-md">
          <div className="h-9 w-9 rounded-full border-2 border-fuchsia-400/30 border-t-cyan-300 animate-spin" />
          <p className="text-[12px] text-cyan-100/85 font-medium tracking-wide">
            Initialisation de l'infrastructure xArtists…
          </p>
        </div>
      )}
      {contextLost && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 px-4 text-center text-[12px] text-amber-200">
          Contexte WebGL perdu — recharge la page
        </div>
      )}
      {webglFailed && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/90 p-4">
          <p className="text-[13px] text-zinc-300 text-center">WebGL indisponible — menu alternatif</p>
          <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
            {DOORS.map(d => (
              <button
                key={d.id}
                type="button"
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-left"
                onClick={() => go(d.route)}
              >
                <span className="block text-sm font-semibold text-white">{d.label}</span>
                <span className="text-[10px] text-zinc-500">{d.sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="absolute bottom-3 left-3 right-3 text-center text-[11px] text-cyan-100/70 pointer-events-none font-tech tracking-wide">
        Glisse pour tourner · clique une porte holographique
      </p>
    </div>
  )
}
