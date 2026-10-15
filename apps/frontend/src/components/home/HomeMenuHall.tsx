/**
 * Accueil 360° — galerie néon + portails 4 hubs (Musée / Packs / Market / Command).
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
    id: 'museum',
    label: 'MUSEE',
    sub: 'Galerie 3D · RWA',
    route: '/museum',
    color: 0xfbbf24,
    accent: '#fbbf24',
  },
  {
    id: 'agents',
    label: 'PACKS',
    sub: 'Pulse · Yield · Sentinel',
    route: '/agents',
    color: 0x22c55e,
    accent: '#22c55e',
  },
  {
    id: 'market',
    label: 'MARKET',
    sub: 'RWA · Digital',
    route: '/market',
    color: 0x22d3ee,
    accent: '#22d3ee',
  },
  {
    id: 'command',
    label: 'COMMAND',
    sub: 'Hub · Signaux LIA',
    route: '/command-center',
    color: 0xa78bfa,
    accent: '#a78bfa',
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
  ctx.fillText('ENTRER \u2192', 256, 520)
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
      scene.background = new THREE.Color(0x05050c)
      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 80)
      camera.position.set(0, 1.6, 6.5)

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      const canvas = renderer.domElement
      canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none'
      host.appendChild(canvas)

      const track = <T extends { dispose: () => void }>(o: T): T => {
        disposables.push(o)
        return o
      }

      scene.add(new THREE.AmbientLight(0xa5b4fc, 0.4))
      const key = new THREE.DirectionalLight(0xf0f9ff, 1.1)
      key.position.set(2.5, 9, 4)
      scene.add(key)
      const fill = new THREE.DirectionalLight(0x22d3ee, 0.4)
      fill.position.set(-5, 4, -2)
      scene.add(fill)
      const rim = new THREE.PointLight(0xc084fc, 1.6, 28)
      rim.position.set(-3.5, 3.2, 2.5)
      scene.add(rim)

      const floor = new THREE.Mesh(
        track(new THREE.PlaneGeometry(32, 32)),
        track(new THREE.MeshStandardMaterial({ color: 0x06060e, roughness: 0.12, metalness: 0.92 })),
      )
      floor.rotation.x = -Math.PI / 2
      scene.add(floor)

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

      const doorGroup = new THREE.Group()
      scene.add(doorGroup)
      const pickables: THREE.Object3D[] = []

      DOORS.forEach((d, i) => {
        const tex = track(makeDoorTexture(d.label, d.sub, d.accent))
        const panel = new THREE.Mesh(
          track(new THREE.PlaneGeometry(2.2, 2.8)),
          track(new THREE.MeshBasicMaterial({ map: tex, transparent: true })),
        )
        const ang = (i / DOORS.length) * Math.PI * 2 - Math.PI / 2
        const r = 5.2
        panel.position.set(Math.cos(ang) * r, 1.5, Math.sin(ang) * r)
        panel.lookAt(0, 1.5, 0)
        panel.userData.route = d.route
        doorGroup.add(panel)
        pickables.push(panel)

        const frame = new THREE.Mesh(
          track(new THREE.BoxGeometry(2.35, 2.95, 0.08)),
          track(
            new THREE.MeshStandardMaterial({
              color: d.color,
              emissive: d.color,
              emissiveIntensity: 0.35,
              metalness: 0.6,
              roughness: 0.3,
            }),
          ),
        )
        frame.position.copy(panel.position)
        frame.position.y = 1.5
        frame.lookAt(0, 1.5, 0)
        frame.userData.route = d.route
        doorGroup.add(frame)
        pickables.push(frame)
      })

      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()
      let yaw = 0

      const onDown = (e: PointerEvent) => {
        const rect = canvas.getBoundingClientRect()
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObjects(pickables, false)
        const route = hits[0]?.object.userData?.route as string | undefined
        if (route) go(route)
      }
      canvas.addEventListener('pointerdown', onDown)

      const ro = new ResizeObserver(() => {
        const w = host.clientWidth || 1
        const h = host.clientHeight || 1
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer!.setSize(w, h, false)
      })
      ro.observe(host)
      renderer.setSize(host.clientWidth || 640, host.clientHeight || 400, false)

      const onCtxLost = (e: Event) => {
        e.preventDefault()
        setContextLost(true)
      }
      canvas.addEventListener('webglcontextlost', onCtxLost)

      let paused = isWebglPaused()
      const onPause = () => {
        paused = isWebglPaused()
      }
      window.addEventListener(WEBGL_PAUSE_EVENT, onPause)

      const clock = new THREE.Clock()
      const animate = () => {
        if (disposed) return
        raf = requestAnimationFrame(animate)
        if (paused || document.visibilityState !== 'visible') return
        const t = clock.getElapsedTime()
        yaw += 0.0008
        camera.position.x = Math.sin(yaw) * 0.3
        camera.lookAt(0, 1.4, 0)
        doorGroup.rotation.y = Math.sin(t * 0.15) * 0.04
        renderer!.render(scene, camera)
      }
      setSceneReady(true)
      animate()

      return () => {
        disposed = true
        cancelAnimationFrame(raf)
        canvas.removeEventListener('pointerdown', onDown)
        canvas.removeEventListener('webglcontextlost', onCtxLost)
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
    <div className="relative w-full h-[min(78vh,720px)] rounded-2xl overflow-hidden border border-violet-500/25 bg-black shadow-[0_0_60px_-16px_rgba(124,58,237,0.45)]">
      <div ref={hostRef} className="absolute inset-0" />
      {!sceneReady && !contextLost && !webglFailed && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-md">
          <div className="h-9 w-9 rounded-full border-2 border-fuchsia-400/30 border-t-cyan-300 animate-spin" />
          <p className="text-[12px] text-cyan-100/85 font-medium tracking-wide">
            Initialisation de l infrastructure xArtists…
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
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-[12px] text-white"
                onClick={() => go(d.route)}
              >
                {d.label}
                <span className="block text-[10px] text-zinc-500">{d.sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {!webglFailed && (
        <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-[11px] text-zinc-500">
          Clique une porte 3D — Entre dans les pièces
        </p>
      )}
    </div>
  )
}
