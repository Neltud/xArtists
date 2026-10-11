/**
 * Hall d'accueil WebGL — portes néon, stardust, loader institutionnel.
 */
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useNavigate } from 'react-router-dom'

const DOORS = [
  { id: 'staking', label: 'STAKING', color: 0x22c55e, route: '/command-center?room=pulse', accent: '#22c55e' },
  { id: 'studio', label: 'STUDIO', color: 0xec4899, route: '/studio', accent: '#ec4899' },
  { id: 'museum', label: 'MUSÉE', color: 0xfbbf24, route: '/museum', accent: '#fbbf24' },
  { id: 'market', label: 'MARKET', color: 0x22d3ee, route: '/marketplace', accent: '#22d3ee' },
] as const

export default function HomeMenuHall() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [contextLost, setContextLost] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let disposed = false
    let raf = 0
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x050508)
    scene.fog = new THREE.FogExp2(0x050508, 0.045)
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 80)
    camera.position.set(0, 1.8, 4.2)
    camera.lookAt(0, 1.2, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.setAttribute('data-xartists-3d', '1')
    host.appendChild(renderer.domElement)

    const disposables: { dispose: () => void }[] = []
    const track = <T extends { dispose: () => void }>(o: T): T => {
      disposables.push(o)
      return o
    }

    scene.add(new THREE.AmbientLight(0x8899ff, 0.35))
    const key = new THREE.DirectionalLight(0xffffff, 0.85)
    key.position.set(2, 6, 4)
    scene.add(key)

    const floorGeo = track(new THREE.PlaneGeometry(24, 24, 24, 24))
    const floorMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x0a0a12,
        roughness: 0.2,
        metalness: 0.8,
        wireframe: false,
      }),
    )
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    scene.add(floor)

    const grid = track(new THREE.GridHelper(24, 48, 0x7c3aed, 0x1e1b4b))
    ;(grid.material as THREE.Material).opacity = 0.45
    ;(grid.material as THREE.Material).transparent = true
    scene.add(grid)

    const dome = track(
      new THREE.Mesh(
        track(new THREE.SphereGeometry(18, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)),
        track(
          new THREE.MeshBasicMaterial({
            color: 0x6d28d9,
            wireframe: true,
            transparent: true,
            opacity: 0.22,
          }),
        ),
      ),
    )
    dome.position.y = 0.05
    scene.add(dome)

    const doorGroup = new THREE.Group()
    scene.add(doorGroup)
    const pickables: THREE.Object3D[] = []

    DOORS.forEach((d, i) => {
      const x = (i - 1.5) * 2.2
      const frame = new THREE.Mesh(
        track(new THREE.BoxGeometry(1.6, 2.2, 0.12)),
        track(
          new THREE.MeshStandardMaterial({
            color: 0x111118,
            emissive: d.color,
            emissiveIntensity: 1.15,
            roughness: 0.35,
            metalness: 0.55,
          }),
        ),
      )
      frame.position.set(x, 1.2, -1.2)
      frame.userData.route = d.route
      frame.userData.label = d.label
      doorGroup.add(frame)
      pickables.push(frame)

      const beam = new THREE.Mesh(
        track(new THREE.ConeGeometry(0.35, 1.4, 16, 1, true)),
        track(
          new THREE.MeshBasicMaterial({
            color: d.color,
            transparent: true,
            opacity: 0.22,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
        ),
      )
      beam.position.set(x, 0.35, -0.85)
      beam.rotation.x = Math.PI
      doorGroup.add(beam)

      const nPts = Math.min(devicePixelRatio > 1.5 ? 28 : 48, 48)
      const positions = new Float32Array(nPts * 3)
      for (let p = 0; p < nPts; p++) {
        positions[p * 3] = (Math.random() - 0.5) * 0.5
        positions[p * 3 + 1] = Math.random() * 1.2
        positions[p * 3 + 2] = (Math.random() - 0.5) * 0.3
      }
      const pGeo = track(new THREE.BufferGeometry())
      pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const pts = new THREE.Points(
        pGeo,
        track(
          new THREE.PointsMaterial({
            color: d.color,
            size: 0.04,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
        ),
      )
      pts.position.set(x, 0.2, -0.9)
      doorGroup.add(pts)
      ;(pts as THREE.Points & { userData: { baseY: number } }).userData.baseY = 0.2
    })

    const onCtxLost = (e: Event) => {
      e.preventDefault()
      setContextLost(true)
    }
    const onCtxRestored = () => setContextLost(false)
    renderer.domElement.addEventListener('webglcontextlost', onCtxLost, false)
    renderer.domElement.addEventListener('webglcontextrestored', onCtxRestored, false)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let downX = 0
    let downY = 0
    const onDown = (e: PointerEvent) => {
      downX = e.clientX
      downY = e.clientY
    }
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 12) return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(pickables, false)
      if (hits[0]?.object.userData.route) {
        navigate(String(hits[0].object.userData.route))
      }
    }
    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointerup', onUp)

    const ro = new ResizeObserver(() => {
      const w = host.clientWidth || 1
      const h = host.clientHeight || 1
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    })
    ro.observe(host)
    renderer.setSize(host.clientWidth || 640, host.clientHeight || 420, false)
    setReady(true)

    const clock = new THREE.Clock()
    const animate = () => {
      if (disposed) return
      raf = requestAnimationFrame(animate)
      try {
        const t = clock.getElapsedTime()
        doorGroup.children.forEach((ch, i) => {
          if ((ch as THREE.Mesh).isMesh && ch.userData.route) {
            ch.position.y = 1.2 + Math.sin(t * 1.2 + i) * 0.06
          }
        })
        dome.rotation.y = t * 0.04
        renderer.render(scene, camera)
      } catch {
        /* frame skip */
      }
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointerup', onUp)
      renderer.domElement.removeEventListener('webglcontextlost', onCtxLost)
      renderer.domElement.removeEventListener('webglcontextrestored', onCtxRestored)
      ro.disconnect()
      disposables.forEach(d => {
        try {
          d.dispose()
        } catch {
          /* */
        }
      })
      try {
        renderer.dispose()
      } catch {
        /* */
      }
      if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement)
    }
  }, [navigate])

  return (
    <div className="relative w-full h-[min(70vh,560px)] rounded-2xl overflow-hidden border border-white/10 bg-black">
      <div ref={hostRef} className="absolute inset-0" />
      {!ready && !contextLost && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-md">
          <div className="h-9 w-9 rounded-full border-2 border-fuchsia-400/30 border-t-cyan-300 animate-spin" />
          <p className="text-[12px] text-cyan-100/85 font-medium tracking-wide">
            Initialisation de l'infrastructure xArtists…
          </p>
        </div>
      )}
      {contextLost && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 text-[12px] text-amber-200">
          Contexte WebGL perdu — recharge la page
        </div>
      )}
      <p className="absolute bottom-3 left-0 right-0 text-center text-[10px] text-zinc-500 pointer-events-none">
        Clique une porte néon · STAKING · STUDIO · MUSÉE · MARKET
      </p>
    </div>
  )
}
