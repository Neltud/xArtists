/**
 * Accueil = salle 3D : le menu est exposé comme des œuvres.
 * Clique un panneau → navigation (parcours type musée).
 */
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type Exhibit = { id: string; label: string; sub: string; href: string; color: number }

const EXHIBITS: Exhibit[] = [
  { id: 'museum', label: 'Musée', sub: 'Galerie 3D', href: '#/museum', color: 0xc4a574 },
  { id: 'market', label: 'Marché', sub: 'NFT listings', href: '#/marketplace', color: 0xa855f7 },
  { id: 'slot', label: 'Slot', sub: 'EGLD live', href: '#/slot', color: 0xf59e0b },
  { id: 'packs', label: 'Packs', sub: 'Agents IA', href: '#/agents', color: 0x22d3ee },
  { id: 'cc', label: 'Command', sub: 'Signaux holo', href: '#/command-center', color: 0x34d399 },
  { id: 'tca', label: 'TCA', sub: 'Classroom', href: '#/tca', color: 0xf472b6 },
  { id: 'lia', label: 'LIA', sub: 'Oracle paper', href: '#/lia', color: 0x60a5fa },
  { id: 'stake', label: 'Staking', sub: '$TRO on-chain', href: '#/staking', color: 0x4ade80 },
]

export default function HomeMenuHall() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const w = host.clientWidth || 360
    const h = Math.max(360, Math.min(520, Math.floor(w * 0.85)))

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x08060c)
    scene.fog = new THREE.Fog(0x08060c, 6, 16)

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 40)
    camera.position.set(0, 1.4, 5.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    host.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const key = new THREE.DirectionalLight(0xffe6c8, 0.9)
    key.position.set(3, 6, 4)
    scene.add(key)
    const rim = new THREE.PointLight(0x7c3aed, 1.2, 12)
    rim.position.set(-2, 2, 1)
    scene.add(rim)

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 10),
      new THREE.MeshStandardMaterial({ color: 0x121018, metalness: 0.3, roughness: 0.85 }),
    )
    floor.rotation.x = -Math.PI / 2
    scene.add(floor)

    // Back wall
    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 5),
      new THREE.MeshStandardMaterial({ color: 0x0e0c14, metalness: 0.2, roughness: 0.9 }),
    )
    back.position.set(0, 2.2, -3.2)
    scene.add(back)

    const panels: THREE.Mesh[] = []
    const n = EXHIBITS.length
    EXHIBITS.forEach((ex, i) => {
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 640
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#0a0a12'
      ctx.fillRect(0, 0, 512, 640)
      // frame
      ctx.strokeStyle = `#${ex.color.toString(16).padStart(6, '0')}`
      ctx.lineWidth = 12
      ctx.strokeRect(16, 16, 480, 608)
      ctx.fillStyle = `#${ex.color.toString(16).padStart(6, '0')}`
      ctx.globalAlpha = 0.15
      ctx.fillRect(40, 40, 432, 200)
      ctx.globalAlpha = 1
      ctx.fillStyle = '#f4f4f5'
      ctx.font = 'bold 56px system-ui,sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(ex.label, 256, 320)
      ctx.fillStyle = '#a1a1aa'
      ctx.font = '32px system-ui,sans-serif'
      ctx.fillText(ex.sub, 256, 380)
      ctx.fillStyle = '#71717a'
      ctx.font = '24px system-ui,sans-serif'
      ctx.fillText('entrer →', 256, 520)

      const tex = new THREE.CanvasTexture(canvas)
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        emissive: new THREE.Color(ex.color),
        emissiveIntensity: 0.12,
        roughness: 0.55,
        metalness: 0.15,
      })
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.45), mat)
      // arc along room
      const ang = (i / (n - 1) - 0.5) * 1.35
      mesh.position.set(Math.sin(ang) * 3.2, 1.35, -2.2 + Math.cos(ang) * 0.8)
      mesh.lookAt(0, 1.2, 4)
      mesh.userData.href = ex.href
      mesh.userData.id = ex.id
      scene.add(mesh)
      panels.push(mesh)

      // pedestal
      const ped = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.08, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x1c1917 }),
      )
      ped.position.set(mesh.position.x, 0.55, mesh.position.z + 0.15)
      scene.add(ped)
    })

    // soft path lights
    for (let i = 0; i < 5; i++) {
      const pl = new THREE.PointLight(0xc4b5fd, 0.35, 4)
      pl.position.set((i - 2) * 1.4, 0.3, 1.5)
      scene.add(pl)
    }

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    const onPointer = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(panels, false)
      if (!hits.length) return
      const href = hits[0].object.userData.href as string
      if (href) window.location.hash = href
    }
    renderer.domElement.style.cursor = 'pointer'
    renderer.domElement.addEventListener('pointerdown', onPointer)

    let raf = 0
    const t0 = performance.now()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = (performance.now() - t0) / 1000
      camera.position.x = Math.sin(t * 0.15) * 0.25
      camera.lookAt(0, 1.2, -1)
      panels.forEach((p, i) => {
        p.position.y = 1.35 + Math.sin(t * 0.8 + i * 0.4) * 0.04
      })
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const nw = host.clientWidth || 360
      const nh = Math.max(360, Math.min(520, Math.floor(nw * 0.85)))
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('pointerdown', onPointer)
      renderer.dispose()
      if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-black">
      <div ref={hostRef} className="w-full" />
      <p className="absolute bottom-3 left-3 right-3 text-center text-[11px] text-zinc-400 pointer-events-none">
        Salle d&apos;accueil · clique une œuvre-menu pour entrer dans la pièce
      </p>
    </div>
  )
}
