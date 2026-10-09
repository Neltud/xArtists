/**
 * Accueil = grande galerie 3D (monument).
 * 8 panneaux-œuvres = portes de navigation.
 * Fallback grille 2D si WebGL indisponible.
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'

type Exhibit = { id: string; label: string; sub: string; path: string; color: number }

const EXHIBITS: Exhibit[] = [
  { id: 'museum', label: 'Musée', sub: 'Galerie 3D', path: '/museum', color: 0xc4a574 },
  { id: 'market', label: 'Marché', sub: 'NFT listings', path: '/marketplace', color: 0xa855f7 },
  { id: 'slot', label: 'Slot', sub: 'EGLD', path: '/slot', color: 0xf59e0b },
  { id: 'packs', label: 'Packs', sub: 'Agents IA', path: '/agents', color: 0x22d3ee },
  { id: 'cc', label: 'Command', sub: 'Signaux', path: '/command-center', color: 0x34d399 },
  { id: 'tca', label: 'TCA', sub: 'Classroom', path: '/tca', color: 0xf472b6 },
  { id: 'lia', label: 'LIA', sub: 'Oracle', path: '/lia', color: 0x60a5fa },
  { id: 'stake', label: 'Staking', sub: '$TRO', path: '/staking', color: 0x4ade80 },
]

function FallbackGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
      {EXHIBITS.map(ex => (
        <Link
          key={ex.id}
          to={ex.path}
          className="rounded-2xl border border-white/15 bg-black/50 p-4 hover:border-violet-400/40 transition active:scale-[0.98]"
        >
          <p className="text-sm font-semibold text-white">{ex.label}</p>
          <p className="text-[11px] text-zinc-500">{ex.sub}</p>
        </Link>
      ))}
    </div>
  )
}

export default function HomeMenuHall() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host || failed) return

    let renderer: THREE.WebGLRenderer | null = null
    let raf = 0
    const disposables: { dispose: () => void }[] = []

    try {
      const w = Math.max(280, host.clientWidth || 360)
      const h = Math.max(420, Math.min(640, Math.floor(w * 0.95)))

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x06040a)
      scene.fog = new THREE.FogExp2(0x06040a, 0.045)

      const camera = new THREE.PerspectiveCamera(58, w / h, 0.1, 50)
      camera.position.set(0, 1.55, 6.4)

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
      host.innerHTML = ''
      host.appendChild(renderer.domElement)

      scene.add(new THREE.AmbientLight(0xffffff, 0.35))
      const key = new THREE.DirectionalLight(0xffe6c8, 0.95)
      key.position.set(4, 7, 5)
      scene.add(key)
      const rim = new THREE.PointLight(0x7c3aed, 1.4, 18)
      rim.position.set(-3, 2.5, 2)
      scene.add(rim)
      const rim2 = new THREE.PointLight(0x22d3ee, 0.7, 14)
      rim2.position.set(3, 1.5, 0)
      scene.add(rim2)

      const floorGeo = new THREE.PlaneGeometry(18, 14)
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x0c0a12,
        metalness: 0.45,
        roughness: 0.75,
      })
      const floor = new THREE.Mesh(floorGeo, floorMat)
      floor.rotation.x = -Math.PI / 2
      scene.add(floor)
      disposables.push(floorGeo, floorMat)

      const wallGeo = new THREE.PlaneGeometry(18, 6)
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x0a0810, metalness: 0.15, roughness: 0.92 })
      const back = new THREE.Mesh(wallGeo, wallMat)
      back.position.set(0, 2.6, -4.2)
      scene.add(back)
      disposables.push(wallGeo, wallMat)

      // side walls for depth
      const sideGeo = new THREE.PlaneGeometry(12, 6)
      const left = new THREE.Mesh(sideGeo, wallMat.clone())
      left.position.set(-7.5, 2.6, -0.5)
      left.rotation.y = Math.PI / 2.4
      scene.add(left)
      const right = new THREE.Mesh(sideGeo, wallMat.clone())
      right.position.set(7.5, 2.6, -0.5)
      right.rotation.y = -Math.PI / 2.4
      scene.add(right)
      disposables.push(sideGeo)

      const panels: THREE.Mesh[] = []
      const n = EXHIBITS.length
      EXHIBITS.forEach((ex, i) => {
        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 640
        const ctx = canvas.getContext('2d')!
        const hex = `#${ex.color.toString(16).padStart(6, '0')}`
        ctx.fillStyle = '#08060e'
        ctx.fillRect(0, 0, 512, 640)
        ctx.strokeStyle = hex
        ctx.lineWidth = 14
        ctx.strokeRect(18, 18, 476, 604)
        ctx.fillStyle = hex
        ctx.globalAlpha = 0.18
        ctx.fillRect(48, 48, 416, 220)
        ctx.globalAlpha = 1
        ctx.fillStyle = '#fafafa'
        ctx.font = 'bold 54px system-ui,sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(ex.label, 256, 330)
        ctx.fillStyle = '#a1a1aa'
        ctx.font = '30px system-ui,sans-serif'
        ctx.fillText(ex.sub, 256, 390)
        ctx.fillStyle = hex
        ctx.font = '22px system-ui,sans-serif'
        ctx.fillText('entrer →', 256, 540)

        const tex = new THREE.CanvasTexture(canvas)
        const mat = new THREE.MeshStandardMaterial({
          map: tex,
          emissive: new THREE.Color(ex.color),
          emissiveIntensity: 0.18,
          roughness: 0.5,
          metalness: 0.2,
        })
        const geo = new THREE.PlaneGeometry(1.35, 1.7)
        const mesh = new THREE.Mesh(geo, mat)
        const ang = (i / (n - 1) - 0.5) * 1.55
        mesh.position.set(Math.sin(ang) * 4.2, 1.55, -2.6 + Math.cos(ang) * 1.1)
        mesh.lookAt(0, 1.4, 5)
        mesh.userData.path = ex.path
        scene.add(mesh)
        panels.push(mesh)
        disposables.push(geo, mat, tex)

        const pedGeo = new THREE.BoxGeometry(0.55, 0.1, 0.4)
        const pedMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, metalness: 0.4, roughness: 0.6 })
        const ped = new THREE.Mesh(pedGeo, pedMat)
        ped.position.set(mesh.position.x, 0.55, mesh.position.z + 0.2)
        scene.add(ped)
        disposables.push(pedGeo, pedMat)
      })

      for (let i = 0; i < 6; i++) {
        const pl = new THREE.PointLight(0xc4b5fd, 0.28, 5)
        pl.position.set((i - 2.5) * 1.5, 0.35, 2)
        scene.add(pl)
      }

      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()

      const onPointer = (ev: PointerEvent) => {
        if (!renderer) return
        const rect = renderer.domElement.getBoundingClientRect()
        pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObjects(panels, false)
        if (!hits.length) return
        const path = hits[0].object.userData.path as string
        if (path) window.location.hash = `#${path}`
      }
      renderer.domElement.style.cursor = 'pointer'
      renderer.domElement.addEventListener('pointerdown', onPointer)

      const t0 = performance.now()
      const animate = () => {
        raf = requestAnimationFrame(animate)
        if (!renderer) return
        const t = (performance.now() - t0) / 1000
        camera.position.x = Math.sin(t * 0.12) * 0.45
        camera.position.y = 1.55 + Math.sin(t * 0.2) * 0.08
        camera.lookAt(0, 1.35, -1.2)
        panels.forEach((p, i) => {
          p.position.y = 1.55 + Math.sin(t * 0.7 + i * 0.45) * 0.05
          const m = p.material as THREE.MeshStandardMaterial
          m.emissiveIntensity = 0.14 + Math.sin(t * 1.2 + i) * 0.06
        })
        renderer.render(scene, camera)
      }
      animate()

      const onResize = () => {
        if (!renderer || !host) return
        const nw = Math.max(280, host.clientWidth || 360)
        const nh = Math.max(420, Math.min(640, Math.floor(nw * 0.95)))
        camera.aspect = nw / nh
        camera.updateProjectionMatrix()
        renderer.setSize(nw, nh)
      }
      window.addEventListener('resize', onResize)

      return () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        if (renderer) {
          renderer.domElement.removeEventListener('pointerdown', onPointer)
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
      console.warn('[HomeMenuHall] WebGL unavailable', e)
      setFailed(true)
      return () => {
        cancelAnimationFrame(raf)
      }
    }
  }, [failed])

  if (failed) {
    return (
      <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-black/80">
        <p className="px-4 pt-3 text-[11px] text-zinc-500">Galerie (mode liste — WebGL indisponible)</p>
        <FallbackGrid />
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_0_60px_rgba(124,58,237,0.12)]">
      <div ref={hostRef} className="w-full min-h-[420px]" />
      <p className="absolute bottom-3 left-3 right-3 text-center text-[11px] text-zinc-400 pointer-events-none">
        Monument xArtists · clique une œuvre-menu pour entrer
      </p>
    </div>
  )
}
