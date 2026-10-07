/**
 * Grande galerie 3D — menu = œuvres murales dans un hall muséal panoramique.
 * Camera orbit + FOV large + cadres illustrés (pas de cartes 2D plates).
 */
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type Exhibit = {
  id: string
  label: string
  sub: string
  href: string
  color: number
  motif: 'arch' | 'grid' | 'orbit' | 'pulse' | 'hex' | 'book' | 'wave' | 'lock'
}

const EXHIBITS: Exhibit[] = [
  { id: 'museum', label: 'Musée', sub: 'Galerie 3D', href: '#/museum', color: 0xc4a574, motif: 'arch' },
  { id: 'market', label: 'Marché', sub: 'NFT live', href: '#/marketplace', color: 0xa855f7, motif: 'grid' },
  { id: 'slot', label: 'Slot', sub: 'EGLD', href: '#/slot', color: 0xf59e0b, motif: 'orbit' },
  { id: 'packs', label: 'Packs', sub: 'Agents IA', href: '#/agents', color: 0x22d3ee, motif: 'hex' },
  { id: 'cc', label: 'Command', sub: 'Signaux', href: '#/command-center', color: 0x34d399, motif: 'pulse' },
  { id: 'tca', label: 'TCA', sub: 'Classroom', href: '#/tca', color: 0xf472b6, motif: 'book' },
  { id: 'lia', label: 'LIA', sub: 'Oracle', href: '#/lia', color: 0x60a5fa, motif: 'wave' },
  { id: 'stake', label: 'Staking', sub: '$TRO', href: '#/staking', color: 0x4ade80, motif: 'lock' },
]

function hexCss(n: number) {
  return `#${n.toString(16).padStart(6, '0')}`
}

/** Canvas texture = illustrated mural, not flat text card */
function paintExhibit(ex: Exhibit): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 768
  canvas.height = 960
  const ctx = canvas.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 960)
  g.addColorStop(0, '#0c0a12')
  g.addColorStop(0.45, '#14101c')
  g.addColorStop(1, '#08060c')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 768, 960)

  // atmospheric glow
  const rg = ctx.createRadialGradient(384, 320, 40, 384, 320, 420)
  rg.addColorStop(0, hexCss(ex.color) + '55')
  rg.addColorStop(1, 'transparent')
  ctx.fillStyle = rg
  ctx.fillRect(0, 0, 768, 960)

  // motif illustration
  ctx.strokeStyle = hexCss(ex.color)
  ctx.fillStyle = hexCss(ex.color)
  ctx.lineWidth = 6
  ctx.globalAlpha = 0.85
  const cx = 384
  const cy = 300
  if (ex.motif === 'arch') {
    ctx.beginPath()
    ctx.arc(cx, cy + 40, 120, Math.PI, 0)
    ctx.stroke()
    ctx.fillRect(cx - 100, cy + 40, 40, 140)
    ctx.fillRect(cx + 60, cy + 40, 40, 140)
  } else if (ex.motif === 'grid') {
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 3; j++) {
        ctx.strokeRect(cx - 130 + i * 70, cy - 80 + j * 70, 50, 50)
      }
  } else if (ex.motif === 'orbit') {
    ctx.beginPath()
    ctx.arc(cx, cy, 100, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx + 70, cy - 40, 28, 0, Math.PI * 2)
    ctx.fill()
  } else if (ex.motif === 'hex') {
    for (let k = 0; k < 3; k++) {
      const r = 50 + k * 40
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6
        const x = cx + Math.cos(a) * r
        const y = cy + Math.sin(a) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
    }
  } else if (ex.motif === 'pulse') {
    for (let i = 0; i < 4; i++) {
      ctx.beginPath()
      ctx.arc(cx, cy, 40 + i * 35, 0, Math.PI * 2)
      ctx.globalAlpha = 0.7 - i * 0.15
      ctx.stroke()
    }
  } else if (ex.motif === 'book') {
    ctx.strokeRect(cx - 90, cy - 110, 180, 240)
    ctx.beginPath()
    ctx.moveTo(cx, cy - 110)
    ctx.lineTo(cx, cy + 130)
    ctx.stroke()
  } else if (ex.motif === 'wave') {
    ctx.beginPath()
    for (let x = 80; x < 700; x += 8) {
      const y = cy + Math.sin(x * 0.03) * 50 + Math.sin(x * 0.01) * 20
      if (x === 80) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  } else {
    // lock
    ctx.strokeRect(cx - 50, cy - 20, 100, 90)
    ctx.beginPath()
    ctx.arc(cx, cy - 20, 40, Math.PI, 0)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // gold frame inner
  ctx.strokeStyle = '#d4af77'
  ctx.lineWidth = 14
  ctx.strokeRect(28, 28, 712, 904)
  ctx.strokeStyle = hexCss(ex.color)
  ctx.lineWidth = 3
  ctx.strokeRect(48, 48, 672, 864)

  // labels
  ctx.fillStyle = '#fafafa'
  ctx.font = 'bold 64px "Segoe UI", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(ex.label, 384, 680)
  ctx.fillStyle = '#a1a1aa'
  ctx.font = '36px system-ui, sans-serif'
  ctx.fillText(ex.sub, 384, 740)
  ctx.fillStyle = hexCss(ex.color)
  ctx.font = '28px system-ui, sans-serif'
  ctx.fillText('entrer →', 384, 820)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse(child => {
    const m = child as THREE.Mesh
    if (m.geometry) m.geometry.dispose()
    const mat = m.material as THREE.Material | THREE.Material[] | undefined
    if (mat) {
      const list = Array.isArray(mat) ? mat : [mat]
      for (const material of list) {
        const std = material as THREE.MeshStandardMaterial
        if (std.map) std.map.dispose()
        material.dispose()
      }
    }
  })
}

export default function HomeMenuHall() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const w = host.clientWidth || 400
    const h = Math.max(420, Math.min(640, Math.floor(window.innerHeight * 0.55)))

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x06040a)
    scene.fog = new THREE.FogExp2(0x06040a, 0.045)

    // Wide FOV, camera further back
    const camera = new THREE.PerspectiveCamera(58, w / h, 0.1, 80)
    const camHome = new THREE.Vector3(0, 2.1, 11.5)
    camera.position.copy(camHome)

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    host.appendChild(renderer.domElement)

    // Lights — museum neon / spot
    scene.add(new THREE.AmbientLight(0x9aa4c0, 0.35))
    const key = new THREE.DirectionalLight(0xffe8cc, 0.7)
    key.position.set(4, 10, 6)
    scene.add(key)
    const neonL = new THREE.PointLight(0x7c3aed, 2.2, 28)
    neonL.position.set(-6, 3.5, 2)
    scene.add(neonL)
    const neonR = new THREE.PointLight(0x22d3ee, 1.6, 24)
    neonR.position.set(6, 3.2, 1)
    scene.add(neonR)
    const ceil = new THREE.PointLight(0xffffff, 0.5, 40)
    ceil.position.set(0, 7, 0)
    scene.add(ceil)

    // Floor — large reflective hall
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(18, 64),
      new THREE.MeshStandardMaterial({
        color: 0x121018,
        metalness: 0.55,
        roughness: 0.35,
      }),
    )
    floor.rotation.x = -Math.PI / 2
    scene.add(floor)

    // Ring floor inlay
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(4.5, 4.7, 64),
      new THREE.MeshStandardMaterial({ color: 0x4c1d95, emissive: 0x2e1065, emissiveIntensity: 0.6 }),
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.02
    scene.add(ring)

    // Curved back wall (cylinder section)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0e0c14,
      metalness: 0.15,
      roughness: 0.9,
      side: THREE.DoubleSide,
    })
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 8, 48, 1, true, -1.1, 2.2), wallMat)
    wall.position.y = 3.5
    scene.add(wall)

    // Ceiling disc
    const ceiling = new THREE.Mesh(
      new THREE.CircleGeometry(16, 48),
      new THREE.MeshStandardMaterial({ color: 0x0a0810, side: THREE.DoubleSide }),
    )
    ceiling.rotation.x = Math.PI / 2
    ceiling.position.y = 7.2
    scene.add(ceiling)

    const panels: THREE.Mesh[] = []
    const frames: THREE.Mesh[] = []
    const n = EXHIBITS.length
    EXHIBITS.forEach((ex, i) => {
      const ang = (i / n) * Math.PI * 1.35 - Math.PI * 0.675
      const radius = 8.2
      const x = Math.sin(ang) * radius
      const z = -Math.cos(ang) * radius * 0.55 - 2.5

      const tex = paintExhibit(ex)
      const art = new THREE.Mesh(
        new THREE.PlaneGeometry(1.9, 2.4),
        new THREE.MeshStandardMaterial({
          map: tex,
          emissive: new THREE.Color(ex.color),
          emissiveIntensity: 0.08,
          roughness: 0.45,
          metalness: 0.12,
        }),
      )
      art.position.set(x, 2.35, z)
      art.lookAt(0, 2.0, 4)
      art.userData.href = ex.href
      art.userData.id = ex.id
      scene.add(art)
      panels.push(art)

      // 3D picture frame
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(2.05, 2.55, 0.12),
        new THREE.MeshStandardMaterial({
          color: 0x1a1510,
          metalness: 0.6,
          roughness: 0.35,
          emissive: 0x3d2c14,
          emissiveIntensity: 0.15,
        }),
      )
      frame.position.copy(art.position)
      frame.position.z += 0.02
      frame.quaternion.copy(art.quaternion)
      // push frame slightly behind art
      const back = new THREE.Vector3(0, 0, -0.08).applyQuaternion(art.quaternion)
      frame.position.add(back)
      scene.add(frame)
      frames.push(frame)

      // Spotlight on each work
      const spot = new THREE.SpotLight(ex.color, 1.4, 12, 0.35, 0.5)
      spot.position.set(x * 0.3, 6.2, z * 0.3 + 2)
      spot.target = art
      scene.add(spot)
      scene.add(spot.target)

      // Pedestal
      const ped = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.45, 0.9, 16),
        new THREE.MeshStandardMaterial({ color: 0x1c1917, metalness: 0.4, roughness: 0.5 }),
      )
      ped.position.set(x * 0.92, 0.45, z * 0.92 + 0.3)
      scene.add(ped)
    })

    // Center pedestal sculpture (axis mundi)
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.55, 1),
      new THREE.MeshStandardMaterial({
        color: 0x7c3aed,
        emissive: 0x4c1d95,
        emissiveIntensity: 0.7,
        metalness: 0.5,
        roughness: 0.25,
        wireframe: true,
      }),
    )
    core.position.set(0, 1.4, 0)
    scene.add(core)

    let lerpActive = false
    let lerpT = 0
    const lerpFrom = new THREE.Vector3()
    const lerpTo = new THREE.Vector3()
    let pendingHref: string | null = null

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    const onPointer = (ev: PointerEvent) => {
      if (lerpActive) return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(panels, false)
      if (!hits.length) return
      const mesh = hits[0].object as THREE.Mesh
      const href = mesh.userData.href as string
      if (!href) return
      lerpFrom.copy(camera.position)
      lerpTo.copy(mesh.position).add(new THREE.Vector3(0, 0.2, 2.8).applyQuaternion(mesh.quaternion))
      // simpler approach: move toward panel world pos
      const dir = new THREE.Vector3().subVectors(mesh.position, camera.position).normalize()
      lerpTo.copy(camera.position).add(dir.multiplyScalar(4.5))
      lerpTo.y = Math.max(1.6, lerpTo.y)
      lerpT = 0
      lerpActive = true
      pendingHref = href
    }
    renderer.domElement.style.cursor = 'grab'
    renderer.domElement.addEventListener('pointerdown', onPointer)

    let raf = 0
    const t0 = performance.now()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = (performance.now() - t0) / 1000

      core.rotation.y = t * 0.35
      core.rotation.x = Math.sin(t * 0.4) * 0.2

      if (lerpActive) {
        lerpT = Math.min(1, lerpT + 0.028)
        const e = 1 - Math.pow(1 - lerpT, 3)
        camera.position.lerpVectors(lerpFrom, lerpTo, e)
        camera.lookAt(lerpTo.x * 0.5, 2.2, lerpTo.z - 3)
        if (lerpT >= 1 && pendingHref) {
          const href = pendingHref
          pendingHref = null
          lerpActive = false
          window.location.hash = href
        }
      } else {
        // Slow automatic orbit / float
        const orbit = t * 0.08
        camera.position.x = camHome.x + Math.sin(orbit) * 1.4
        camera.position.z = camHome.z + Math.cos(orbit * 0.7) * 0.6 - 0.3
        camera.position.y = camHome.y + Math.sin(t * 0.35) * 0.18
        camera.lookAt(0, 2.0, -1.5)
        panels.forEach((p, i) => {
          p.position.y = 2.35 + Math.sin(t * 0.7 + i * 0.5) * 0.06
        })
      }

      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const nw = host.clientWidth || 400
      const nh = Math.max(420, Math.min(640, Math.floor(window.innerHeight * 0.55)))
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('pointerdown', onPointer)
      disposeObject(scene)
      renderer.dispose()
      if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_0_60px_rgba(124,58,237,0.12)]">
      <div ref={hostRef} className="w-full min-h-[420px]" />
      <p className="absolute bottom-3 left-3 right-3 text-center text-[11px] text-zinc-400/90 pointer-events-none">
        Grande galerie · chaque panneau est une porte · avance de la caméra puis entrée
      </p>
    </div>
  )
}
