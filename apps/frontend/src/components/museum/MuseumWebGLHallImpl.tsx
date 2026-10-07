/**
 * Musée WebGL — restored stable Impl.
 * Green available slots + slow approach on artwork select.
 * Full experience continues via MuseumWebGLHall (this default export).
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import {
  createPlayerAvatar,
  tickAvatarWalk,
  loadAvatarSkin,
  saveAvatarSkin,
  AVATAR_SKINS,
  type AvatarSkinId,
} from '../../lib/museumAvatar'
import { ArtworkDossier, type FrameItem } from './MuseumCorridor'
import type { RoomBlueprint, WallSeg } from '../../lib/roomBlueprint'
import { blueprintAreaM2 } from '../../lib/roomBlueprint'
import { pointInBlueprintFloor } from '../../lib/loadBlueprint'
import { canListBuyNft } from '../../config/scStatus'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'
import {
  trySlideMove,
  integrateWishVelocity,
  clampCameraDistance,
  makeWalkableChecker,
} from '../../lib/spatialEngine'
import { MUSEUM_FPS, applyNavKey, isNavKey } from '../../lib/museumFpsController'
import { isMusicEnabled, setMusicEnabled } from '../../config/nelsonAudio'
import NavReticle from './NavReticle'

const EYE = 1.65
const WALK = MUSEUM_FPS.walkSpeed
const SPRINT = MUSEUM_FPS.sprintSpeed
const MAX_ART = 24
const PITCH_MAX = MUSEUM_FPS.pitchMax
const CAM_DIST = MUSEUM_FPS.camMaxDist
const CAM_HEIGHT = 2.2

type Theme = 'cyber' | 'stone' | 'gold' | 'white' | 'dark'
const PALETTE: Record<
  Theme,
  { wall: number; floor: number; ceil: number; fog: number; frame: number; emissive: number }
> = {
  cyber: { wall: 0x1e2440, floor: 0x0c1020, ceil: 0x141a30, fog: 0x0a0e1c, frame: 0x334155, emissive: 0x22d3ee },
  stone: { wall: 0x4a4038, floor: 0x242018, ceil: 0x3a3228, fog: 0x1a1610, frame: 0x6b5a48, emissive: 0xc4a574 },
  gold: { wall: 0x4a3c20, floor: 0x221c10, ceil: 0x3a2e18, fog: 0x18140c, frame: 0x7a6530, emissive: 0xe0b84a },
  white: { wall: 0xf0ebe3, floor: 0xd4cdc2, ceil: 0xfaf7f2, fog: 0xc8c0b4, frame: 0xe0d8cc, emissive: 0xa09888 },
  dark: { wall: 0x242018, floor: 0x12100c, ceil: 0x1a1814, fog: 0x0c0a08, frame: 0x3a3228, emissive: 0x5a544c },
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

export default function MuseumWebGLHallImpl({
  blueprint,
  frames,
  room = 'stone',
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
  const approachRef = useRef<THREE.Vector3 | null>(null)
  const [ready, setReady] = useState(false)
  const [nearTitle, setNearTitle] = useState('')
  const [avatarSkin, setAvatarSkin] = useState<AvatarSkinId>(() => loadAvatarSkin())
  const [inspect, setInspect] = useState<FrameItem | null>(null)
  const { connected } = useWallet()
  const marketLive = canListBuyNft()
  const pal = PALETTE[room] || PALETTE.stone
  const roomName = blueprint.rooms?.[0]?.name || blueprint.name
  const area = Math.round(blueprintAreaM2(blueprint))
  const paintings = useMemo(
    () => frames.filter(f => !!f.image && f.kind !== 'sculpture').slice(0, MAX_ART),
    [frames],
  )

  const onBuy = useCallback(
    async (frame: FrameItem) => {
      if (!connected) {
        requestOpenConnect()
        return
      }
      window.dispatchEvent(
        new CustomEvent('lia-intent', {
          detail: {
            lip: {
              raw: `acheter NFT ${frame.id}`,
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
    let lastNearTitle = ''
    const b = bounds(blueprint)
    const wallH = blueprint.wallHeight || 3.8
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(pal.fog)
    scene.fog = new THREE.FogExp2(pal.fog, 0.028)
    const camera = new THREE.PerspectiveCamera(68, 1, 0.08, 90)
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    mount.appendChild(renderer.domElement)
    const canvas = renderer.domElement
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none'

    const floorMat = new THREE.MeshStandardMaterial({ color: pal.floor, roughness: 0.85, metalness: 0.06 })
    const wallMat = new THREE.MeshStandardMaterial({ color: pal.wall, roughness: 0.9, metalness: 0.04 })
    const floorW = Math.max(4, b.maxX - b.minX + 2)
    const floorD = Math.max(4, b.maxY - b.minY + 2)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(floorW, floorD), floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(b.cx, 0, b.cy)
    scene.add(floor)
    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(floorW, floorD),
      new THREE.MeshStandardMaterial({ color: pal.ceil, roughness: 1 }),
    )
    ceil.rotation.x = Math.PI / 2
    ceil.position.set(b.cx, wallH, b.cy)
    scene.add(ceil)

    for (const w of blueprint.walls) {
      const g = wallGeom(w)
      const thick = Math.max(0.26, w.thickness || 0.26)
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(g.len, g.h, thick), wallMat)
      mesh.position.set(g.mx, g.h / 2, g.my)
      mesh.rotation.y = -g.angle
      scene.add(mesh)
    }

    scene.add(new THREE.AmbientLight(0xffffff, 0.42))
    const key = new THREE.DirectionalLight(0xfff5e6, 1.05)
    key.position.set(b.cx + 3, wallH - 0.4, b.cy - 2)
    scene.add(key)

    const skin0 = loadAvatarSkin()
    const accent0 = AVATAR_SKINS.find(s => s.id === skin0)?.accent ?? 0x8b5cf6
    const avatar = createPlayerAvatar(skin0, accent0)
    scene.add(avatar)

    const loader = new THREE.TextureLoader()
    loader.crossOrigin = 'anonymous'
    const artAnchors: { pos: THREE.Vector3; frame: FrameItem }[] = []
    const wallList = blueprint.walls.filter(w => Math.hypot(w.x2 - w.x1, w.y2 - w.y1) > 1.2)

    function placeArt(tex: THREE.Texture, apx: number, apz: number, nx: number, nz: number, angle: number) {
      if (disposed) return
      tex.colorSpace = THREE.SRGBColorSpace
      const art = new THREE.Mesh(
        new THREE.PlaneGeometry(1.25, 1.5),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.48, metalness: 0.05 }),
      )
      art.position.set(apx + nx * 0.08, 1.65, apz + nz * 0.08)
      art.rotation.y = -angle
      scene.add(art)
    }

    const nWalls = Math.max(1, wallList.length)
    paintings.forEach((frame, i) => {
      const w = wallList[i % nWalls]
      if (!w) return
      const g = wallGeom(w)
      const onThis = Math.floor(i / nWalls)
      const totalOn = Math.ceil(paintings.length / nWalls)
      const t = 0.18 + ((onThis + 0.5) / Math.max(1, totalOn)) * 0.64
      const ax = w.x1 + (w.x2 - w.x1) * t
      const az = w.y1 + (w.y2 - w.y1) * t
      const nx = -Math.sin(g.angle)
      const nz = Math.cos(g.angle)
      const apx = ax + nx * 0.16
      const apz = az + nz * 0.16
      const frameMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.42, 1.7, 0.1),
        new THREE.MeshStandardMaterial({
          color: pal.frame,
          roughness: 0.4,
          metalness: 0.28,
          emissive: pal.emissive,
          emissiveIntensity: 0.4,
        }),
      )
      frameMesh.position.set(apx, 1.65, apz)
      frameMesh.rotation.y = -g.angle
      scene.add(frameMesh)
      artAnchors.push({ pos: new THREE.Vector3(apx, 1.65, apz), frame })
      const u = (frame.image || '').trim()
      if (u) {
        loader.load(
          u,
          tex => placeArt(tex, apx, apz, nx, nz, g.angle),
          undefined,
          () => {},
        )
      }
    })

    // Green available slots
    for (let s = paintings.length; s < paintings.length + 4; s++) {
      const w = wallList[s % Math.max(1, wallList.length)]
      if (!w) continue
      const g = wallGeom(w)
      const t = 0.35 + ((s - paintings.length) * 0.15) % 0.4
      const ax = w.x1 + (w.x2 - w.x1) * t
      const az = w.y1 + (w.y2 - w.y1) * t
      const nx = -Math.sin(g.angle)
      const nz = Math.cos(g.angle)
      const apx = ax + nx * 0.16
      const apz = az + nz * 0.16
      const slot = new THREE.Mesh(
        new THREE.BoxGeometry(1.35, 1.6, 0.08),
        new THREE.MeshStandardMaterial({
          color: 0x0a1f12,
          emissive: 0x22c55e,
          emissiveIntensity: 0.65,
          transparent: true,
          opacity: 0.55,
        }),
      )
      slot.position.set(apx, 1.65, apz)
      slot.rotation.y = -g.angle
      scene.add(slot)
    }

    const isWalkable = makeWalkableChecker(
      blueprint.walls.map(w => ({
        x1: w.x1,
        y1: w.y1,
        x2: w.x2,
        y2: w.y2,
        thickness: w.thickness || 0.26,
      })),
      (x, z) => pointInBlueprintFloor(blueprint, x, z),
      MUSEUM_FPS.collisionRadius,
    )

    let px = b.cx
    let pz = b.cy
    if (!isWalkable(px, pz)) {
      px = b.minX + 1.8
      pz = b.minY + 1.8
    }
    let yaw = 0
    let pitch = 0.22
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
      if (isNavKey(e)) {
        e.preventDefault()
        applyNavKey(keys.current, e, true)
      }
      const k = e.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'shift', 'e'].includes(k)) {
        keys.current[k] = true
        if (k === 'e' && nearestRef.current) {
          const a = artAnchors.find(x => x.frame === nearestRef.current)
          if (a) approachRef.current = a.pos.clone()
          setInspect(nearestRef.current)
        }
      }
    }
    const ku = (e: KeyboardEvent) => {
      if (isNavKey(e)) {
        e.preventDefault()
        applyNavKey(keys.current, e, false)
      }
      const k = e.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'shift', 'e'].includes(k)) keys.current[k] = false
    }
    window.addEventListener('keydown', kd, { passive: false })
    window.addEventListener('keyup', ku, { passive: false })

    let dragging = false
    let moved = false
    let lastX = 0
    let lastY = 0
    let downX = 0
    let downY = 0
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return
      try {
        if (!isMusicEnabled()) setMusicEnabled(true)
      } catch {
        /* */
      }
      dragging = true
      moved = false
      lastX = e.clientX
      lastY = e.clientY
      downX = e.clientX
      downY = e.clientY
      canvas.setPointerCapture?.(e.pointerId)
    }
    const onUp = (e: PointerEvent) => {
      const wasDrag = moved || Math.hypot(e.clientX - downX, e.clientY - downY) > 10
      dragging = false
      try {
        canvas.releasePointerCapture?.(e.pointerId)
      } catch {
        /* */
      }
      if (!wasDrag && nearestRef.current) {
        const a = artAnchors.find(x => x.frame === nearestRef.current)
        if (a) approachRef.current = a.pos.clone()
        setInspect(nearestRef.current)
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
    const clock = new THREE.Clock()
    let raf = 0
    const loop = () => {
      if (disposed) return
      raf = requestAnimationFrame(loop)
      const dt = Math.min(clock.getDelta(), 0.05)
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
      const moving = Math.hypot(ix, iz) > 0.01
      const integ = integrateWishVelocity(vx, vz, wishX, wishZ, speed, dt, moving, MUSEUM_FPS.accel, MUSEUM_FPS.friction)
      vx = integ.vx
      vz = integ.vz
      if (moving) facing = Math.atan2(wishX, wishZ)
      const slide = trySlideMove(px, pz, vx, vz, dt, isWalkable, MUSEUM_FPS.collisionRadius)
      px = slide.x
      pz = slide.z
      vx = slide.vx
      vz = slide.vz

      // Slow auto-approach toward selected artwork
      const appr = approachRef.current
      if (appr) {
        const adx = appr.x - px
        const adz = appr.z - pz
        const ad = Math.hypot(adx, adz)
        if (ad > 1.4) {
          px += (adx / ad) * Math.min(2.0 * dt, ad - 1.4)
          pz += (adz / ad) * Math.min(2.0 * dt, ad - 1.4)
          facing = Math.atan2(adx, adz)
        } else {
          approachRef.current = null
        }
      }

      avatar.position.set(px, 0, pz)
      avatar.rotation.y = facing
      walkPhase = tickAvatarWalk(avatar, walkPhase, Math.min(1, Math.hypot(vx, vz) / WALK), dt)

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
        lastNearTitle = nearest.title || ''
        setNearTitle(nearest.title || '')
      } else if (!nearest && lastNearTitle) {
        lastNearTitle = ''
        setNearTitle('')
      }

      const camDist = clampCameraDistance(px, pz, yaw, pitch, CAM_DIST, isWalkable, MUSEUM_FPS.camMinDist)
      camera.position.set(
        px - Math.sin(yaw) * camDist * Math.cos(pitch),
        CAM_HEIGHT + Math.sin(pitch) * 0.5 * (camDist / CAM_DIST),
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
  }, [blueprint, paintings, room, pal, roomName])

  return (
    <div className="relative w-full h-[min(72vh,640px)] rounded-2xl overflow-hidden border border-white/10 bg-black">
      <div ref={mountRef} className="absolute inset-0" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">{emptyLabel}</div>
      )}
      <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-2 items-center pointer-events-none z-10">
        <span className="text-[10px] uppercase tracking-wider text-white/70 bg-black/50 px-2 py-1 rounded-lg">
          {roomName} · {area} m²
        </span>
        {nearTitle && (
          <span className="text-[11px] text-cyan-100/90 bg-black/55 px-2 py-1 rounded-lg">E · {nearTitle}</span>
        )}
        <span className="text-[10px] text-emerald-300/90 bg-black/50 px-2 py-1 rounded-lg">Cadres verts = dispo</span>
      </div>
      <div className="absolute bottom-3 left-2 right-2 flex flex-wrap gap-1.5 items-center z-20">
        {AVATAR_SKINS.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              saveAvatarSkin(s.id)
              setAvatarSkin(s.id)
              window.location.reload()
            }}
            className={`text-[11px] px-2 py-1 rounded-lg border ${
              avatarSkin === s.id
                ? 'border-violet-400/80 bg-violet-500/30 text-white'
                : 'border-white/15 bg-black/50 text-zinc-300'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <NavReticle />
      {inspect && (
        <ArtworkDossier
          frame={inspect}
          onBuy={() => onBuy(inspect)}
          onClose={() => setInspect(null)}
        />
      )}
    </div>
  )
}
