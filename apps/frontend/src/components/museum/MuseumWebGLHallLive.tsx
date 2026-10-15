/**
 * Musee WebGL Live — placeArt textures, click-to-enlarge modal, drag look, joystick.
 * Lighting: Ambient 0.8 + Key 1.45 + Fill 0.55 + Rim point.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { useI18n } from '../../i18n/I18nContext'
import {
  createPlayerAvatar,
  tickAvatarWalk,
  loadAvatarSkin,
  AVATAR_SKINS,
  type AvatarSkinId,
} from '../../lib/museumAvatar'
import { type FrameItem } from './MuseumCorridor'
import ArtworkDetailsModal from './ArtworkDetailsModal'
import VirtualJoystick from './VirtualJoystick'
import type { RoomBlueprint, WallSeg } from '../../lib/roomBlueprint'
import { pointInBlueprintFloor } from '../../lib/loadBlueprint'
import { canListBuyNft } from '../../config/scStatus'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'
import {
  trySlideMove,
  integrateWishVelocity,
  makeWalkableChecker,
} from '../../lib/spatialEngine'
import { MUSEUM_FPS, applyNavKey, isNavKey } from '../../lib/museumFpsController'
import NavReticle from './NavReticle'

const EYE = 1.65
const WALK = MUSEUM_FPS.walkSpeed
const SPRINT = MUSEUM_FPS.sprintSpeed
const MAX_ART = 24
const PITCH_MAX = MUSEUM_FPS.pitchMax
const CAM_DIST = MUSEUM_FPS.camMaxDist
const CAM_HEIGHT = 2.2

/** Hall lighting (v0.110) */
const AMBIENT_INTENSITY = 0.8
const KEY_INTENSITY = 1.45
const FILL_INTENSITY = 0.55
const RIM_INTENSITY = 0.55

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
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const w of bp.walls) {
    minX = Math.min(minX, w.x1, w.x2)
    minY = Math.min(minY, w.y1, w.y2)
    maxX = Math.max(maxX, w.x1, w.x2)
    maxY = Math.max(maxY, w.y1, w.y2)
  }
  return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 }
}

function titlePlaceholder(title: string): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 320
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#1a1620'
  ctx.fillRect(0, 0, 256, 320)
  ctx.strokeStyle = '#a78bfa'
  ctx.lineWidth = 4
  ctx.strokeRect(8, 8, 240, 304)
  ctx.fillStyle = '#e4e4e7'
  ctx.font = 'bold 16px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText((title || 'Oeuvre').slice(0, 22), 128, 160)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export default function MuseumWebGLHallLive({
  blueprint,
  frames,
  room = 'stone',
  allowBuy = true,
}: {
  blueprint: RoomBlueprint
  frames: FrameItem[]
  room?: Theme
  allowBuy?: boolean
  emptyLabel?: string
}) {
  const mountRef = useRef<HTMLDivElement>(null)
  const keys = useRef<Record<string, boolean>>({})
  const hold = useRef({ up: false, down: false, left: false, right: false })
  const nearestRef = useRef<FrameItem | null>(null)
  const [ready, setReady] = useState(false)
  const [nearTitle, setNearTitle] = useState('')
  const [avatarSkin] = useState<AvatarSkinId>(() => loadAvatarSkin())
  const [inspect, setInspect] = useState<FrameItem | null>(null)
  const [isCoarse, setIsCoarse] = useState(false)
  const [open, setOpen] = useState(true)
  const { t } = useI18n()
  const { connected } = useWallet()
  const marketLive = canListBuyNft()
  const pal = PALETTE[room] || PALETTE.stone
  const paintings = useMemo(() => {
    const list = frames.filter(f => !!f.image && f.kind !== 'sculpture').slice(0, MAX_ART)
    return list.map((f, i) => ({
      ...f,
      id: f.id && f.id !== 'default' ? f.id : `art-${i}-${(f.title || 'oeuvre').slice(0, 24)}`,
    }))
  }, [frames])

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const apply = () => setIsCoarse(!!mq.matches)
    apply()
    mq.addEventListener?.('change', apply)
    return () => mq.removeEventListener?.('change', apply)
  }, [])

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
    let webglPaused = false
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
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const lowMem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
    const lowEnd = coarse || (typeof lowMem === 'number' && lowMem > 0 && lowMem <= 4)
    const renderer = new THREE.WebGLRenderer({
      antialias: !lowEnd,
      powerPreference: lowEnd ? 'low-power' : 'high-performance',
      failIfMajorPerformanceCaveat: false,
    })
    renderer.setPixelRatio(Math.min(devicePixelRatio, lowEnd ? 1.25 : 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.12
    mount.appendChild(renderer.domElement)
    const canvas = renderer.domElement
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;pointer-events:auto'

    const onVisibility = () => {
      webglPaused = document.visibilityState !== 'visible'
    }
    document.addEventListener('visibilitychange', onVisibility)
    onVisibility()

    const onContextLost = (e: Event) => {
      e.preventDefault()
      webglPaused = true
      try {
        setOpen(false)
      } catch {
        /* */
      }
    }
    canvas.addEventListener('webglcontextlost', onContextLost, false)

    const floorMat = new THREE.MeshStandardMaterial({ color: pal.floor, roughness: 0.85, metalness: 0.06 })
    const wallMat = new THREE.MeshStandardMaterial({ color: pal.wall, roughness: 0.9, metalness: 0.04 })
    const ceilMat = new THREE.MeshStandardMaterial({ color: pal.ceil, roughness: 1, metalness: 0 })
    const floorW = Math.max(4, b.maxX - b.minX + 2)
    const floorD = Math.max(4, b.maxY - b.minY + 2)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(floorW, floorD), floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(b.cx, 0, b.cy)
    floor.frustumCulled = true
    scene.add(floor)
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(floorW, floorD), ceilMat)
    ceil.rotation.x = Math.PI / 2
    ceil.position.set(b.cx, wallH, b.cy)
    ceil.frustumCulled = true
    scene.add(ceil)

    for (const w of blueprint.walls) {
      const g = wallGeom(w)
      const thick = Math.max(0.26, w.thickness || 0.26)
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(g.len, g.h, thick), wallMat)
      mesh.position.set(g.mx, g.h / 2, g.my)
      mesh.rotation.y = -g.angle
      mesh.frustumCulled = true
      scene.add(mesh)
    }

    scene.add(new THREE.AmbientLight(0xffffff, AMBIENT_INTENSITY))
    const key = new THREE.DirectionalLight(0xfff5e6, KEY_INTENSITY)
    key.position.set(b.cx + 3, wallH - 0.4, b.cy - 2)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xb8c5ff, FILL_INTENSITY)
    fill.position.set(b.cx - 4, wallH * 0.6, b.cy + 3)
    scene.add(fill)
    const rim = new THREE.PointLight(0xffd9a0, RIM_INTENSITY, 20)
    rim.position.set(b.cx, wallH - 0.5, b.cy)
    scene.add(rim)

    const skin0 = loadAvatarSkin()
    const accent0 = AVATAR_SKINS.find(s => s.id === skin0)?.accent ?? 0x8b5cf6
    const avatar = createPlayerAvatar(skin0, accent0)
    scene.add(avatar)

    const loader = new THREE.TextureLoader()
    loader.crossOrigin = 'anonymous'
    const artAnchors: { pos: THREE.Vector3; frame: FrameItem }[] = []
    const pickMeshes: THREE.Object3D[] = []
    const wallList = blueprint.walls.filter(w => Math.hypot(w.x2 - w.x1, w.y2 - w.y1) > 1.2)

    function placeArt(
      tex: THREE.Texture,
      apx: number,
      apz: number,
      nx: number,
      nz: number,
      angle: number,
      frame: FrameItem,
    ) {
      if (disposed) return
      tex.colorSpace = THREE.SRGBColorSpace
      const art = new THREE.Mesh(
        new THREE.PlaneGeometry(1.25, 1.5),
        new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.48,
          metalness: 0.05,
          emissive: 0x1a1814,
          emissiveIntensity: 0.14,
        }),
      )
      art.position.set(apx + nx * 0.08, 1.65, apz + nz * 0.08)
      art.rotation.y = -angle
      art.userData.frame = frame
      art.frustumCulled = true
      scene.add(art)
      pickMeshes.push(art)
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
          emissiveIntensity: 0.55,
        }),
      )
      frameMesh.position.set(apx, 1.65, apz)
      frameMesh.rotation.y = -g.angle
      frameMesh.userData.frame = frame
      frameMesh.frustumCulled = true
      scene.add(frameMesh)
      pickMeshes.push(frameMesh)
      artAnchors.push({ pos: new THREE.Vector3(apx, 1.65, apz), frame })
      const url = frame.image || ''
      if (url) {
        loader.load(
          url,
          tex => placeArt(tex, apx, apz, nx, nz, g.angle, frame),
          undefined,
          () => placeArt(titlePlaceholder(frame.title || 'Art'), apx, apz, nx, nz, g.angle, frame),
        )
      } else {
        placeArt(titlePlaceholder(frame.title || 'Art'), apx, apz, nx, nz, g.angle, frame)
      }
    })

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
        if (k === 'e' && nearestRef.current) setInspect(nearestRef.current)
      }
    }
    const ku = (e: KeyboardEvent) => {
      if (isNavKey(e)) applyNavKey(keys.current, e, false)
      const k = e.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'shift', 'e'].includes(k)) keys.current[k] = false
    }
    window.addEventListener('keydown', kd, { passive: false })
    window.addEventListener('keyup', ku, { passive: false })

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let dragYaw = false
    let lastX = 0
    let lastY = 0
    let moved = false

    const onPointerDown = (e: PointerEvent) => {
      dragYaw = true
      moved = false
      lastX = e.clientX
      lastY = e.clientY
      try {
        canvas.setPointerCapture(e.pointerId)
      } catch {
        /* */
      }
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!dragYaw) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true
      lastX = e.clientX
      lastY = e.clientY
      yaw -= dx * 0.005
      pitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, pitch - dy * 0.003))
    }
    const onPointerUp = (e: PointerEvent) => {
      dragYaw = false
      try {
        canvas.releasePointerCapture(e.pointerId)
      } catch {
        /* */
      }
      if (moved) return
      const rect = canvas.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(pickMeshes, false)
      if (hits.length > 0) {
        const f = hits[0].object.userData.frame as FrameItem | undefined
        if (f) setInspect(f)
      } else if (nearestRef.current) {
        setInspect(nearestRef.current)
      }
    }
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)

    setReady(true)
    const clock = new THREE.Clock()
    let raf = 0
    const loop = () => {
      if (disposed) return
      raf = requestAnimationFrame(loop)
      if (webglPaused) return
      const dt = Math.min(clock.getDelta(), 0.05)
      const sprint = !!keys.current.shift
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
      const integ = integrateWishVelocity(
        vx,
        vz,
        wishX,
        wishZ,
        speed,
        dt,
        moving,
        MUSEUM_FPS.accel,
        MUSEUM_FPS.friction,
      )
      vx = integ.vx
      vz = integ.vz
      if (moving) facing = Math.atan2(wishX, wishZ)
      const slide = trySlideMove(px, pz, vx, vz, dt, isWalkable, MUSEUM_FPS.collisionRadius)
      px = slide.x
      pz = slide.z
      vx = slide.vx
      vz = slide.vz
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
        lastNearTitle = nearest.title
        setNearTitle(nearest.title)
      } else if (!nearest && lastNearTitle) {
        lastNearTitle = ''
        setNearTitle('')
      }

      camera.position.set(
        px - Math.sin(yaw) * CAM_DIST * Math.cos(pitch),
        CAM_HEIGHT + Math.sin(pitch) * 0.5,
        pz - Math.cos(yaw) * CAM_DIST * Math.cos(pitch),
      )
      camera.lookAt(px, EYE * 0.9, pz)
      renderer.render(scene, camera)
    }
    loop()

    return () => {
      disposed = true
      webglPaused = true
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      ro.disconnect()
      try {
        scene.traverse(obj => {
          const mesh = obj as THREE.Mesh
          if (mesh.geometry) mesh.geometry.dispose()
          const mat = mesh.material
          if (mat) {
            const list = Array.isArray(mat) ? mat : [mat]
            list.forEach(m => {
              const std = m as THREE.MeshStandardMaterial
              if (std.map) std.map.dispose()
              m.dispose()
            })
          }
        })
        renderer.dispose()
      } catch {
        /* */
      }
      if (mount.contains(canvas)) mount.removeChild(canvas)
    }
  }, [blueprint, paintings, pal, avatarSkin, open])

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full min-h-[140px] rounded-2xl border border-white/10 bg-zinc-950 px-4 text-sm text-zinc-200"
      >
        {t('museum.enterImmersion')} (2D fallback)
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[25] w-full h-full overflow-hidden bg-black">
      <div ref={mountRef} className="absolute inset-0" style={{ pointerEvents: 'auto' }} />
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/90">
          <p className="text-[12px] text-cyan-100/80">{t('museum.loading')}</p>
        </div>
      )}
      {isCoarse && (
        <div className="absolute bottom-24 left-1/2 z-10 -translate-x-1/2">
          <VirtualJoystick
            onChange={(x, y) => {
              hold.current.left = x < -0.25
              hold.current.right = x > 0.25
              hold.current.up = y < -0.25
              hold.current.down = y > 0.25
            }}
          />
        </div>
      )}
      {inspect && (
        <ArtworkDetailsModal
          frame={inspect}
          onClose={() => setInspect(null)}
          onBuy={allowBuy ? () => void onBuy(inspect) : undefined}
        />
      )}
      {nearTitle ? (
        <div className="pointer-events-none absolute bottom-28 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/15 bg-black/70 px-4 py-1.5 text-[12px] text-zinc-100 backdrop-blur-md">
          {nearTitle} · {t('museum.tapToEnlarge') || 'tap to enlarge'}
        </div>
      ) : null}
      <NavReticle />
    </div>
  )
}
