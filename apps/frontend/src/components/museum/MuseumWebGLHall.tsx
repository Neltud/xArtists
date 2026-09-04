/**
 * Salle musée WebGL — éclairage muséal, visiteurs, sculptures 3D, fiche œuvre complète.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
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
    const bust = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 14), mat); bust.scale.set(1, 1.15, 0.85); bust.position.y = 0.75; g.add(bust)
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.2, 10), mat); neck.position.y = 0.5; g.add(neck)
  } else {
    const abstract = new THREE.Mesh(new THREE.TorusKnotGeometry(0.22, 0.07, 64, 12), mat); abstract.position.y = 0.85; g.add(abstract)
  }
  return g
}

function makeVisitorMesh(hue: number): THREE.Group {
  const g = new THREE.Group()
  const col = new THREE.Color().setHSL(hue, 0.35, 0.45)
  const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.85 })
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.55, 4, 8), mat); body.position.y = 0.85; g.add(body)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), mat); head.position.y = 1.35; g.add(head)
  return g
}

function dispatchBuy(frame: FrameItem) {
  window.dispatchEvent(new CustomEvent('lia-intent', {
    detail: { lip: { raw: `acheter NFT ${frame.id} ${frame.title}`, type: 'BUY_NFT', asset_id: frame.id, paper: true, collection: frame.collection, title: frame.title } },
  }))
}

function Pad({ label, on }: { label: string; on: (v: boolean) => void }) {
  return (
    <button type="button" className="h-12 w-12 rounded-xl border border-white/20 bg-black/60 text-white text-sm font-bold active:bg-cyan-500/35 touch-manipulation select-none shadow-lg" aria-label={label}
      onPointerDown={e => { e.preventDefault(); e.stopPropagation(); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); on(true) }}
      onPointerUp={() => on(false)} onPointerCancel={() => on(false)} onPointerLeave={() => on(false)}>{label}</button>
  )
}

type ArtMesh = { mesh: THREE.Object3D; frame: FrameItem; x: number; z: number }

export default function MuseumWebGLHall({
  blueprint, frames, room = 'stone', allowBuy = true, emptyLabel = 'Aucune œuvre',
}: { blueprint: RoomBlueprint; frames: FrameItem[]; room?: Theme; allowBuy?: boolean; emptyLabel?: string }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const keys = useRef<Record<string, boolean>>({})
  const hold = useRef<Record<string, boolean>>({})
  const nearestRef = useRef<FrameItem | null>(null)
  const lockedRef = useRef(false)

  const [nearTitle, setNearTitle] = useState('Clic pour viser · WASD')
  const [inspect, setInspect] = useState<FrameItem | null>(null)
  const [buyMsg, setBuyMsg] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [locked, setLocked] = useState(false)
  const [hint, setHint] = useState(true)
  const [presence, setPresence] = useState({ virtual: 0, realApprox: 1, you: true })

  const { connected } = useWallet()
  const marketLive = canListBuyNft()
  const list = useMemo(() => frames.slice(0, MAX_ART), [frames])
  const paintings = useMemo(() => list.filter(f => f.kind !== 'sculpture'), [list])
  const sculptures = useMemo(() => list.filter(f => f.kind === 'sculpture'), [list])
  const pal = PALETTE[room] || PALETTE.stone
  const area = useMemo(() => Math.round(blueprintAreaM2(blueprint)), [blueprint])
  const roomName = blueprint.rooms?.[0]?.name || blueprint.name
  const museumKey = blueprint.id || roomName

  const onBuy = useCallback(() => {
    if (!allowBuy) return
    const f = inspect || nearestRef.current
    if (!f) return
    if (!connected) { requestOpenConnect(); setBuyMsg('Connectez votre wallet.'); return }
    dispatchBuy(f)
    setBuyMsg(marketLive ? 'Intention d’achat — signature wallet.' : 'Intention paper — marché pas encore live.')
  }, [allowBuy, inspect, connected, marketLive])

  useEffect(() => { setPresence(presenceSnapshot(museumKey)) }, [museumKey])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || !list.length) return
    let disposed = false
    const b = bounds(blueprint)
    const wallH = blueprint.wallHeight || 4
    const palLocal = pal

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(palLocal.fog)
    scene.fog = new THREE.FogExp2(palLocal.fog, room === 'cyber' ? 0.03 : 0.022)

    const camera = new THREE.PerspectiveCamera(75, 1, 0.05, 120)
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = room === 'white' ? 1.15 : room === 'dark' ? 0.85 : 1.0
    mount.appendChild(renderer.domElement)
    const canvas = renderer.domElement
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;cursor:crosshair'

    scene.add(new THREE.AmbientLight(0xfff5eb, room === 'white' ? 0.55 : 0.22))
    scene.add(new THREE.HemisphereLight(0xfff8f0, 0x1a1210, room === 'cyber' ? 0.25 : 0.42))
    const key = new THREE.DirectionalLight(0xfff0dd, 0.55); key.position.set(b.cx + 5, wallH + 3, b.cy + 4); scene.add(key)
    const fill = new THREE.DirectionalLight(0xb0c4de, 0.2); fill.position.set(b.cx - 4, wallH * 0.6, b.cy - 3); scene.add(fill)
    const ceilLight = new THREE.PointLight(0xfff5e6, 1.1, Math.max(b.w, b.d) * 1.2, 2); ceilLight.position.set(b.cx, wallH - 0.4, b.cy); scene.add(ceilLight)
    if (room === 'cyber') { const neon = new THREE.PointLight(0x22d3ee, 1.6, 28); neon.position.set(b.cx, 3.2, b.cy); scene.add(neon) }

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(b.w + 1, b.d + 1, 12, 12), new THREE.MeshStandardMaterial({ color: palLocal.floor, roughness: 0.88, metalness: room === 'cyber' ? 0.3 : 0.05 }))
    floor.rotation.x = -Math.PI / 2; floor.position.set(b.cx, 0, b.cy); scene.add(floor)
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(b.w + 1, b.d + 1), new THREE.MeshStandardMaterial({ color: palLocal.ceil, roughness: 1, side: THREE.DoubleSide }))
    ceil.rotation.x = Math.PI / 2; ceil.position.set(b.cx, wallH, b.cy); scene.add(ceil)
    const wallMat = new THREE.MeshStandardMaterial({ color: palLocal.wall, roughness: 0.86, metalness: 0.04 })
    const thick = blueprint.wallThickness || 0.28
    for (const w of blueprint.walls.slice(0, 16)) {
      const g = wallGeom(w)
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(g.len, g.h, thick), wallMat)
      mesh.position.set(g.mx, g.h / 2, g.my); mesh.rotation.y = -g.angle; scene.add(mesh)
      const base = new THREE.Mesh(new THREE.BoxGeometry(g.len, 0.12, thick + 0.04), new THREE.MeshStandardMaterial({ color: palLocal.trim, roughness: 0.7 }))
      base.position.set(g.mx, 0.06, g.my); base.rotation.y = -g.angle; scene.add(base)
    }

    const hangs = hangPoints(blueprint, paintings.length)
    const arts: ArtMesh[] = []
    const loader = new THREE.TextureLoader(); loader.crossOrigin = 'anonymous'
    let texActive = 0
    const texQueue: { url: string; mat: THREE.MeshStandardMaterial }[] = []
    const pumpTex = () => {
      while (texActive < TEX_CONCURRENT && texQueue.length) {
        const job = texQueue.shift()!
        texActive++
        loader.load(job.url, tex => {
          if (disposed) { tex.dispose(); texActive--; return }
          tex.colorSpace = THREE.SRGBColorSpace
          tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
          job.mat.map = tex; job.mat.color.set(0xffffff); job.mat.emissiveIntensity = 0.04; job.mat.needsUpdate = true
          texActive--; pumpTex()
        }, undefined, () => { texActive--; pumpTex() })
      }
    }

    paintings.forEach((f, i) => {
      const h = hangs[i] || { x: b.minX + ((i + 1) / (paintings.length + 1)) * b.w, z: b.minY + 0.35, facing: Math.PI / 2, hang: 1.55 }
      const group = new THREE.Group()
      group.position.set(h.x, h.hang, h.z); group.rotation.y = h.facing
      group.add(new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.42, 0.08), new THREE.MeshStandardMaterial({ color: palLocal.frame, roughness: 0.55, metalness: room === 'gold' ? 0.45 : 0.18 })))
      const artMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.65, emissive: palLocal.emissive, emissiveIntensity: 0.1 })
      const canvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.16), artMat)
      canvasMesh.position.z = 0.055; group.add(canvasMesh)
      if (f.image && /^https?:\/\//i.test(f.image)) texQueue.push({ url: f.image, mat: artMat })
      const spot = new THREE.SpotLight(0xfff5e8, 2.8, 7, Math.PI / 8, 0.45, 1.2)
      spot.position.set(0, 1.15, 1.35); spot.target = canvasMesh; group.add(spot); group.add(spot.target)
      scene.add(group)
      arts.push({ mesh: group, frame: f, x: h.x, z: h.z })
    })
    pumpTex()

    sculptures.forEach((f, i) => {
      const t = (i + 1) / (sculptures.length + 1)
      const x = b.minX + b.w * (0.25 + 0.5 * t)
      const z = b.cy + (i % 2 === 0 ? -b.d * 0.15 : b.d * 0.12)
      const mesh = makeSculptureMesh(i % 3, room === 'gold' ? 0xc9a227 : room === 'cyber' ? 0x22d3ee : 0xc4b8a8)
      mesh.position.set(x, 0, z); scene.add(mesh)
      arts.push({ mesh, frame: f, x, z })
      const pl = new THREE.PointLight(0xffe8d0, 0.55, 5); pl.position.set(x, 2.2, z); scene.add(pl)
    })

    const pres = presenceSnapshot(museumKey)
    const npcN = Math.min(pres.virtual, 8)
    const wps = visitorWaypoints(b.minX + 1, b.minY + 1, b.maxX - 1, b.maxY - 1, Math.max(npcN, 3))
    const npcs: { root: THREE.Group; i: number; speed: number; phase: number }[] = []
    for (let i = 0; i < npcN; i++) {
      const root = makeVisitorMesh((i * 0.13) % 1)
      root.position.set(wps[i % wps.length].x, 0, wps[i % wps.length].z)
      scene.add(root)
      npcs.push({ root, i, speed: 0.35 + (i % 3) * 0.12, phase: i * 1.7 })
    }

    let px = b.cx, pz = b.cy, yaw = 0, pitch = 0
    const door = blueprint.openings?.find(o => o.type === 'door')
    if (door) {
      const wall = blueprint.walls.find(w => w.id === door.wallId)
      if (wall) {
        const g = wallGeom(wall)
        const t = (door.offset + door.width / 2) / Math.max(g.len, 0.01)
        const ix = b.cx - (wall.x1 + (wall.x2 - wall.x1) * t)
        const iz = b.cy - (wall.y1 + (wall.y2 - wall.y1) * t)
        const il = Math.hypot(ix, iz) || 1
        px = wall.x1 + (wall.x2 - wall.x1) * t + (ix / il) * 1.8
        pz = wall.y1 + (wall.y2 - wall.y1) * t + (iz / il) * 1.8
        yaw = Math.atan2(ix / il, iz / il)
      }
    }
    camera.position.set(px, EYE, pz)

    const resize = () => {
      if (!mount) return
      const w = mount.clientWidth || 640, h = mount.clientHeight || 400
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false)
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(mount)

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e','escape','shift'].includes(k)) { e.preventDefault(); keys.current[k] = true }
      if (k === 'escape') { setInspect(null); if (document.pointerLockElement === canvas) document.exitPointerLock() }
      if (k === 'e' && nearestRef.current) setInspect(nearestRef.current)
    }
    const onKeyUp = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false }
    const onPointerLockChange = () => { lockedRef.current = document.pointerLockElement === canvas; setLocked(lockedRef.current); if (lockedRef.current) setHint(false) }
    const onMouseMove = (e: MouseEvent) => {
      if (!lockedRef.current) return
      yaw -= e.movementX * LOOK_SENS; pitch -= e.movementY * LOOK_SENS
      pitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, pitch))
    }
    let touchId: number | null = null, lastTx = 0, lastTy = 0
    const onTouchStart = (e: TouchEvent) => { if (e.touches.length === 1) { touchId = e.touches[0].identifier; lastTx = e.touches[0].clientX; lastTy = e.touches[0].clientY; setHint(false) } }
    const onTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i]
        if (t.identifier === touchId) {
          yaw -= (t.clientX - lastTx) * LOOK_SENS * 1.4; pitch -= (t.clientY - lastTy) * LOOK_SENS * 1.4
          pitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, pitch)); lastTx = t.clientX; lastTy = t.clientY; e.preventDefault()
        }
      }
    }
    const requestLock = () => { canvas.requestPointerLock?.(); setHint(false) }
    canvas.addEventListener('click', requestLock)
    document.addEventListener('pointerlockchange', onPointerLockChange)
    document.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', () => { touchId = null })
    window.addEventListener('keydown', onKeyDown, { passive: false })
    window.addEventListener('keyup', onKeyUp)

    let raf = 0, lastHud = 0
    const clock = new THREE.Clock()
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (disposed || document.hidden) return
      const dt = Math.min(clock.getDelta(), 0.05)
      const k = { ...keys.current, ...hold.current }
      if (!lockedRef.current) {
        if (k['arrowleft']) yaw += 1.9 * dt
        if (k['arrowright']) yaw -= 1.9 * dt
      }
      const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw))
      const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw))
      const speed = (k['shift'] ? SPRINT : WALK) * dt
      let mx = 0, mz = 0
      if (k['w'] || k['arrowup']) { mx += forward.x * speed; mz += forward.z * speed }
      if (k['s'] || k['arrowdown']) { mx -= forward.x * speed; mz -= forward.z * speed }
      if (k['a']) { mx -= right.x * speed; mz -= right.z * speed }
      if (k['d']) { mx += right.x * speed; mz += right.z * speed }
      if (mx || mz) {
        const nx = px + mx, nz = pz + mz
        if (pointInBlueprintFloor(blueprint, nx, nz)) { px = nx; pz = nz }
        else if (pointInBlueprintFloor(blueprint, nx, pz)) px = nx
        else if (pointInBlueprintFloor(blueprint, px, nz)) pz = nz
      }
      const bob = mx || mz ? Math.sin(performance.now() * 0.012) * 0.025 : 0
      camera.position.set(px, EYE + bob, pz)
      camera.rotation.order = 'YXZ'; camera.rotation.y = yaw; camera.rotation.x = pitch

      const t = performance.now() * 0.001
      for (const n of npcs) {
        const a = wps[n.i % wps.length], c = wps[(n.i + 1) % wps.length]
        const u = (Math.sin(t * n.speed + n.phase) + 1) / 2
        n.root.position.x = a.x + (c.x - a.x) * u
        n.root.position.z = a.z + (c.z - a.z) * u
        n.root.rotation.y = Math.atan2(c.x - a.x, c.z - a.z)
      }

      const now = performance.now()
      if (now - lastHud > 100) {
        lastHud = now
        let best: FrameItem | null = null, bestD = 2.5
        for (const a of arts) {
          const d = Math.hypot(a.x - px, a.z - pz)
          if (d < bestD) { bestD = d; best = a.frame }
        }
        nearestRef.current = best
        setNearTitle(best ? `${best.title} · E fiche` : lockedRef.current ? 'WASD · Shift · E' : 'Clic viser · WASD')
      }
      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(loop)
    setReady(true)

    return () => {
      disposed = true; cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('pointerlockchange', onPointerLockChange); document.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('click', requestLock)
      if (document.pointerLockElement === canvas) document.exitPointerLock()
      ro.disconnect()
      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose()
          const m = obj.material as THREE.MeshStandardMaterial
          if (m?.map) m.map.dispose(); m?.dispose?.()
        }
      })
      renderer.dispose()
      if (canvas.parentNode === mount) mount.removeChild(canvas)
    }
  }, [blueprint, list, paintings, sculptures, pal, room, museumKey])

  if (!list.length) {
    return <div className="rounded-2xl border border-white/10 bg-zinc-950 min-h-[280px] flex items-center justify-center text-sm text-zinc-500">{emptyLabel}</div>
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
        <span>{roomName} · {area} m² · {paintings.length} toiles · {sculptures.length} sculptures</span>
        <span className="text-[10px] text-zinc-400">{presence.virtual} virtuels · ~{presence.realApprox} sessions · {locked ? 'visée ON' : 'jeu'}</span>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/60" style={{ height: 'min(78vh, 580px)' }}>
        <div ref={mountRef} className="absolute inset-0" />
        {!ready && <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">Éclairage salle…</div>}
        {hint && ready && (
          <button type="button" className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[2px] text-center px-6" onClick={() => setHint(false)}>
            <p className="text-lg font-semibold text-white">Entrer dans la salle</p>
            <p className="text-[13px] text-zinc-400 mt-2 max-w-sm">Clic viser · WASD · E fiche (titre, artiste, prix…) · sculptures au sol</p>
          </button>
        )}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10"><div className="w-1.5 h-1.5 rounded-full bg-white/50" /></div>
        <div className="absolute top-2 left-2 z-10 rounded-lg px-2.5 py-1.5 text-[10px] backdrop-blur border bg-black/65 border-white/10 text-zinc-300 max-w-[80%] truncate">{nearTitle}</div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 z-20">
          <div className="grid grid-cols-3 gap-1.5 w-[8.25rem]">
            <span /><Pad label="↑" on={v => (hold.current['w'] = v)} /><span />
            <Pad label="←" on={v => (hold.current['a'] = v)} /><Pad label="↓" on={v => (hold.current['s'] = v)} /><Pad label="→" on={v => (hold.current['d'] = v)} />
          </div>
          <button type="button" className="rounded-full border border-cyan-400/40 bg-cyan-500/25 text-cyan-50 text-xs font-semibold px-4 py-2.5" onClick={() => nearestRef.current && setInspect(nearestRef.current)}>Fiche</button>
        </div>
      </div>
      {buyMsg && <p className="text-[11px] text-zinc-400 border border-white/10 rounded-lg px-2.5 py-1.5">{buyMsg}</p>}
      {inspect && (
        <ArtworkDossier frame={inspect} allowBuy={allowBuy} marketLive={marketLive} onBuy={onBuy} onClose={() => setInspect(null)} />
      )}
    </div>
  )
}
