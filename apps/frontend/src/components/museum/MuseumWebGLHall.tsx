/**
 * Musée WebGL — navigation 3e personne (avatar visible, caméra derrière).
 * Locomotion accel/friction · collision · pad mobile · style jeu A1X.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { createSurrealParticles, tickSurrealParticles, addSurrealLights } from '../../lib/museumSurrealFX'
import { createPlayerAvatar, tickAvatarWalk } from '../../lib/museumAvatar'
import { ArtworkDossier, type FrameItem } from './MuseumCorridor'
import type { RoomBlueprint, WallSeg } from '../../lib/roomBlueprint'
import { blueprintAreaM2 } from '../../lib/roomBlueprint'
import { pointInBlueprintFloor } from '../../lib/loadBlueprint'
import { canListBuyNft } from '../../config/scStatus'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'
import { presenceSnapshot, visitorWaypoints } from '../../lib/museumVisitors'

const EYE = 1.65
const WALK = 3.6
const SPRINT = 6.4
const MAX_ART = 24
const TEX_CONCURRENT = 8
const LOOK_SENS = 0.0019
const PITCH_MAX = 1.15
const WALL_INSET = 0.28
const ACCEL = 22
const FRICTION = 11
const CAM_DIST = 4.2
const CAM_HEIGHT = 2.35

type Theme = 'cyber' | 'stone' | 'gold' | 'white' | 'dark'

const PALETTE: Record<
  Theme,
  { wall: number; floor: number; ceil: number; fog: number; frame: number; emissive: number; trim: number }
> = {
  cyber: { wall: 0x141428, floor: 0x060610, ceil: 0x0a0a18, fog: 0x04040a, frame: 0x1e293b, emissive: 0x0e7490, trim: 0x22d3ee },
  stone: { wall: 0x3d342c, floor: 0x1a1512, ceil: 0x2c241e, fog: 0x0e0c0a, frame: 0x5c4a38, emissive: 0x1c1408, trim: 0x8b7355 },
  gold: { wall: 0x3a3018, floor: 0x16120a, ceil: 0x2a2214, fog: 0x0e0c08, frame: 0x6b5528, emissive: 0x2a1e08, trim: 0xc9a227 },
  white: { wall: 0xe8e2d8, floor: 0xc4bdb0, ceil: 0xf4f0e8, fog: 0xb0a898, frame: 0xd4ccc0, emissive: 0x888070, trim: 0x9a9080 },
  dark: { wall: 0x181410, floor: 0x080604, ceil: 0x100e0c, fog: 0x040302, frame: 0x2a2218, emissive: 0x100c08, trim: 0x44403c },
}

function wallGeom(w: WallSeg) {
  const dx = w.x2 - w.x1
  const dy = w.y2 - w.y1
  const len = Math.hypot(dx, dy) || 0.01
  return { len, angle: Math.atan2(dy, dx), mx: (w.x1 + w.x2) / 2, my: (w.y1 + w.y2) / 2, h: w.height || 3.5 }
}

function bounds(bp: RoomBlueprint) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const w of bp.walls) {
    minX = Math.min(minX, w.x1, w.x2)
    minY = Math.min(minY, w.y1, w.y2)
    maxX = Math.max(maxX, w.x1, w.x2)
    maxY = Math.max(maxY, w.y1, w.y2)
  }
  return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 }
}

function makeVisitorMesh(color: number) {
  const g = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.1 })
  const block = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 0.4), mat)
  block.position.y = 0.8
  g.add(block)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), mat)
  head.position.y = 1.45
  g.add(head)
  return g
}

function Pad({ label, on }: { label: string; on: (v: boolean) => void }) {
  return (
    <button
      type="button"
      className="h-11 w-11 rounded-xl border border-white/15 bg-black/55 text-white text-sm font-bold active:bg-cyan-500/30 touch-manipulation select-none"
      aria-label={label}
      onPointerDown={e => {
        e.preventDefault()
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        on(true)
      }}
      onPointerUp={() => on(false)}
      onPointerCancel={() => on(false)}
      onPointerLeave={() => on(false)}
    >
      {label}
    </button>
  )
}

export default function MuseumWebGLHall({
  blueprint,
  frames,
  room = 'stone',
  allowBuy = true,
  emptyLabel = 'Aucune œuvre',
}: {
  blueprint: RoomBlueprint
  frames: FrameItem[]
  room?: Theme
  allowBuy?: boolean
  emptyLabel?: string
}) {
  const mountRef = useRef<HTMLDivElement>(null)
  const keys = useRef<Record<string, boolean>>({})
  const hold = useRef<Record<string, boolean>>({})
  const nearestRef = useRef<FrameItem | null>(null)
  const thirdRef = useRef(true)
  const [ready, setReady] = useState(false)
  const [hint, setHint] = useState(true)
  const [locked, setLocked] = useState(false)
  const [third, setThird] = useState(true)
  const [nearTitle, setNearTitle] = useState('')
  const [inspect, setInspect] = useState<FrameItem | null>(null)
  const [buyMsg, setBuyMsg] = useState<string | null>(null)
  const { connected } = useWallet()
  const marketLive = canListBuyNft()
  const pal = PALETTE[room] || PALETTE.stone
  const roomName = blueprint.rooms?.[0]?.name || blueprint.name
  const area = Math.round(blueprintAreaM2(blueprint))
  const paintings = useMemo(() => frames.filter(f => f.image).slice(0, MAX_ART), [frames])
  const sculptures = useMemo(() => frames.filter(f => !f.image).slice(0, 6), [frames])
  const presence = useMemo(() => presenceSnapshot(blueprint.id || roomName), [blueprint.id, roomName])

  const onBuy = useCallback(
    async (frame: FrameItem) => {
      if (!connected) {
        requestOpenConnect()
        return
      }
      if (!marketLive) {
        setBuyMsg('Achat on-chain bientôt (SC)')
        return
      }
      setBuyMsg(`Intent: ${frame.title}`)
    },
    [connected, marketLive]
  )

  useEffect(() => {
    thirdRef.current = true // navigation 3e personne verrouillée
  }, [third])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let disposed = false
    let vx = 0
    let vz = 0
    let walkPhase = 0
    let surrealPts: THREE.Points | null = null
    const b = bounds(blueprint)
    const wallH = blueprint.wallHeight || 3.8
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(pal.fog)
    scene.fog = new THREE.FogExp2(pal.fog, room === 'cyber' ? 0.026 : 0.016)
    const camera = new THREE.PerspectiveCamera(60, 1, 0.08, 90)
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = room === 'white' ? 1.15 : room === 'dark' ? 0.85 : 1.05
    mount.appendChild(renderer.domElement)
    const canvas = renderer.domElement
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none'

    const floorMat = new THREE.MeshStandardMaterial({ color: pal.floor, roughness: 0.82, metalness: 0.08 })
    const wallMat = new THREE.MeshStandardMaterial({ color: pal.wall, roughness: 0.9, metalness: 0.04 })
    const ceilMat = new THREE.MeshStandardMaterial({ color: pal.ceil, roughness: 1, metalness: 0 })
    const floorW = Math.max(4, b.maxX - b.minX + 2)
    const floorD = Math.max(4, b.maxY - b.minY + 2)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(floorW, floorD), floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(b.cx, 0, b.cy)
    scene.add(floor)
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(floorW, floorD), ceilMat)
    ceil.rotation.x = Math.PI / 2
    ceil.position.set(b.cx, wallH, b.cy)
    scene.add(ceil)

    for (const w of blueprint.walls) {
      const g = wallGeom(w)
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(g.len, g.h, 0.18), wallMat)
      mesh.position.set(g.mx, g.h / 2, g.my)
      mesh.rotation.y = -g.angle
      scene.add(mesh)
    }

    scene.add(new THREE.AmbientLight(0xffffff, room === 'dark' ? 0.25 : 0.45))
    const key = new THREE.DirectionalLight(0xfff5e6, 0.85)
    key.position.set(b.cx + 4, wallH - 0.5, b.cy - 3)
    scene.add(key)
    try {
      addSurrealLights(scene, b.cx, wallH, b.cy)
      surrealPts = createSurrealParticles(scene, b.cx, b.cy, wallH)
    } catch {
      /* */
    }

    const avatar = createPlayerAvatar(room === 'cyber' ? 0x22d3ee : 0x8b5cf6)
    scene.add(avatar)

    const loader = new THREE.TextureLoader()
    loader.crossOrigin = 'anonymous'
    let texQueue = 0
    const artAnchors: { pos: THREE.Vector3; frame: FrameItem }[] = []
    const wallList = blueprint.walls.filter(w => Math.hypot(w.x2 - w.x1, w.y2 - w.y1) > 1.2)
    paintings.forEach((frame, i) => {
      const w = wallList[i % Math.max(1, wallList.length)]
      if (!w) return
      const g = wallGeom(w)
      const t = 0.2 + (i % 5) * 0.15
      const ax = w.x1 + (w.x2 - w.x1) * t
      const az = w.y1 + (w.y2 - w.y1) * t
      const nx = -Math.sin(g.angle)
      const nz = Math.cos(g.angle)
      const apx = ax + nx * 0.12
      const apz = az + nz * 0.12
      const frameMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.3, 0.06),
        new THREE.MeshStandardMaterial({
          color: pal.frame,
          roughness: 0.5,
          metalness: 0.2,
          emissive: pal.emissive,
          emissiveIntensity: 0.15,
        })
      )
      frameMesh.position.set(apx, 1.55, apz)
      frameMesh.rotation.y = -g.angle
      scene.add(frameMesh)
      artAnchors.push({ pos: new THREE.Vector3(apx, 1.55, apz), frame })
      if (frame.image && texQueue < TEX_CONCURRENT * 3) {
        texQueue++
        loader.load(frame.image, tex => {
          if (disposed) return
          tex.colorSpace = THREE.SRGBColorSpace
          const art = new THREE.Mesh(
            new THREE.PlaneGeometry(0.95, 1.1),
            new THREE.MeshBasicMaterial({ map: tex })
          )
          art.position.set(apx + nx * 0.04, 1.55, apz + nz * 0.04)
          art.rotation.y = -g.angle
          scene.add(art)
        })
      }
    })

    sculptures.forEach((frame, i) => {
      const ang = (i / Math.max(1, sculptures.length)) * Math.PI * 2
      const sx = b.cx + Math.cos(ang) * 1.8
      const sz = b.cy + Math.sin(ang) * 1.8
      if (!pointInBlueprintFloor(blueprint, sx, sz)) return
      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.4, 0.5, 16),
        new THREE.MeshStandardMaterial({ color: pal.trim, roughness: 0.4, metalness: 0.3 })
      )
      pedestal.position.set(sx, 0.25, sz)
      scene.add(pedestal)
      const form = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.35, 0),
        new THREE.MeshStandardMaterial({
          color: pal.emissive,
          roughness: 0.3,
          metalness: 0.5,
          emissive: pal.emissive,
          emissiveIntensity: 0.3,
        })
      )
      form.position.set(sx, 0.85, sz)
      scene.add(form)
      artAnchors.push({ pos: new THREE.Vector3(sx, 1.2, sz), frame })
    })

    try {
      const wps = visitorWaypoints(blueprint)
      for (let i = 0; i < Math.min(presence.virtual, wps.length); i++) {
        const m = makeVisitorMesh(0x6688aa)
        m.position.set(wps[i].x, 0, wps[i].z)
        scene.add(m)
      }
    } catch {
      /* */
    }

    let px = b.cx
    let pz = b.cy
    if (!pointInBlueprintFloor(blueprint, px, pz)) {
      px = b.minX + 1.5
      pz = b.minY + 1.5
    }
    let yaw = 0
    let pitch = 0.25
    let facing = 0
    avatar.position.set(px, 0, pz)

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth || 1
      const h = mount.clientHeight || 1
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    })
    ro.observe(mount)
    renderer.setSize(mount.clientWidth || 640, mount.clientHeight || 400, false)

    const kd = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'shift', 'e'].includes(k)) {
        keys.current[k] = true
        if (k === 'e' && nearestRef.current) setInspect(nearestRef.current)
      }
    }
    const ku = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false
    }
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)

    // 3e personne: drag pour orbiter (pas besoin de pointer-lock)
    let dragging = false
    let lastX = 0
    let lastY = 0
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      canvas.setPointerCapture?.(e.pointerId)
      setLocked(true)
    }
    const onUp = (e: PointerEvent) => {
      dragging = false
      setLocked(false)
      try { canvas.releasePointerCapture?.(e.pointerId) } catch { /* */ }
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      yaw -= dx * 0.005
      pitch = Math.max(-0.05, Math.min(PITCH_MAX, pitch - dy * 0.004))
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('pointermove', onMove)
    const onLockChange = () => {
      /* reserved */
    }

    setReady(true)
    const clock = new THREE.Clock()
    let raf = 0
    const loop = () => {
      if (disposed) return
      raf = requestAnimationFrame(loop)
      const dt = Math.min(clock.getDelta(), 0.05)
      try {
        if (surrealPts) tickSurrealParticles(surrealPts, clock.elapsedTime)
      } catch {
        /* */
      }

      const sprint = keys.current.shift || hold.current['shift']
      const f = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw))
      const r = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw))
      let ix = 0
      let iz = 0
      if (keys.current.w || hold.current.w) {
        ix += f.x
        iz += f.z
      }
      if (keys.current.s || hold.current.s) {
        ix -= f.x
        iz -= f.z
      }
      if (keys.current.a || hold.current.a) {
        ix -= r.x
        iz -= r.z
      }
      if (keys.current.d || hold.current.d) {
        ix += r.x
        iz += r.z
      }
      const ilen = Math.hypot(ix, iz)
      if (ilen > 0.001) {
        ix /= ilen
        iz /= ilen
        facing = Math.atan2(ix, iz)
      }
      const speed = sprint ? SPRINT : WALK
      if (ilen > 0.001) {
        vx += ix * ACCEL * dt
        vz += iz * ACCEL * dt
      } else {
        vx *= Math.max(0, 1 - FRICTION * dt)
        vz *= Math.max(0, 1 - FRICTION * dt)
      }
      const vlen = Math.hypot(vx, vz)
      if (vlen > speed) {
        vx = (vx / vlen) * speed
        vz = (vz / vlen) * speed
      }
      let nx = px + vx * dt
      let nz = pz + vz * dt
      if (pointInBlueprintFloor(blueprint, nx, nz)) {
        px = nx
        pz = nz
      } else {
        vx *= 0.2
        vz *= 0.2
      }
      if (vlen > 0.35) {
        facing = Math.atan2(vx, vz)
        walkPhase += dt * (sprint ? 12 : 9)
      }
      avatar.position.set(px, 0, pz)
      avatar.rotation.y = facing
      tickAvatarWalk(avatar, walkPhase, vlen > 0.3 ? (sprint ? 1 : 0.7) : 0)

      let nearest: FrameItem | null = null
      let best = 2.4
      for (const a of artAnchors) {
        const d = Math.hypot(a.pos.x - px, a.pos.z - pz)
        if (d < best) {
          best = d
          nearest = a.frame
        }
      }
      nearestRef.current = nearest
      setNearTitle(nearest?.title || '')

      const moving = Math.hypot(vx, vz) > 0.35
      // Toujours 3e personne — caméra derrière l'avatar
      avatar.visible = true
      const back = CAM_DIST + (sprint && moving ? 0.4 : 0)
      // léger décalage épaule droite pour un rendu type jeu
      const side = 0.55
      const cx = px + Math.sin(yaw) * back + Math.cos(yaw) * side
      const cz = pz + Math.cos(yaw) * back - Math.sin(yaw) * side
      const cy = CAM_HEIGHT + pitch * 1.1
      camera.position.set(cx, cy, cz)
      camera.lookAt(px, EYE * 0.95, pz)
      camera.fov = sprint && moving ? 60 : 55
      camera.updateProjectionMatrix()
      renderer.render(scene, camera)
    }
    loop()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('pointermove', onMove)
      ro.disconnect()
      renderer.dispose()
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas)
    }
  }, [blueprint, paintings, sculptures, pal, room, presence.virtual])

  return (
    <div className="relative h-[min(70vh,520px)] bg-black select-none">
      <div ref={mountRef} className="absolute inset-0" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500 z-10">
          Initialisation WebGL…
        </div>
      )}
      {hint && ready && (
        <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap gap-2 justify-between pointer-events-none">
          <div className="rounded-xl bg-black/60 border border-white/10 px-3 py-2 text-[11px] text-zinc-300 pointer-events-auto">
            {roomName} · {area} m² · {paintings.length} tableaux · avatar 3e pers.
            {nearTitle ? ` · près de « ${nearTitle} » (E)` : ''}
          </div>
          <button
            type="button"
            className="rounded-lg bg-black/55 border border-white/15 px-2 py-1 text-[10px] text-zinc-400 pointer-events-auto"
            onClick={() => setHint(false)}
          >
            OK
          </button>
        </div>
      )}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-end justify-between gap-2">
        <div className="flex gap-1.5">
          <Pad label="W" on={v => (hold.current.w = v)} />
          <div className="flex flex-col gap-1">
            <Pad label="A" on={v => (hold.current.a = v)} />
            <Pad label="S" on={v => (hold.current.s = v)} />
          </div>
          <Pad label="D" on={v => (hold.current.d = v)} />
        </div>
        <div className="flex gap-2 items-center">
          <span className="rounded-xl border border-violet-500/30 bg-violet-500/15 px-3 py-2 text-[11px] text-violet-200 font-medium">
            3e personne
          </span>
          <span className="text-[10px] text-zinc-500">
            {locked ? 'orbe souris' : 'glisser pour regarder · WASD marcher'}
          </span>
        </div>
      </div>
      {inspect && (
        <ArtworkDossier
          frame={inspect}
          onClose={() => setInspect(null)}
          onBuy={allowBuy ? () => onBuy(inspect) : undefined}
          buyMsg={buyMsg}
        />
      )}
      {!paintings.length && !sculptures.length && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <p className="text-sm text-zinc-500 bg-black/50 px-4 py-2 rounded-xl">{emptyLabel}</p>
        </div>
      )}
    </div>
  )
}
