/**
 * Grande galerie monumentale — menu = œuvres murales, FOV large, orbit, hover glow.
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
  const rg = ctx.createRadialGradient(384, 320, 40, 384, 320, 420)
  rg.addColorStop(0, hexCss(ex.color) + '55')
  rg.addColorStop(1, 'transparent')
  ctx.fillStyle = rg
  ctx.fillRect(0, 0, 768, 960)
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
      for (let j = 0; j < 3; j++) ctx.strokeRect(cx - 130 + i * 70, cy - 80 + j * 70, 50, 50)
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
    ctx.strokeRect(cx - 50, cy - 20, 100, 90)
    ctx.beginPath()
    ctx.arc(cx, cy - 20, 40, Math.PI, 0)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  ctx.strokeStyle = '#d4af77'
  ctx.lineWidth = 14
  ctx.strokeRect(28, 28, 712, 904)
  ctx.strokeStyle = hexCss(ex.color)
  ctx.lineWidth = 3
  ctx.strokeRect(48, 48, 672, 864)
  ctx.fillStyle = '#fafafa'
  ctx.font = 'bold 64px system-ui,sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(ex.label, 384, 680)
  ctx.fillStyle = '#a1a1aa'
  ctx.font = '36px system-ui,sans-serif'
  ctx.fillText(ex.sub, 384, 740)
  ctx.fillStyle = hexCss(ex.color)
  ctx.font = '28px system-ui,sans-serif'
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
    const h = Math.max(480, Math.min(720, Math.floor(window.innerHeight * 0.62)))

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x050308)
    scene.fog = new THREE.FogExp2(0x050308, 0.038)

    const camera = new THREE.PerspectiveCamera(62, w / h, 0.1, 90)
    const camHome = new THREE.Vector3(0, 2.4, 13.5)
    camera.position.copy(camHome)

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    host.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0x9aa4c0, 0.4))
    const key = new THREE.DirectionalLight(0xffe8cc, 0.75)
    key.position.set(4, 12, 6)
    scene.add(key)
    const neonL = new THREE.PointLight(0x7c3aed, 2.4, 32)
    neonL.position.set(-7, 4, 2)
    scene.add(neonL)
    const neonR = new THREE.PointLight(0x22d3ee, 1.8, 28)
    neonR.position.set(7, 3.5, 1)
    scene.add(neonR)

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(20, 64),
      new THREE.MeshStandardMaterial({ color: 0x0e0c14, metalness: 0.6, roughness: 0.3 }),
    )
    floor.rotation.x = -Math.PI / 2
    scene.add(floor)

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(5, 5.25, 64),
      new THREE.MeshStandardMaterial({ color: 0x5b21b6, emissive: 0x3b0764, emissiveIntensity: 0.7 }),
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.03
    scene.add(ring)

    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(15, 15, 9, 48, 1, true, -1.15, 2.3),
      new THREE.MeshStandardMaterial({ color: 0x0c0a12, metalness: 0.12, roughness: 0.92, side: THREE.DoubleSide }),
    )
    wall.position.y = 4
    scene.add(wall)

    const panels: THREE.Mesh[] = []
    const n = EXHIBITS.length
    EXHIBITS.forEach((ex, i) => {
      const ang = (i / n) * Math.PI * 1.4 - Math.PI * 0.7
      const radius = 9
      const x = Math.sin(ang) * radius
      const z = -Math.cos(ang) * radius * 0.55 - 2.8
      const tex = paintExhibit(ex)
      const art = new THREE.Mesh(
        new THREE.PlaneGeometry(2.1, 2.65),
        new THREE.MeshStandardMaterial({
          map: tex,
          emissive: new THREE.Color(ex.color),
          emissiveIntensity: 0.1,
          roughness: 0.42,
          metalness: 0.1,
        }),
      )
      art.position.set(x, 2.55, z)
      art.lookAt(0, 2.1, 5)
      art.userData.href = ex.href
      scene.add(art)
      panels.push(art)

      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(2.25, 2.8, 0.14),
        new THREE.MeshStandardMaterial({
          color: 0x1a1510,
          metalness: 0.65,
          roughness: 0.32,
          emissive: 0x3d2c14,
          emissiveIntensity: 0.18,
        }),
      )
      frame.position.copy(art.position)
      frame.quaternion.copy(art.quaternion)
      frame.position.add(new THREE.Vector3(0, 0, -0.09).applyQuaternion(art.quaternion))
      scene.add(frame)

      const spot = new THREE.SpotLight(ex.color, 1.5, 14, 0.32, 0.55)
      spot.position.set(x * 0.25, 6.8, z * 0.25 + 2)
      spot.target = art
      scene.add(spot)
      scene.add(spot.target)
    })

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.65, 1),
      new THREE.MeshStandardMaterial({
        color: 0x7c3aed,
        emissive: 0x4c1d95,
        emissiveIntensity: 0.85,
        metalness: 0.55,
        roughness: 0.2,
        wireframe: true,
      }),
    )
    core.position.set(0, 1.55, 0)
    scene.add(core)

    let lerpActive = false
    let lerpT = 0
    const lerpFrom = new THREE.Vector3()
    const lerpTo = new THREE.Vector3()
    let pendingHref: string | null = null
    let hoverMesh: THREE.Mesh | null = null
    const baseEm = new Map<THREE.Mesh, number>()
    panels.forEach(p => {
      baseEm.set(p, (p.material as THREE.MeshStandardMaterial).emissiveIntensity)
    })

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    const playBlip = () => {
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const ctx = new AC()
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.frequency.value = 720
        g.gain.value = 0.035
        o.connect(g)
        g.connect(ctx.destination)
        o.start()
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
        o.stop(ctx.currentTime + 0.11)
        setTimeout(() => ctx.close(), 180)
      } catch {
        /* */
      }
    }

    const onMove = (ev: PointerEvent) => {
      if (lerpActive) return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(panels, false)
      const next = hits.length ? (hits[0].object as THREE.Mesh) : null
      if (next !== hoverMesh) {
        if (hoverMesh) {
          ;(hoverMesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
            baseEm.get(hoverMesh) ?? 0.1
          hoverMesh.scale.setScalar(1)
        }
        hoverMesh = next
        if (hoverMesh) {
          ;(hoverMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5
          hoverMesh.scale.setScalar(1.07)
          renderer.domElement.style.cursor = 'pointer'
        } else renderer.domElement.style.cursor = 'grab'
      }
    }

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
      const dir = new THREE.Vector3().subVectors(mesh.position, camera.position).normalize()
      lerpTo.copy(camera.position).add(dir.multiplyScalar(5))
      lerpTo.y = Math.max(1.8, lerpTo.y)
      lerpT = 0
      lerpActive = true
      pendingHref = href
      playBlip()
    }

    renderer.domElement.style.cursor = 'grab'
    renderer.domElement.addEventListener('pointerdown', onPointer)
    renderer.domElement.addEventListener('pointermove', onMove)

    let raf = 0
    const t0 = performance.now()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = (performance.now() - t0) / 1000
      core.rotation.y = t * 0.4
      core.rotation.x = Math.sin(t * 0.35) * 0.25

      if (lerpActive) {
        lerpT = Math.min(1, lerpT + 0.022)
        const e = 1 - Math.pow(1 - lerpT, 3)
        camera.position.lerpVectors(lerpFrom, lerpTo, e)
        camera.lookAt(lerpTo.x * 0.4, 2.3, lerpTo.z - 4)
        if (lerpT >= 1 && pendingHref) {
          const href = pendingHref
          pendingHref = null
          lerpActive = false
          window.location.hash = href
        }
      } else {
        const orbit = t * 0.07
        camera.position.x = camHome.x + Math.sin(orbit) * 1.6
        camera.position.z = camHome.z + Math.cos(orbit * 0.65) * 0.7
        camera.position.y = camHome.y + Math.sin(t * 0.3) * 0.2
        camera.lookAt(0, 2.2, -1.2)
        panels.forEach((p, i) => {
          if (p !== hoverMesh) p.position.y = 2.55 + Math.sin(t * 0.65 + i * 0.45) * 0.07
        })
      }
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const nw = host.clientWidth || 400
      const nh = Math.max(480, Math.min(720, Math.floor(window.innerHeight * 0.62)))
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('pointerdown', onPointer)
      renderer.domElement.removeEventListener('pointermove', onMove)
      disposeObject(scene)
      renderer.dispose()
      if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_0_80px_rgba(124,58,237,0.18)]">
      <div ref={hostRef} className="w-full min-h-[480px]" />
      <p className="absolute bottom-3 left-3 right-3 text-center text-[11px] text-zinc-400/90 pointer-events-none">
        Monument xArtists · survol = lueur · clic = avancer dans la salle
      </p>
    </div>
  )
}
