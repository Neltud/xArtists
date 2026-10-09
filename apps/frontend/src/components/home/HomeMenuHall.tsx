/**
 * Accueil = salle 3D 360° : menu exposé comme œuvres illustrées.
 * Orbit caméra · panneaux lisibles · fallback grille.
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'

type Exhibit = {
  id: string
  label: string
  sub: string
  path: string
  color: number
  /** simple glyph drawn on canvas */
  glyph: 'museum' | 'market' | 'slot' | 'packs' | 'command' | 'tca' | 'lia' | 'stake'
}

const EXHIBITS: Exhibit[] = [
  { id: 'museum', label: 'Musée', sub: 'Galerie 3D', path: '/museum', color: 0xc4a574, glyph: 'museum' },
  { id: 'market', label: 'Marché', sub: 'NFT listings', path: '/marketplace', color: 0xa855f7, glyph: 'market' },
  { id: 'slot', label: 'Slot', sub: 'EGLD live', path: '/slot', color: 0xf59e0b, glyph: 'slot' },
  { id: 'packs', label: 'Packs', sub: 'Agents IA', path: '/agents', color: 0x22d3ee, glyph: 'packs' },
  { id: 'cc', label: 'Command', sub: 'Signaux holo', path: '/command-center', color: 0x34d399, glyph: 'command' },
  { id: 'tca', label: 'TCA', sub: 'Classroom', path: '/tca', color: 0xf472b6, glyph: 'tca' },
  { id: 'lia', label: 'LIA', sub: 'Oracle paper', path: '/lia', color: 0x60a5fa, glyph: 'lia' },
  { id: 'stake', label: 'Staking', sub: '$TRO', path: '/staking', color: 0x4ade80, glyph: 'stake' },
]

function drawGlyph(ctx: CanvasRenderingContext2D, glyph: Exhibit['glyph'], cx: number, cy: number, hex: string) {
  ctx.save()
  ctx.strokeStyle = hex
  ctx.fillStyle = hex
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  switch (glyph) {
    case 'museum': {
      // columns
      ctx.beginPath()
      ctx.moveTo(cx - 50, cy + 40)
      ctx.lineTo(cx - 50, cy - 20)
      ctx.moveTo(cx, cy + 40)
      ctx.lineTo(cx, cy - 30)
      ctx.moveTo(cx + 50, cy + 40)
      ctx.lineTo(cx + 50, cy - 20)
      ctx.moveTo(cx - 70, cy - 20)
      ctx.lineTo(cx + 70, cy - 20)
      ctx.stroke()
      break
    }
    case 'market': {
      // storefront
      ctx.strokeRect(cx - 55, cy - 25, 110, 70)
      ctx.beginPath()
      ctx.moveTo(cx - 65, cy - 25)
      ctx.lineTo(cx, cy - 55)
      ctx.lineTo(cx + 65, cy - 25)
      ctx.stroke()
      break
    }
    case 'slot': {
      // reels
      ctx.strokeRect(cx - 60, cy - 35, 120, 70)
      ctx.beginPath()
      ctx.moveTo(cx - 20, cy - 35)
      ctx.lineTo(cx - 20, cy + 35)
      ctx.moveTo(cx + 20, cy - 35)
      ctx.lineTo(cx + 20, cy + 35)
      ctx.stroke()
      ctx.font = 'bold 28px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('7', cx - 40, cy + 10)
      ctx.fillText('7', cx, cy + 10)
      ctx.fillText('7', cx + 40, cy + 10)
      break
    }
    case 'packs': {
      // stacked cards
      ctx.strokeRect(cx - 45, cy - 20, 70, 50)
      ctx.strokeRect(cx - 35, cy - 30, 70, 50)
      ctx.strokeRect(cx - 25, cy - 40, 70, 50)
      break
    }
    case 'command': {
      // radar
      ctx.beginPath()
      ctx.arc(cx, cy, 45, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, 25, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + 40, cy - 25)
      ctx.stroke()
      break
    }
    case 'tca': {
      // book / classroom
      ctx.beginPath()
      ctx.moveTo(cx - 50, cy - 30)
      ctx.lineTo(cx, cy - 45)
      ctx.lineTo(cx + 50, cy - 30)
      ctx.lineTo(cx + 50, cy + 35)
      ctx.lineTo(cx, cy + 45)
      ctx.lineTo(cx - 50, cy + 35)
      ctx.closePath()
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx, cy - 45)
      ctx.lineTo(cx, cy + 45)
      ctx.stroke()
      break
    }
    case 'lia': {
      // brain / node
      ctx.beginPath()
      ctx.arc(cx, cy - 10, 35, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx - 25, cy + 25, 12, 0, Math.PI * 2)
      ctx.arc(cx + 25, cy + 25, 12, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx - 15, cy + 15)
      ctx.lineTo(cx - 20, cy + 18)
      ctx.moveTo(cx + 15, cy + 15)
      ctx.lineTo(cx + 20, cy + 18)
      ctx.stroke()
      break
    }
    case 'stake': {
      // lock / coin
      ctx.beginPath()
      ctx.arc(cx, cy + 5, 40, 0, Math.PI * 2)
      ctx.stroke()
      ctx.font = 'bold 36px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('T', cx, cy + 18)
      break
    }
  }
  ctx.restore()
}

function paintPanel(ex: Exhibit): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 768
  canvas.height = 960
  const ctx = canvas.getContext('2d')!
  const hex = `#${ex.color.toString(16).padStart(6, '0')}`

  // dark plate
  const g = ctx.createLinearGradient(0, 0, 0, 960)
  g.addColorStop(0, '#0c0a14')
  g.addColorStop(1, '#06050a')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 768, 960)

  // outer frame
  ctx.strokeStyle = hex
  ctx.lineWidth = 18
  ctx.strokeRect(28, 28, 712, 904)
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 4
  ctx.strokeRect(48, 48, 672, 864)

  // illustration zone
  ctx.fillStyle = hex
  ctx.globalAlpha = 0.12
  ctx.fillRect(80, 80, 608, 320)
  ctx.globalAlpha = 1
  drawGlyph(ctx, ex.glyph, 384, 230, hex)

  // labels — large readable
  ctx.fillStyle = '#fafafa'
  ctx.font = 'bold 72px system-ui,Segoe UI,sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(ex.label, 384, 520)

  ctx.fillStyle = '#d4d4d8'
  ctx.font = '36px system-ui,Segoe UI,sans-serif'
  ctx.fillText(ex.sub, 384, 580)

  ctx.fillStyle = hex
  ctx.font = 'bold 28px system-ui,sans-serif'
  ctx.fillText('ENTRER  →', 384, 720)

  ctx.fillStyle = '#71717a'
  ctx.font = '22px system-ui,sans-serif'
  ctx.fillText('salle · clic pour ouvrir', 384, 780)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function FallbackGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
      {EXHIBITS.map(ex => (
        <Link
          key={ex.id}
          to={ex.path}
          className="rounded-2xl border border-white/15 bg-black/60 p-4 hover:border-violet-400/50 transition"
        >
          <p className="text-base font-semibold text-white">{ex.label}</p>
          <p className="text-[12px] text-zinc-400">{ex.sub}</p>
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
      const w = Math.max(300, host.clientWidth || 400)
      const h = Math.max(480, Math.min(720, Math.floor(w * 1.05)))

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x05030a)
      scene.fog = new THREE.FogExp2(0x05030a, 0.028)

      // True hall feel: wider FOV, camera inside the ring
      const camera = new THREE.PerspectiveCamera(72, w / h, 0.1, 80)
      camera.position.set(0, 1.7, 0.2)

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
      host.innerHTML = ''
      host.appendChild(renderer.domElement)

      scene.add(new THREE.AmbientLight(0xffffff, 0.42))
      const key = new THREE.DirectionalLight(0xffe8d0, 1.05)
      key.position.set(5, 8, 4)
      scene.add(key)
      const rim = new THREE.PointLight(0x7c3aed, 1.6, 24)
      rim.position.set(-4, 3, -2)
      scene.add(rim)
      const rim2 = new THREE.PointLight(0x22d3ee, 0.9, 20)
      rim2.position.set(4, 2, 2)
      scene.add(rim2)

      const floorGeo = new THREE.CircleGeometry(9, 48)
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x0a0812,
        metalness: 0.55,
        roughness: 0.35,
      })
      const floor = new THREE.Mesh(floorGeo, floorMat)
      floor.rotation.x = -Math.PI / 2
      scene.add(floor)
      disposables.push(floorGeo, floorMat)

      // ring ceiling light
      const ringGeo = new THREE.TorusGeometry(6.2, 0.04, 8, 64)
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x7c3aed })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2
      ring.position.y = 3.6
      scene.add(ring)
      disposables.push(ringGeo, ringMat)

      const panels: THREE.Mesh[] = []
      const n = EXHIBITS.length
      const radius = 5.2

      EXHIBITS.forEach((ex, i) => {
        const tex = paintPanel(ex)
        const mat = new THREE.MeshStandardMaterial({
          map: tex,
          emissive: new THREE.Color(ex.color),
          emissiveIntensity: 0.22,
          roughness: 0.4,
          metalness: 0.25,
        })
        const geo = new THREE.PlaneGeometry(2.1, 2.65)
        const mesh = new THREE.Mesh(geo, mat)
        // full 360° around the visitor
        const ang = (i / n) * Math.PI * 2 - Math.PI / 2
        mesh.position.set(Math.cos(ang) * radius, 1.55, Math.sin(ang) * radius)
        mesh.lookAt(0, 1.55, 0)
        mesh.userData.path = ex.path
        mesh.userData.baseY = 1.55
        scene.add(mesh)
        panels.push(mesh)
        disposables.push(geo, mat, tex)

        const pedGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.12, 16)
        const pedMat = new THREE.MeshStandardMaterial({ color: 0x1a1520, metalness: 0.5, roughness: 0.5 })
        const ped = new THREE.Mesh(pedGeo, pedMat)
        ped.position.set(mesh.position.x * 0.92, 0.2, mesh.position.z * 0.92)
        scene.add(ped)
        disposables.push(pedGeo, pedMat)
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
      }
      const onUp = (ev: PointerEvent) => {
        if (!dragging || !renderer) return
        const dx = Math.abs(ev.clientX - lastX)
        dragging = false
        if (dx > 8) return // was a drag, not a click
        const rect = renderer.domElement.getBoundingClientRect()
        pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObjects(panels, false)
        if (hits.length) {
          const path = hits[0].object.userData.path as string
          if (path) window.location.hash = `#${path}`
        }
      }
      const onMove = (ev: PointerEvent) => {
        if (!dragging) return
        const dx = ev.clientX - lastX
        lastX = ev.clientX
        targetYaw -= dx * 0.005
      }

      renderer.domElement.style.cursor = 'grab'
      renderer.domElement.addEventListener('pointerdown', onDown)
      renderer.domElement.addEventListener('pointerup', onUp)
      renderer.domElement.addEventListener('pointerleave', () => {
        dragging = false
      })
      renderer.domElement.addEventListener('pointermove', onMove)

      const t0 = performance.now()
      const animate = () => {
        raf = requestAnimationFrame(animate)
        if (!renderer) return
        const t = (performance.now() - t0) / 1000
        // gentle auto-orbit + user drag
        if (!dragging) targetYaw += 0.0012
        yaw += (targetYaw - yaw) * 0.08
        const r = 0.15
        camera.position.x = Math.sin(yaw) * r
        camera.position.z = Math.cos(yaw) * r
        camera.position.y = 1.7 + Math.sin(t * 0.35) * 0.05
        camera.rotation.set(0, yaw, 0)

        panels.forEach((p, i) => {
          p.position.y = (p.userData.baseY as number) + Math.sin(t * 0.9 + i * 0.5) * 0.06
          const m = p.material as THREE.MeshStandardMaterial
          m.emissiveIntensity = 0.18 + Math.sin(t * 1.4 + i) * 0.08
        })
        ring.rotation.z = t * 0.15
        renderer.render(scene, camera)
      }
      animate()

      const onResize = () => {
        if (!renderer || !host) return
        const nw = Math.max(300, host.clientWidth || 400)
        const nh = Math.max(480, Math.min(720, Math.floor(nw * 1.05)))
        camera.aspect = nw / nh
        camera.updateProjectionMatrix()
        renderer.setSize(nw, nh)
      }
      window.addEventListener('resize', onResize)

      return () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        if (renderer) {
          renderer.domElement.removeEventListener('pointerdown', onDown)
          renderer.domElement.removeEventListener('pointerup', onUp)
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
      console.warn('[HomeMenuHall] WebGL fail', e)
      setFailed(true)
      return () => cancelAnimationFrame(raf)
    }
  }, [failed])

  if (failed) {
    return (
      <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-black/80">
        <p className="px-4 pt-3 text-[11px] text-zinc-500">Salle (liste — WebGL indisponible)</p>
        <FallbackGrid />
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_0_80px_rgba(124,58,237,0.15)]">
      <div ref={hostRef} className="w-full min-h-[480px]" />
      <p className="absolute bottom-3 left-3 right-3 text-center text-[11px] text-zinc-300/90 pointer-events-none">
        Glisse pour tourner à 360° · clique une œuvre pour entrer
      </p>
    </div>
  )
}
