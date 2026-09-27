/**
 * Musée WebGL — 3e personne · textures (pas de double-proxy) · Acheter paper.
 * Sculptures : photo → volume 3D (placeSculpturesInScene).
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { createSurrealParticles, tickSurrealParticles, addSurrealLights } from '../../lib/museumSurrealFX'
import { createPlayerAvatar, tickAvatarWalk } from '../../lib/museumAvatar'
import { ArtworkDossier, type FrameItem } from './MuseumCorridor'
import { placeSculpturesInScene } from '../../lib/placeSculptures'
import type { RoomBlueprint, WallSeg } from '../../lib/roomBlueprint'
import { blueprintAreaM2 } from '../../lib/roomBlueprint'
import { pointInBlueprintFloor } from '../../lib/loadBlueprint'
import { canListBuyNft } from '../../config/scStatus'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'
import { presenceSnapshot, visitorWaypoints } from '../../lib/museumVisitors'
import { pulseFromIndex, fetchPulseState, mapPulseToMuseum, type MuseumPulseParams } from '../../lib/pulseMuseum'
import { PULSE_DEMO_CYCLE } from '../../lib/pulseDemo'

const EYE = 1.65
const WALK = 3.6
const SPRINT = 6.4
const MAX_ART = 24
const PITCH_MAX = 1.15
const ACCEL = 22
const FRICTION = 11
const CAM_DIST = 4.2
const CAM_HEIGHT = 2.35

type Theme = 'cyber' | 'stone' | 'gold' | 'white' | 'dark'

const PALETTE: Record<
  Theme,
  { wall: number; floor: number; ceil: number; fog: number; frame: number; emissive: number; trim: number }
> = {
  cyber: { wall: 0x1e2440, floor: 0x0c1020, ceil: 0x141a30, fog: 0x0a0e1c, frame: 0x334155, emissive: 0x22d3ee, trim: 0x67e8f9 },
  stone: { wall: 0x4a4038, floor: 0x242018, ceil: 0x3a3228, fog: 0x1a1610, frame: 0x6b5a48, emissive: 0x3d2e18, trim: 0xc4a574 },
  gold: { wall: 0x4a3c20, floor: 0x221c10, ceil: 0x3a2e18, fog: 0x18140c, frame: 0x7a6530, emissive: 0x4a3810, trim: 0xe0b84a },
  white: { wall: 0xf0ebe3, floor: 0xd4cdc2, ceil: 0xfaf7f2, fog: 0xc8c0b4, frame: 0xe0d8cc, emissive: 0xa09888, trim: 0xb0a898 },
  dark: { wall: 0x242018, floor: 0x12100c, ceil: 0x1a1814, fog: 0x0c0a08, frame: 0x3a3228, emissive: 0x1c1810, trim: 0x5a544c },
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
  const [ready, setReady] = useState(false)
  const [hint, setHint] = useState(true)
  const [locked, setLocked] = useState(false)
  const [nearTitle, setNearTitle] = useState('')
  const [inspect, setInspect] = useState<FrameItem | null>(null)
  const [pulseLabel, setPulseLabel] = useState('Pulse…')
  const [pulseAccent, setPulseAccent] = useState('#a78bfa')
  const { connected } = useWallet()
  const marketLive = canListBuyNft()
  const pal = PALETTE[room] || PALETTE.stone
  const roomName = blueprint.rooms?.[0]?.name || blueprint.name
  const area = Math.round(blueprintAreaM2(blueprint))
  const paintings = useMemo(
    () => frames.filter(f => !!f.image && f.kind !== 'sculpture').slice(0, MAX_ART),
    [frames],
  )
  const sculptures = useMemo(
    () => frames.filter(f => f.kind === 'sculpture').slice(0, 8),
    [frames],
  )
  const presence = useMemo(() => presenceSnapshot(blueprint.id || roomName), [blueprint.id, roomName])

  const onBuy = useCallback(
    async (frame: FrameItem) => {
      if (!connected) {
        requestOpenConnect()
        return
      }
      const raw = `acheter NFT ${frame.id} ${frame.title}`
      window.dispatchEvent(
        new CustomEvent('lia-intent', {
          detail: {
            lip: {
              raw,
              type: 'BUY_NFT',
              asset_id: frame.id,
              paper: !marketLive,
              collection: frame.collection,
              title: frame.title,
            },
          },
        }),
      )
    },
    [connected, marketLive],
  )

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let disposed = false
    let vx = 0
    let vz = 0
    let walkPhase = 0
    let surrealPts: THREE.Points | null = null
    let lastNearTitle = ''
    const b = bounds(blueprint)
    const wallH = blueprint.wallHeight || 3.8
    const scene = new THREE.Scene()
    let pulseIdx = 0
    let pulseParams: MuseumPulseParams = pulseFromIndex(0, room)
    scene.background = new THREE.Color(pal.fog)
    scene.fog = new THREE.FogExp2(pal.fog, pulseParams.fogDensity)
    setPulseLabel(pulseParams.label)
    setPulseAccent(pulseParams.accentHex)
    const camera = new THREE.PerspectiveCamera(60, 1, 0.08, 90)
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = pulseParams.exposure
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

    const ambientLight = new THREE.AmbientLight(0xffffff, pulseParams.ambient)
    scene.add(ambientLight)
    const key = new THREE.DirectionalLight(0xfff5e6, 1.15)
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
    const artAnchors: { pos: THREE.Vector3; frame: FrameItem }[] = []
    const wallList = blueprint.walls.filter(w => Math.hypot(w.x2 - w.x1, w.y2 - w.y1) > 1.2)

    function corsSafeUrls(raw: string): string[] {
      const u = (raw || '').trim()
      if (!u) return []
      const out: string[] = []
      try {
        if (/images\.weserv\.nl|wsrv\.nl/i.test(u)) {
          out.push(u)
          return out
        }
        if (/media\.multiversx\.com|ipfs|nftstorage|gateway/i.test(u)) out.push(u)
        const bare = u.replace(/^https?:\/\//i, '')
        out.push(`https://images.weserv.nl/?url=${encodeURIComponent(bare)}&w=720&h=900&fit=cover&output=jpg&q=82`)
        out.push(`https://wsrv.nl/?url=${encodeURIComponent(bare)}&w=720&h=900&fit=cover&output=jpg&q=82`)
        if (!out.includes(u)) out.push(u)
      } catch {
        out.push(u)
      }
      return out
    }

    function canvasFallbackTex(title: string, sub?: string): THREE.Texture {
      const c = document.createElement('canvas')
      c.width = 512
      c.height = 640
      const ctx = c.getContext('2d')!
      const g = ctx.createLinearGradient(0, 0, 0, 640)
      g.addColorStop(0, '#5a4e42')
      g.addColorStop(1, '#2a241c')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 512, 640)
      ctx.strokeStyle = 'rgba(232,196,96,0.7)'
      ctx.lineWidth = 10
      ctx.strokeRect(20, 20, 472, 600)
      ctx.fillStyle = '#f8f0e4'
      ctx.font = 'bold 26px system-ui,sans-serif'
      const t = (title || 'Œuvre').slice(0, 42)
      let y = 260
      for (let i = 0; i < t.length; i += 16) {
        ctx.fillText(t.slice(i, i + 16), 48, y)
        y += 34
      }
      if (sub) {
        ctx.fillStyle = '#c8b8a4'
        ctx.font = '18px system-ui,sans-serif'
        ctx.fillText(sub.slice(0, 30), 48, y + 20)
      }
      const tex = new THREE.CanvasTexture(c)
      tex.colorSpace = THREE.SRGBColorSpace
      return tex
    }

    function placeArtTexture(tex: THREE.Texture, apx: number, apz: number, nx: number, nz: number, angle: number) {
      if (disposed) return
      tex.colorSpace = THREE.SRGBColorSpace
      tex.minFilter = THREE.LinearFilter
      tex.magFilter = THREE.LinearFilter
      const art = new THREE.Mesh(
        new THREE.PlaneGeometry(0.95, 1.15),
        new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }),
      )
      art.position.set(apx + nx * 0.05, 1.55, apz + nz * 0.05)
      art.rotation.y = -angle
      scene.add(art)
    }

    function loadArtOnWall(
      urls: string[],
      apx: number,
      apz: number,
      nx: number,
      nz: number,
      angle: number,
      title?: string,
      sub?: string,
    ) {
      const finish = (tex: THREE.Texture) => placeArtTexture(tex, apx, apz, nx, nz, angle)
      const tryAt = (idx: number) => {
        if (disposed) return
        if (idx >= urls.length) {
          finish(canvasFallbackTex(title || 'Œuvre', sub))
          return
        }
        loader.load(urls[idx], tex => finish(tex), undefined, () => tryAt(idx + 1))
      }
      if (!urls.length) {
        finish(canvasFallbackTex(title || 'Œuvre', sub))
        return
      }
      tryAt(0)
    }

    const nWalls = Math.max(1, wallList.length)
    paintings.forEach((frame, i) => {
      const w = wallList[i % nWalls]
      if (!w) return
      const g = wallGeom(w)
      const onThis = Math.floor(i / nWalls)
      const totalOn = Math.ceil(paintings.length / nWalls)
      const t = 0.15 + ((onThis + 0.5) / Math.max(1, totalOn)) * 0.7
      const ax = w.x1 + (w.x2 - w.x1) * t
      const az = w.y1 + (w.y2 - w.y1) * t
      const nx = -Math.sin(g.angle)
      const nz = Math.cos(g.angle)
      const apx = ax + nx * 0.14
      const apz = az + nz * 0.14
      const frameMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.12, 1.35, 0.07),
        new THREE.MeshStandardMaterial({
          color: pal.frame,
          roughness: 0.5,
          metalness: 0.2,
          emissive: pal.emissive,
          emissiveIntensity: 0.22,
        }),
      )
      frameMesh.position.set(apx, 1.55, apz)
      frameMesh.rotation.y = -g.angle
      scene.add(frameMesh)
      artAnchors.push({ pos: new THREE.Vector3(apx, 1.55, apz), frame })
      loadArtOnWall(
        corsSafeUrls(frame.image || ''),
        apx,
        apz,
        nx,
        nz,
        g.angle,
        frame.title,
        frame.artist || frame.subtitle,
      )
    })

    placeSculpturesInScene({
      sculptures,
      scene,
      loader,
      corsSafeUrls,
      loadArtOnWall,
      artAnchors,
      cx: b.cx,
      cy: b.cy,
      pedestalColor: pal.trim,
      emissive: pal.emissive,
      pointInFloor: (x, z) => pointInBlueprintFloor(blueprint, x, z),
      disposed: () => disposed,
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

    let dragging = false
    let moved = false
    let lastX = 0
    let lastY = 0
    let downX = 0
    let downY = 0
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return
      dragging = true
      moved = false
      lastX = e.clientX
      lastY = e.clientY
      downX = e.clientX
      downY = e.clientY
      canvas.setPointerCapture?.(e.pointerId)
      setLocked(true)
    }
    const onUp = (e: PointerEvent) => {
      const wasDrag = moved || Math.hypot(e.clientX - downX, e.clientY - downY) > 10
      dragging = false
      setLocked(false)
      try {
        canvas.releasePointerCapture?.(e.pointerId)
      } catch {
        /* */
      }
      if (!wasDrag) {
        const target = nearestRef.current
        const anchor = artAnchors.find(a => a.frame === target)
        if (anchor) {
          const dx = anchor.pos.x - px
          const dz = anchor.pos.z - pz
          const dist = Math.hypot(dx, dz) || 1
          if (dist < 5.5) {
            const stop = 1.5
            if (dist > stop) {
              const ratio = Math.min(0.5, (dist - stop) / dist)
              const nx2 = px + dx * ratio
              const nz2 = pz + dz * ratio
              if (pointInBlueprintFloor(blueprint, nx2, nz2)) {
                px = nx2
                pz = nz2
                avatar.position.set(px, 0, pz)
              }
            }
            facing = Math.atan2(dx, dz)
            avatar.rotation.y = facing
            yaw = facing + Math.PI
          }
          setInspect(anchor.frame)
        }
      }
      moved = false
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 8) moved = true
      lastX = e.clientX
      lastY = e.clientY
      yaw -= dx * 0.005
      pitch = Math.max(-0.05, Math.min(PITCH_MAX, pitch - dy * 0.004))
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('pointermove', onMove)

    setReady(true)
    void fetchPulseState().then(env => {
      if (disposed || !env) return
      pulseParams = mapPulseToMuseum(env, room)
      if (scene.fog instanceof THREE.FogExp2) scene.fog.density = pulseParams.fogDensity
      renderer.toneMappingExposure = pulseParams.exposure
      ambientLight.intensity = pulseParams.ambient
      setPulseLabel(pulseParams.label)
      setPulseAccent(pulseParams.accentHex)
    })
    const clock = new THREE.Clock()
    let raf = 0
    const loop = () => {
      if (disposed) return
      raf = requestAnimationFrame(loop)
      const dt = Math.min(clock.getDelta(), 0.05)
      try {
        if (surrealPts) tickSurrealParticles(surrealPts, clock.elapsedTime * (pulseParams.particleSpeed || 1))
      } catch {
        /* */
      }
      const nextIdx = Math.floor(clock.elapsedTime / 8) % PULSE_DEMO_CYCLE.length
      if (nextIdx !== pulseIdx) {
        pulseIdx = nextIdx
        pulseParams = pulseFromIndex(pulseIdx, room)
        if (scene.fog && scene.fog instanceof THREE.FogExp2) scene.fog.density = pulseParams.fogDensity
        renderer.toneMappingExposure = pulseParams.exposure
        ambientLight.intensity = pulseParams.ambient
        setPulseLabel(pulseParams.label)
        setPulseAccent(pulseParams.accentHex)
      }
      const sprint = !!(keys.current.shift || hold.current.sprint)
      const speed = sprint ? SPRINT : WALK
      let ix = 0
      let iz = 0
      if (keys.current.w || hold.current.up) iz -= 1
      if (keys.current.s || hold.current.down) iz += 1
      if (keys.current.a || hold.current.left) ix -= 1
      if (keys.current.d || hold.current.right) ix += 1
      const len = Math.hypot(ix, iz) || 1
      ix /= len
      iz /= len
      const cos = Math.cos(yaw)
      const sin = Math.sin(yaw)
      const wishX = ix * cos - iz * sin
      const wishZ = ix * sin + iz * cos
      const targetVx = wishX * speed
      const targetVz = wishZ * speed
      const moving = Math.hypot(ix, iz) > 0.01
      if (moving) {
        vx += (targetVx - vx) * Math.min(1, ACCEL * dt)
        vz += (targetVz - vz) * Math.min(1, ACCEL * dt)
        facing = Math.atan2(wishX, wishZ)
      } else {
        vx *= Math.max(0, 1 - FRICTION * dt)
        vz *= Math.max(0, 1 - FRICTION * dt)
      }
      const nx = px + vx * dt
      const nz = pz + vz * dt
      if (pointInBlueprintFloor(blueprint, nx, pz)) px = nx
      else vx = 0
      if (pointInBlueprintFloor(blueprint, px, nz)) pz = nz
      else vz = 0
      avatar.position.set(px, 0, pz)
      avatar.rotation.y = facing
      walkPhase = tickAvatarWalk(avatar, walkPhase, Math.hypot(vx, vz), dt)
      let nearest: FrameItem | null = null
      let best = 4.2
      for (const a of artAnchors) {
        const d = Math.hypot(a.pos.x - px, a.pos.z - pz)
        if (d < best) {
          best = d
          nearest = a.frame
        }
      }
      nearestRef.current = nearest
      if (nearest && nearest.title !== lastNearTitle) {
        lastNearTitle = nearest.title
        setNearTitle(nearest.title)
      } else if (!nearest && lastNearTitle) {
        lastNearTitle = ''
        setNearTitle('')
      }
      const camDist = CAM_DIST
      const camY = CAM_HEIGHT + Math.sin(pitch) * 0.8
      camera.position.set(
        px - Math.sin(yaw) * camDist * Math.cos(pitch),
        camY,
        pz - Math.cos(yaw) * camDist * Math.cos(pitch),
      )
      camera.lookAt(px, EYE * 0.9, pz)
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
      if (mount.contains(canvas)) mount.removeChild(canvas)
    }
  }, [blueprint, paintings, sculptures, room, pal, presence.virtual, roomName])

  return (
    <div className="relative w-full h-[min(72vh,640px)] rounded-2xl overflow-hidden border border-white/10 bg-black">
      <div ref={mountRef} className="absolute inset-0" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
          {emptyLabel}
        </div>
      )}
      <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-2 items-center pointer-events-none">
        <span className="text-[10px] uppercase tracking-wider text-white/70 bg-black/50 px-2 py-1 rounded-lg">
          {roomName} · {area} m²
        </span>
        <span
          className="text-[10px] px-2 py-1 rounded-lg bg-black/50"
          style={{ color: pulseAccent }}
        >
          {pulseLabel}
        </span>
        {nearTitle && (
          <span className="text-[11px] text-cyan-100/90 bg-black/55 px-2 py-1 rounded-lg">
            E · {nearTitle}
          </span>
        )}
      </div>
      {hint && (
        <button
          type="button"
          className="absolute bottom-24 left-1/2 -translate-x-1/2 text-[11px] text-zinc-400 bg-black/60 px-3 py-1.5 rounded-full"
          onClick={() => setHint(false)}
        >
          WASD · souris · E fiche · clic œuvre
        </button>
      )}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 md:hidden">
        <div className="flex gap-1.5 justify-center">
          <Pad label="↑" on={v => (hold.current.up = v)} />
        </div>
        <div className="flex gap-1.5">
          <Pad label="←" on={v => (hold.current.left = v)} />
          <Pad label="↓" on={v => (hold.current.down = v)} />
          <Pad label="→" on={v => (hold.current.right = v)} />
        </div>
        <Pad label="⌁" on={v => (hold.current.sprint = v)} />
      </div>
      {locked && <div className="absolute inset-0 pointer-events-none ring-1 ring-cyan-500/20" />}
      {inspect && (
        <ArtworkDossier
          frame={inspect}
          allowBuy={allowBuy}
          marketLive={marketLive}
          onBuy={() => onBuy(inspect)}
          onClose={() => setInspect(null)}
        />
      )}
    </div>
  )
}
