/**
 * Salle musée WebGL — éclairage muséal, visiteurs, sculptures 3D, fiche œuvre complète.
 * Atmosphère surréaliste (particules + lumières irisées).
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { createSurrealParticles, tickSurrealParticles, addSurrealLights } from '../../lib/museumSurrealFX'
import { ArtworkDossier, type FrameItem } from './MuseumCorridor'
import type { RoomBlueprint, WallSeg } from '../../lib/roomBlueprint'
import { blueprintAreaM2 } from '../../lib/roomBlueprint'
import { pointInBlueprintFloor } from '../../lib/loadBlueprint'
import { canListBuyNft } from '../../config/scStatus'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'
import { presenceSnapshot, visitorWaypoints } from '../../lib/museumVisitors'

const EYE = 1.62
const WALK = 3.2
const SPRINT = 5.6
const MAX_ART = 24
const TEX_CONCURRENT = 4
const LOOK_SENS = 0.0022
const PITCH_MAX = 1.15
const WALL_INSET = 0.12

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
    minX = Math.min(minX, w.x1, w.x2); minY = Math.min(minY, w.y1, w.y2)
    maxX = Math.max(maxX, w.x1, w.x2); maxY = Math.max(maxY, w.y1, w.y2)
  }
  return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: Math.max(1, maxX - minX), d: Math.max(1, maxY - minY) }
}

function hangPoints(bp: RoomBlueprint, count: number) {
  const walls = bp.walls.filter(w => Math.hypot(w.x2 - w.x1, w.y2 - w.y1) > 2)
  const pts: { x: number; z: number; facing: number; hang: number }[] = []
  if (!walls.length || count <= 0) return pts
  const b = bounds(bp)
  const perWall = Math.max(1, Math.ceil(count / walls.length))
  for (const w of walls) {
    for (let i = 0; i < perWall && pts.length < count; i++) {
      const t = (i + 1) / (perWall + 1)
      const x0 = w.x1 + (w.x2 - w.x1) * t
      const z0 = w.y1 + (w.y2 - w.y1) * t
      let nx = b.cx - x0, nz = b.cy - z0
      const nl = Math.hypot(nx, nz) || 1
      nx /= nl; nz /= nl
      pts.push({ x: x0 + nx * WALL_INSET, z: z0 + nz * WALL_INSET, facing: Math.atan2(nx, nz), hang: 1.55 + (i % 3) * 0.05 })
    }
  }
  return pts
}

function makeSculptureMesh(kind: number, color: number): THREE.Group {
  const g = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: kind === 1 ? 0.65 : 0.12 })
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.35, 16), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 }))
  pedestal.position.y = 0.175; g.add(pedestal)
  if (kind === 0) {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.7, 6, 12), mat); body.position.y = 1.05; g.add(body)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), mat); head.position.y = 1.55; g.add(head)
  } else if (kind === 1) {
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 1), mat); core.position.y = 0.85; g.add(core)
  } else {
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 0.4), mat); block.position.y = 0.8; g.add(block)
  }
  return g
}

function Pad({ label, on }: { label: string; on: (v: boolean) => void }) {
  return (
    <button
      type="button"
      className="rounded-lg border border-white/15 bg-black/50 text-white text-xs font-bold h-10 w-10"
      onPointerDown={e => { e.preventDefault(); on(true) }}
      onPointerUp={() => on(false)}
      onPointerLeave={() => on(false)}
    >
      {label}
    </button>
  )
}

export default function MuseumWebGLHall({
  blueprint, frames, room = 'stone', allowBuy = true, emptyLabel = 'Aucune œuvre',
}: { blueprint: RoomBlueprint; frames: FrameItem[]; room?: Theme; allowBuy?: boolean; emptyLabel?: string }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const keys = useRef<Record<string, boolean>>({})
  const hold = useRef<Record<string, boolean>>({})
  const nearestRef = useRef<FrameItem | null>(null)
  const [ready, setReady] = useState(false)
  const [hint, setHint] = useState(true)
  const [locked, setLocked] = useState(false)
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

  const onBuy = useCallback(async (frame: FrameItem) => {
    if (!connected) { requestOpenConnect(); return }
    if (!marketLive) { setBuyMsg('Achat on-chain bientôt (SC)'); return }
    setBuyMsg(`Intent: ${frame.title}`)
  }, [connected, marketLive])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let disposed = false
    let surrealPts: THREE.Points | null = null
    const b = bounds(blueprint)
    const wallH = blueprint.wallHeight || 3.8
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(pal.fog)
    scene.fog = new THREE.FogExp2(pal.fog, room === 'cyber' ? 0.026 : 0.016)
    const camera = new THREE.PerspectiveCamera(75, 1, 0.05, 80)
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = room === 'white' ? 1.15 : room === 'dark' ? 0.85 : 1.05
    mount.appendChild(renderer.domElement)
    const canvas = renderer.domElement
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none'

    scene.add(new THREE.AmbientLight(0xfff5eb, room === 'white' ? 0.55 : 0.22))
    scene.add(new THREE.HemisphereLight(0xfff8f0, 0x1a1210, room === 'cyber' ? 0.25 : 0.42))
    const ceilLight = new THREE.PointLight(0xfff5e6, 1.1, Math.max(b.w, b.d) * 1.2, 2)
    ceilLight.position.set(b.cx, wallH - 0.4, b.cy)
    scene.add(ceilLight)
    if (room === 'cyber') {
      const neon = new THREE.PointLight(0x22d3ee, 1.6, 28)
      neon.position.set(b.cx, 3.2, b.cy)
      scene.add(neon)
    }
    try {
      addSurrealLights(scene, b.cx, b.cy, wallH, room)
      surrealPts = createSurrealParticles(scene, b.cx, b.cy, wallH, 80, 0xa78bfa)
    } catch {
      /* offline FX */
    }

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(b.w + 1, b.d + 1, 12, 12),
      new THREE.MeshStandardMaterial({ color: pal.floor, roughness: 0.88, metalness: room === 'cyber' ? 0.3 : 0.05 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.set(b.cx, 0, b.cy)
    scene.add(floor)

    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(b.w + 1, b.d + 1),
      new THREE.MeshStandardMaterial({ color: pal.ceil, roughness: 0.95, side: THREE.DoubleSide })
    )
    ceil.rotation.x = Math.PI / 2
    ceil.position.set(b.cx, wallH, b.cy)
    scene.add(ceil)

    for (const w of blueprint.walls) {
      const g = wallGeom(w)
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(g.len, g.h || wallH, 0.28),
        new THREE.MeshStandardMaterial({ color: pal.wall, roughness: 0.82 })
      )
      mesh.position.set(g.mx, (g.h || wallH) / 2, g.my)
      mesh.rotation.y = -g.angle
      scene.add(mesh)
    }

    const hangs = hangPoints(blueprint, paintings.length)
    const loader = new THREE.TextureLoader()
    let texInFlight = 0
    const texQueue: { url: string; mat: THREE.MeshStandardMaterial }[] = []
    const runTex = () => {
      while (texInFlight < TEX_CONCURRENT && texQueue.length) {
        const job = texQueue.shift()!
        texInFlight++
        loader.load(
          job.url,
          tex => {
            tex.colorSpace = THREE.SRGBColorSpace
            job.mat.map = tex
            job.mat.needsUpdate = true
            texInFlight--
            runTex()
          },
          undefined,
          () => {
            texInFlight--
            runTex()
          }
        )
      }
    }
    paintings.forEach((fr, i) => {
      const hp = hangs[i]
      if (!hp) return
      const group = new THREE.Group()
      group.position.set(hp.x, hp.hang, hp.z)
      group.rotation.y = hp.facing
      group.add(
        new THREE.Mesh(
          new THREE.BoxGeometry(1.12, 1.42, 0.08),
          new THREE.MeshStandardMaterial({ color: pal.frame, roughness: 0.55, metalness: room === 'gold' ? 0.45 : 0.18 })
        )
      )
      const mat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.65,
        emissive: pal.emissive,
        emissiveIntensity: 0.15,
      })
      const canvasPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.2), mat)
      canvasPlane.position.z = 0.05
      group.add(canvasPlane)
      scene.add(group)
      if (fr.image) {
        texQueue.push({ url: fr.image, mat })
        runTex()
      }
      ;(group as any).__frame = fr
    })

    sculptures.forEach((fr, i) => {
      const mesh = makeSculptureMesh(i % 3, pal.trim)
      mesh.position.set(b.cx + (i - 2) * 1.4, 0, b.cy + 1.2)
      scene.add(mesh)
    })

    const waypoints = visitorWaypoints(blueprint)
    waypoints.slice(0, Math.min(4, presence.virtual)).forEach((wp, i) => {
      const v = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.18, 0.55, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.55 })
      )
      v.position.set(wp.x, 0.85, wp.z)
      scene.add(v)
      ;(v as any).__bob = i
    })

    let px = b.cx, pz = b.cy, yaw = 0, pitch = 0
    camera.position.set(px, EYE, pz)
    const onKey = (e: KeyboardEvent, down: boolean) => {
      const k = e.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'shift'].includes(k)) {
        e.preventDefault()
        keys.current[k] = down
      }
      if (down && k === 'e' && nearestRef.current) setInspect(nearestRef.current)
    }
    const kd = (e: KeyboardEvent) => onKey(e, true)
    const ku = (e: KeyboardEvent) => onKey(e, false)
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)

    let pointerLocked = false
    const onMove = (e: MouseEvent) => {
      if (!pointerLocked) return
      yaw -= e.movementX * LOOK_SENS
      pitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, pitch - e.movementY * LOOK_SENS))
    }
    const onLockChange = () => {
      pointerLocked = document.pointerLockElement === canvas
      setLocked(pointerLocked)
    }
    canvas.addEventListener('click', () => {
      setHint(false)
      canvas.requestPointerLock?.()
    })
    document.addEventListener('pointerlockchange', onLockChange)
    document.addEventListener('mousemove', onMove)

    const resize = () => {
      const w = mount.clientWidth || 640
      const h = mount.clientHeight || 400
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)
    setReady(true)

    let raf = 0
    const clock = new THREE.Clock()
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (disposed) return
      const dt = Math.min(clock.getDelta(), 0.05)
      try {
        if (surrealPts) tickSurrealParticles(surrealPts, clock.elapsedTime)
      } catch {
        /* */
      }
      const sprint = keys.current.shift || hold.current['shift']
      const speed = (sprint ? SPRINT : WALK) * dt
      const f = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw))
      const r = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw))
      let mx = 0, mz = 0
      if (keys.current.w || hold.current['w']) { mx += f.x * speed; mz += f.z * speed }
      if (keys.current.s || hold.current['s']) { mx -= f.x * speed; mz -= f.z * speed }
      if (keys.current.a || hold.current['a']) { mx -= r.x * speed; mz -= r.z * speed }
      if (keys.current.d || hold.current['d']) { mx += r.x * speed; mz += r.z * speed }
      if (mx || mz) {
        const nx = px + mx, nz = pz + mz
        if (pointInBlueprintFloor(blueprint, nx, nz)) { px = nx; pz = nz }
      }
      camera.position.set(px, EYE, pz)
      camera.rotation.order = 'YXZ'
      camera.rotation.y = yaw
      camera.rotation.x = pitch
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
          {roomName} · {area} m² · {paintings.length} toiles · {sculptures.length} sculptures
        </span>
        <span className="text-[10px] text-zinc-400">
          {presence.virtual} virtuels · ~{presence.realApprox} sessions · {locked ? 'visée ON' : 'jeu'}
        </span>
      </div>
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/60"
        style={{ height: 'min(78vh, 580px)' }}
      >
        <div ref={mountRef} className="absolute inset-0" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
            Éclairage salle…
          </div>
        )}
        {hint && ready && (
          <button
            type="button"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[2px] text-center px-6"
            onClick={() => setHint(false)}
          >
            <p className="text-lg font-semibold text-white">Entrer dans la salle</p>
            <p className="text-[13px] text-zinc-400 mt-2 max-w-sm">
              Clic viser · WASD · E fiche · atmosphère surréaliste
            </p>
          </button>
        )}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
        </div>
        <div className="absolute top-2 left-2 z-10 rounded-lg px-2.5 py-1.5 text-[10px] backdrop-blur border bg-black/65 border-white/10 text-zinc-300 max-w-[80%] truncate">
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
          <button
            type="button"
            className="rounded-full border border-cyan-400/40 bg-cyan-500/25 text-cyan-50 text-xs font-semibold px-4 py-2.5"
            onClick={() => nearestRef.current && setInspect(nearestRef.current)}
          >
            Fiche
          </button>
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
