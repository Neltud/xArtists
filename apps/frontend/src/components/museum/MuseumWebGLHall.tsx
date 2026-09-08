/**
 * Musée WebGL — 3e personne (avatar visible) + FPS optionnel.
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
const TEX_CONCURRENT = 4
const LOOK_SENS = 0.0019
const PITCH_MAX = 1.15
const WALL_INSET = 0.28
const ACCEL = 22
const FRICTION = 11
const CAM_DIST = 3.4
const CAM_HEIGHT = 1.85

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
    thirdRef.current = third
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
      if (['w', 'a', 's', 'd', 'shift', 'e', 'v'].includes(k)) {
        keys.current[k] = true
        if (k === 'e' && nearestRef.current) setInspect(nearestRef.current)
        if (k === 'v') setThird(t => !t)
      }
    }
    const ku = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false
    }
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)

    let pointerLocked = false
    const onMove = (e: MouseEvent) => {
      if (!pointerLocked) return
      yaw -= e.movementX * LOOK_SENS
      pitch = Math.max(-0.15, Math.min(PITCH_MAX, pitch - e.movementY * LOOK_SENS))
    }
    const onLockChange = () => {
      pointerLocked = document.pointerLockElement === canvas
      setLocked(pointerLocked)
    }
    canvas.addEventListener('click', () => canvas.requestPointerLock?.())
    document.addEventListener('pointerlockchange', onLockChange)
    document.addEventListener('mousemove', onMove)

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
      if (keys.current.w || hold.current['w']) {
        ix += f.x
        iz += f.z
      }
      if (keys.current.s || hold.current['s']) {
        ix -= f.x
        iz -= f.z
      }
      if (keys.current.a || hold.current['a']) {
        ix -= r.x
        iz -= r.z
      }
      if (keys.current.d || hold.current['d']) {
        ix += r.x
        iz += r.z
      }
      const im = Math.hypot(ix, iz)
      if (im > 1e-6) {
        ix /= im
        iz /= im
      }
      const maxSp = sprint ? SPRINT : WALK
      const targetVx = ix * maxSp
      const targetVz = iz * maxSp
      const a = ACCEL * dt
      if (im > 1e-6) {
        vx += (targetVx - vx) * Math.min(1, a / Math.max(maxSp, 0.1))
        vz += (targetVz - vz) * Math.min(1, a / Math.max(maxSp, 0.1))
      } else {
        const damp = Math.exp(-FRICTION * dt)
        vx *= damp
        vz *= damp
      }
      const sp = Math.hypot(vx, vz)
      if (sp > maxSp) {
        vx = (vx / sp) * maxSp
        vz = (vz / sp) * maxSp
      }
      const tryX = px + vx * dt
      const tryZ = pz + vz * dt
      const rad = WALL_INSET
      const can = (x: number, z: number) =>
        pointInBlueprintFloor(blueprint, x, z) &&
        pointInBlueprintFloor(blueprint, x + rad, z) &&
        pointInBlueprintFloor(blueprint, x - rad, z) &&
        pointInBlueprintFloor(blueprint, x, z + rad) &&
        pointInBlueprintFloor(blueprint, x, z - rad)
      if (can(tryX, tryZ)) {
        px = tryX
        pz = tryZ
      } else if (can(tryX, pz)) {
        px = tryX
        vz *= 0.2
      } else if (can(px, tryZ)) {
        pz = tryZ
        vx *= 0.2
      } else {
        vx = 0
        vz = 0
      }

      const moving = Math.hypot(vx, vz) > 0.35
      if (moving) {
        facing = Math.atan2(vx, vz)
        walkPhase += dt * (sprint ? 12 : 9)
      }
      avatar.position.x = px
      avatar.position.z = pz
      avatar.rotation.y = facing
      tickAvatarWalk(avatar, walkPhase, moving ? (sprint ? 1 : 0.7) : 0)
      avatar.visible = thirdRef.current

      if (thirdRef.current) {
        const back = CAM_DIST + (sprint && moving ? 0.35 : 0)
        const cx = px + Math.sin(yaw) * back
        const cz = pz + Math.cos(yaw) * back
        const cy = CAM_HEIGHT + pitch * 1.2
        camera.position.set(cx, cy, cz)
        camera.lookAt(px, EYE * 0.9, pz)
        camera.fov = sprint && moving ? 62 : 58
      } else {
        camera.position.set(px, EYE, pz)
        camera.rotation.order = 'YXZ'
        camera.rotation.y = yaw
        camera.rotation.x = pitch * 0.5 - 0.1
        camera.fov = sprint && moving ? 78 : 72
      }
      camera.updateProjectionMatrix()

      let best: FrameItem | null = null
      let bestD = 3.2
      const eye = new THREE.Vector3(px, EYE, pz)
      for (const a of artAnchors) {
        const d = a.pos.distanceTo(eye)
        if (d < bestD) {
          bestD = d
          best = a.frame
        }
      }
      nearestRef.current = best
      if (best) setNearTitle(best.title)
      else setNearTitle('')

      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      document.removeEventListener('pointerlockchange', onLockChange)
      document.removeEventListener('mousemove', onMove)
      ro.disconnect()
      renderer.dispose()
      if (canvas.parentNode === mount) mount.removeChild(canvas)
    }
  }, [blueprint, paintings, sculptures, room, pal, presence.virtual, roomName])

  if (!frames.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-950 h-[min(70vh,520px)] flex items-center justify-center text-sm text-zinc-500">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
        <span>
          {roomName} · {area} m² · {paintings.length} toiles
        </span>
        <span className="text-[10px] text-zinc-400">
          {third ? '3e personne' : '1re personne'} · {locked ? 'visée ON' : 'pad / WASD'} · V bascule
        </span>
      </div>
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/60"
        style={{ height: 'min(78vh, 580px)' }}
      >
        <div ref={mountRef} className="absolute inset-0" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
            Chargement avatar & salle…
          </div>
        )}
        {hint && ready && (
          <button
            type="button"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[2px] text-center px-6"
            onClick={() => setHint(false)}
          >
            <p className="text-lg font-semibold text-white">Entrer — avatar 3e personne</p>
            <p className="text-[13px] text-zinc-400 mt-2 max-w-sm">
              WASD marcher · Shift courir · souris viser · V = 1re/3e · E fiche
            </p>
          </button>
        )}
        {!third && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
          </div>
        )}
        <div className="absolute top-2 left-2 z-10 rounded-lg px-2.5 py-1.5 text-[10px] backdrop-blur border bg-black/65 border-white/10 text-zinc-300 max-w-[70%] truncate">
          {nearTitle}
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 z-20">
          <div className="grid grid-cols-3 gap-1.5 w-[8.25rem]">
            <span />
            <Pad label="↑" on={v => (hold.current['w'] = v)} />
            <span />
            <Pad label="←" on={v => (hold.current['a'] = v)} />
            <Pad label="↓" on={v => (hold.current['s'] = v)} />
            <Pad label="→" on={v => (hold.current['d'] = v)} />
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              className="rounded-full border border-white/20 bg-black/50 text-white text-[10px] font-semibold px-3 py-2.5"
              onClick={() => setThird(t => !t)}
            >
              {third ? '1P' : '3P'}
            </button>
            <button
              type="button"
              className="rounded-full border border-white/20 bg-black/50 text-white text-[10px] font-semibold px-3 py-2.5"
              onPointerDown={e => {
                e.preventDefault()
                hold.current['shift'] = true
              }}
              onPointerUp={() => (hold.current['shift'] = false)}
              onPointerCancel={() => (hold.current['shift'] = false)}
            >
              Run
            </button>
            <button
              type="button"
              className="rounded-full border border-cyan-400/40 bg-cyan-500/25 text-cyan-50 text-xs font-semibold px-4 py-2.5"
              onClick={() => nearestRef.current && setInspect(nearestRef.current)}
            >
              Fiche
            </button>
          </div>
        </div>
      </div>
      {buyMsg && (
        <p className="text-[11px] text-zinc-400 border border-white/10 rounded-lg px-2.5 py-1.5">{buyMsg}</p>
      )}
      {inspect && (
        <ArtworkDossier
          frame={inspect}
          allowBuy={allowBuy}
          marketLive={marketLive}
          onBuy={onBuy}
          onClose={() => setInspect(null)}
        />
      )}
    </div>
  )
}
