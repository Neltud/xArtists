/**
 * Accueil 360° — panneaux illustrés (sans TCA sur le mur principal).
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
  glyph: 'museum' | 'market' | 'slot' | 'packs' | 'command' | 'lia' | 'stake' | 'studio'
}

const EXHIBITS: Exhibit[] = [
  { id: 'museum', label: 'Musée', sub: 'Galerie 3D', path: '/museum', color: 0xd4a574, glyph: 'museum' },
  { id: 'market', label: 'Marché', sub: 'NFT live', path: '/marketplace', color: 0xc084fc, glyph: 'market' },
  { id: 'slot', label: 'Slot', sub: 'EGLD', path: '/slot', color: 0xfbbf24, glyph: 'slot' },
  { id: 'packs', label: 'Packs', sub: 'Pulse complet', path: '/agents', color: 0x22d3ee, glyph: 'packs' },
  { id: 'cc', label: 'Command', sub: 'Hub holo', path: '/command-center', color: 0x34d399, glyph: 'command' },
  { id: 'lia', label: 'LIA', sub: 'Signaux', path: '/lia', color: 0x60a5fa, glyph: 'lia' },
  { id: 'stake', label: 'Staking', sub: '$TRO', path: '/staking', color: 0x4ade80, glyph: 'stake' },
  { id: 'studio', label: 'Studio', sub: 'Créer NFT', path: '/studio', color: 0xf472b6, glyph: 'studio' },
]

function drawGlyph(ctx: CanvasRenderingContext2D, glyph: Exhibit['glyph'], cx: number, cy: number, hex: string) {
  ctx.save()
  ctx.strokeStyle = hex
  ctx.fillStyle = hex
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  switch (glyph) {
    case 'museum': {
      ctx.beginPath()
      ctx.moveTo(cx - 55, cy + 45)
      ctx.lineTo(cx - 55, cy - 15)
      ctx.moveTo(cx, cy + 45)
      ctx.lineTo(cx, cy - 35)
      ctx.moveTo(cx + 55, cy + 45)
      ctx.lineTo(cx + 55, cy - 15)
      ctx.moveTo(cx - 75, cy - 15)
      ctx.lineTo(cx + 75, cy - 15)
      ctx.moveTo(cx - 75, cy - 15)
      ctx.lineTo(cx, cy - 55)
      ctx.lineTo(cx + 75, cy - 15)
      ctx.stroke()
      break
    }
    case 'market': {
      ctx.strokeRect(cx - 50, cy - 20, 100, 65)
      ctx.beginPath()
      ctx.moveTo(cx - 60, cy - 20)
      ctx.lineTo(cx, cy - 55)
      ctx.lineTo(cx + 60, cy - 20)
      ctx.stroke()
      ctx.strokeRect(cx - 18, cy + 5, 36, 40)
      break
    }
    case 'slot': {
      ctx.strokeRect(cx - 65, cy - 40, 130, 80)
      ctx.beginPath()
      ctx.moveTo(cx - 22, cy - 40)
      ctx.lineTo(cx - 22, cy + 40)
      ctx.moveTo(cx + 22, cy - 40)
      ctx.lineTo(cx + 22, cy + 40)
      ctx.stroke()
      ctx.font = 'bold 32px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('7', cx - 42, cy + 12)
      ctx.fillText('7', cx, cy + 12)
      ctx.fillText('7', cx + 42, cy + 12)
      break
    }
    case 'packs': {
      ctx.strokeRect(cx - 50, cy - 15, 75, 55)
      ctx.strokeRect(cx - 38, cy - 28, 75, 55)
      ctx.strokeRect(cx - 26, cy - 42, 75, 55)
      ctx.font = 'bold 28px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('3', cx + 10, cy - 5)
      break
    }
    case 'command': {
      ctx.beginPath()
      ctx.arc(cx, cy, 50, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, 28, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + 45, cy - 30)
      ctx.stroke()
      for (let a = 0; a < 6; a++) {
        const ang = (a / 6) * Math.PI * 2
        ctx.beginPath()
        ctx.arc(cx + Math.cos(ang) * 50, cy + Math.sin(ang) * 50, 5, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'lia': {
      ctx.beginPath()
      ctx.arc(cx, cy - 8, 38, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx - 20, cy - 8)
      ctx.lineTo(cx + 20, cy - 8)
      ctx.moveTo(cx, cy - 28)
      ctx.lineTo(cx, cy + 12)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx - 28, cy + 28, 14, 0, Math.PI * 2)
      ctx.arc(cx + 28, cy + 28, 14, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
    case 'stake': {
      ctx.beginPath()
      ctx.arc(cx, cy + 5, 42, 0, Math.PI * 2)
      ctx.stroke()
      ctx.font = 'bold 40px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('T', cx, cy + 20)
      break
    }
    case 'studio': {
      ctx.beginPath()
      ctx.moveTo(cx - 40, cy + 40)
      ctx.lineTo(cx - 40, cy - 30)
      ctx.lineTo(cx + 45, cy - 40)
      ctx.lineTo(cx + 45, cy + 30)
      ctx.closePath()
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx - 15, cy + 5)
      ctx.lineTo(cx + 25, cy - 10)
      ctx.stroke()
      break
    }
  }
  ctx.restore()
}

function paintPanel(ex: Exhibit): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 896
  canvas.height = 1120
  const ctx = canvas.getContext('2d')!
  const hex = `#${ex.color.toString(16).padStart(6, '0')}`

  const g = ctx.createLinearGradient(0, 0, 0, 1120)
  g.addColorStop(0, '#120e1c')
  g.addColorStop(0.5, '#0a0812')
  g.addColorStop(1, '#05040a')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 896, 1120)

  // glow frame
  ctx.shadowColor = hex
  ctx.shadowBlur = 24
  ctx.strokeStyle = hex
  ctx.lineWidth = 22
  ctx.strokeRect(32, 32, 832, 1056)
  ctx.shadowBlur = 0
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 5
  ctx.strokeRect(56, 56, 784, 1008)

  // art plate
  const ig = ctx.createRadialGradient(448, 280, 20, 448, 280, 280)
  ig.addColorStop(0, hex + '44')
  ig.addColorStop(1, 'transparent')
  ctx.fillStyle = ig
  ctx.fillRect(80, 80, 736, 400)
  drawGlyph(ctx, ex.glyph, 448, 280, hex)

  ctx.fillStyle = '#fafafa'
  ctx.font = 'bold 84px system-ui,Segoe UI,sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(ex.label, 448, 600)

  ctx.fillStyle = '#d4d4d8'
  ctx.font = '40px system-ui,sans-serif'
  ctx.fillText(ex.sub, 448, 670)

  // CTA pill
  ctx.fillStyle = hex
  ctx.globalAlpha = 0.25
  ctx.beginPath()
  ctx.roundRect(280, 760, 336, 72, 36)
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.strokeStyle = hex
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(280, 760, 336, 72, 36)
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 32px system-ui'
  ctx.fillText('ENTRER  →', 448, 808)

  ctx.fillStyle = '#71717a'
  ctx.font = '24px system-ui'
  ctx.fillText('clic · porte du musée', 448, 920)

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
      const h = Math.max(500, Math.min(740, Math.floor(w * 1.1)))

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x05030a)
      scene.fog = new THREE.FogExp2(0x05030a, 0.026)

      const camera = new THREE.PerspectiveCamera(68, w / h, 0.1, 80)
      camera.position.set(0, 1.7, 0.25)

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
      host.innerHTML = ''
      host.appendChild(renderer.domElement)

      scene.add(new THREE.AmbientLight(0xffffff, 0.45))
      const key = new THREE.DirectionalLight(0xffe8d0, 1.1)
      key.position.set(5, 8, 4)
      scene.add(key)
      scene.add(new THREE.PointLight(0x7c3aed, 1.5, 24).translateX(-4).translateY(3))
      scene.add(new THREE.PointLight(0x22d3ee, 1.0, 20).translateX(4).translateY(2))

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

      const grid = new THREE.GridHelper(16, 32, 0x7c3aed, 0x1a1525)
      grid.position.y = 0.01
      scene.add(grid)

      const ringGeo = new THREE.TorusGeometry(6.2, 0.045, 8, 64)
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xa78bfa })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2
      ring.position.y = 3.7
      scene.add(ring)
      disposables.push(ringGeo, ringMat)

      const panels: THREE.Mesh[] = []
      const n = EXHIBITS.length
      const radius = 5.0

      EXHIBITS.forEach((ex, i) => {
        const tex = paintPanel(ex)
        const mat = new THREE.MeshStandardMaterial({
          map: tex,
          emissive: new THREE.Color(ex.color),
          emissiveIntensity: 0.28,
          roughness: 0.35,
          metalness: 0.3,
        })
        const geo = new THREE.PlaneGeometry(2.2, 2.75)
        const mesh = new THREE.Mesh(geo, mat)
        const ang = (i / n) * Math.PI * 2 - Math.PI / 2
        mesh.position.set(Math.cos(ang) * radius, 1.6, Math.sin(ang) * radius)
        mesh.lookAt(0, 1.6, 0)
        mesh.userData.path = ex.path
        mesh.userData.baseY = 1.6
        scene.add(mesh)
        panels.push(mesh)
        disposables.push(geo, mat, tex)
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
        if (dx > 8) return
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
        targetYaw -= (ev.clientX - lastX) * 0.005
        lastX = ev.clientX
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
        if (!dragging) targetYaw += 0.001
        yaw += (targetYaw - yaw) * 0.08
        camera.position.x = Math.sin(yaw) * 0.12
        camera.position.z = Math.cos(yaw) * 0.12
        camera.position.y = 1.7 + Math.sin(t * 0.35) * 0.04
        camera.rotation.set(0, yaw, 0)
        panels.forEach((p, i) => {
          p.position.y = (p.userData.baseY as number) + Math.sin(t * 0.85 + i * 0.45) * 0.07
          const m = p.material as THREE.MeshStandardMaterial
          m.emissiveIntensity = 0.22 + Math.sin(t * 1.3 + i) * 0.1
        })
        ring.rotation.z = t * 0.12
        renderer.render(scene, camera)
      }
      animate()

      const onResize = () => {
        if (!renderer || !host) return
        const nw = Math.max(300, host.clientWidth || 400)
        const nh = Math.max(500, Math.min(740, Math.floor(nw * 1.1)))
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
        <FallbackGrid />
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_0_80px_rgba(124,58,237,0.18)]">
      <div ref={hostRef} className="w-full min-h-[500px]" />
      <p className="absolute bottom-3 left-3 right-3 text-center text-[11px] text-zinc-300/90 pointer-events-none">
        Glisse pour tourner · clique une porte illustrée
      </p>
    </div>
  )
}
