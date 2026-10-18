/**
 * Musée WebGL Live — FPS + avatar, dual-touch, fullscreen, prev/next artwork.
 * Graphite / acid-green chrome overlays.
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
const CAM_DIST_AVATAR = MUSEUM_FPS.camMaxDist
const CAM_HEIGHT_AVATAR = 2.2

const AMBIENT_INTENSITY = 0.85
const KEY_INTENSITY = 1.5
const FILL_INTENSITY = 0.6
const RIM_INTENSITY = 0.5

type Theme = 'cyber' | 'stone' | 'gold' | 'white' | 'dark'
type ViewMode = 'fps' | 'avatar'

const PALETTE: Record<
  Theme,
  { wall: number; floor: number; ceil: number; fog: number; frame: number; emissive: number }
> = {
  cyber: { wall: 0x1e2440, floor: 0x0c1020, ceil: 0x141a30, fog: 0x0a0e1c, frame: 0x334155, emissive: 0xcdf58b },
  stone: { wall: 0x4a4038, floor: 0x242018, ceil: 0x3a3228, fog: 0x1a1610, frame: 0x6b5a48, emissive: 0xc4a574 },
  gold: { wall: 0x4a3c20, floor: 0x221c10, ceil: 0x3a2e18, fog: 0x18140c, frame: 0x7a6530, emissive: 0xe0b84a },
  white: { wall: 0xf0ebe3, floor: 0xd4cdc2, ceil: 0xfaf7f2, fog: 0xc8c0b4, frame: 0xe0d8cc, emissive: 0xa09888 },
  dark: { wall: 0x242018, floor: 0x12100c, ceil: 0x1a1814, fog: 0x0c0a08, frame: 0x3a3228, emissive: 0xcdf58b },
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
  ctx.fillStyle = '#161914'
  ctx.fillRect(0, 0, 256, 320)
  ctx.strokeStyle = '#cdf58b'
  ctx.lineWidth = 4
  ctx.strokeRect(8, 8, 240, 304)
  ctx.fillStyle = '#f2f5ee'
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
  const shellRef = useRef<HTMLDivElement>(null)
  const keys = useRef<Record<string, boolean>>({})
  const hold = useRef({ up: false, down: false, left: false, right: false })
  const nearestRef = useRef<FrameItem | null>(null)
  const viewModeRef = useRef<ViewMode>('fps')
  const spawnRef = useRef({ x: 0, z: 0, yaw: 0 })
  const resetReq = useRef(false)

  const [ready, setReady] = useState(false)
  const [nearTitle, setNearTitle] = useState('')
  const [avatarSkin] = useState<AvatarSkinId>(() => loadAvatarSkin())
  const [inspect, setInspect] = useState<FrameItem | null>(null)
  const [isCoarse, setIsCoarse] = useState(false)
  const [open, setOpen] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('fps')
  const [fullscreen, setFullscreen] = useState(false)

  const { t, lang } = useI18n()
  const { connected } = useWallet()
  const marketLive = canListBuyNft()
  const pal = PALETTE[room] || PALETTE.stone
  const isFr = lang === 'fr'

  const paintings = useMemo(() => {
    const list = frames.filter(f => !!f.image && f.kind !== 'sculpture').slice(0, MAX_ART)
    return list.map((f, i) => ({
      ...f,
      id: f.id && f.id !== 'default' ? f.id : `art-${i}-${(f.title || 'oeuvre').slice(0, 24)}`,
    }))
  }, [frames])

  useEffect(() => {
    viewModeRef.current = viewMode
  }, [viewMode])

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const apply = () => setIsCoarse(!!mq.matches)
    apply()
    mq.addEventListener?.('change', apply)
    return () => mq.removeEventListener?.('change', apply)
  }, [])

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const el = shellRef.current
    if (!el) return
    try {
      if (!document.fullscreenElement) await el.requestFullscreen?.()
      else await document.exitFullscreen?.()
    } catch {
      /* */
    }
  }, [])

  const goArt = useCallback(
    (dir: -1 | 1) => {
      if (!paintings.length) return
      setArtIndex(i => {
        const next = (i + dir + paintings.length) % paintings.length
        const f = paintings[next]
        if (f) setInspect(f)
        return next
      })
    },
    [paintings],
  )

  const [, setArtIndex] = useState(0)

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
    if (!mount || !open) return
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
    scene.fog = new THREE.FogExp2(pal.fog, 0.026)
    const camera = new THREE.PerspectiveCamera(68, 1, 0.08, 90)
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const lowMem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
    const lowEnd = coarse || (typeof lowMem === 'number' && lowMem > 0 && lowMem <= 4)
    const reduceMotion =
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    const renderer = new THREE.WebGLRenderer({
      antialias: !lowEnd && !reduceMotion,
      powerPreference: lowEnd ? 'low-power' : 'high-performance',
      failIfMajorPerformanceCaveat: false,
    })
    renderer.setPixelRatio(Math.min(devicePixelRatio, lowEnd ? 1.15 : reduceMotion ? 1.25 : 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.14
    mount.appendChild(renderer.domElement)
    const canvas = renderer.domElement
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;pointer-events:auto'
    canvas.tabIndex = 0

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

    const floorMat = new THREE.MeshStandardMaterial({ color: pal.floor, roughness: 0.82, metalness: 0.08 })
    const wallMat = new THREE.MeshStandardMaterial({ color: pal.wall, roughness: 0.88, metalness: 0.05 })
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
      const thick = Math.max(0.26, w.thickness || 0.26)
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(g.len, g.h, thick), wallMat)
      mesh.position.set(g.mx, g.h / 2, g.my)
      mesh.rotation.y = -g.angle
      scene.add(mesh)
    }

    scene.add(new THREE.AmbientLight(0xffffff, AMBIENT_INTENSITY))
    const key = new THREE.DirectionalLight(0xfff5e6, KEY_INTENSITY)
    key.position.set(b.cx + 3, wallH - 0.4, b.cy - 2)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xb8c5ff, FILL_INTENSITY)
    fill.position.set(b.cx - 4, wallH * 0.6, b.cy + 3)
    scene.add(fill)
    const rim = new THREE.PointLight(0xffd9a0, RIM_INTENSITY, 22)
    rim.position.set(b.cx, wallH - 0.5, b.cy)
    scene.add(rim)

    const skin0 = loadAvatarSkin()
    const accent0 = AVATAR_SKINS.find(s => s.id === skin0)?.accent ?? 0xcdf58b
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
          roughness: 0.45,
          metalness: 0.06,
          emissive: 0x1a1814,
          emissiveIntensity: 0.16,
          side: THREE.FrontSide,
        }),
      )
      art.position.set(apx + nx * 0.09, 1.65, apz + nz * 0.09)
      art.rotation.y = -angle
      art.userData.frame = frame
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
      const tt = 0.18 + ((onThis + 0.5) / Math.max(1, totalOn)) * 0.64
      const ax = w.x1 + (w.x2 - w.x1) * tt
      const az = w.y1 + (w.y2 - w.y1) * tt
      const nx = -Math.sin(g.angle)
      const nz = Math.cos(g.angle)
      const apx = ax + nx * 0.16
      const apz = az + nz * 0.16
      const frameMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.42, 1.7, 0.1),
        new THREE.MeshStandardMaterial({
          color: pal.frame,
          roughness: 0.38,
          metalness: 0.32,
          emissive: pal.emissive,
          emissiveIntensity: 0.45,
        }),
      )
      frameMesh.position.set(apx, 1.65, apz)
      frameMesh.rotation.y = -g.angle
      frameMesh.userData.frame = frame
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
    spawnRef.current = { x: px, z: pz, yaw: 0 }
    let yaw = 0
    let pitch = 0.08
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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (isNavKey(e) || ['z', 'q', 'Z', 'Q'].includes(e.key)) {
        e.preventDefault()
        applyNavKey(keys.current, e, true)
        const kk = e.key.toLowerCase()
        if (kk === 'z') keys.current.w = true
        if (kk === 'q') keys.current.a = true
      }
      const k = e.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'shift', 'e'].includes(k)) {
        keys.current[k] = true
        if (k === 'e' && nearestRef.current) setInspect(nearestRef.current)
      }
      if (k === 'f') void toggleFullscreen()
      if (k === 'r') resetReq.current = true
      if (k === 'v') setViewMode(m => (m === 'fps' ? 'avatar' : 'fps'))
      if (k === 'escape' && document.fullscreenElement) void document.exitFullscreen?.()
    }
    const ku = (e: KeyboardEvent) => {
      if (isNavKey(e) || ['z', 'q', 'Z', 'Q'].includes(e.key)) {
        applyNavKey(keys.current, e, false)
        const kk = e.key.toLowerCase()
        if (kk === 'z') keys.current.w = false
        if (kk === 'q') keys.current.a = false
      }
      const k = e.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'shift', 'e'].includes(k)) keys.current[k] = false
    }
    window.addEventListener('keydown', kd, { passive: false })
    window.addEventListener('keyup', ku, { passive: false })

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let lookPointerId: number | null = null
    let lastX = 0
    let lastY = 0
    let moved = false

    const onPointerDown = (e: PointerEvent) => {
      if (lookPointerId != null) return
      lookPointerId = e.pointerId
      moved = false
      lastX = e.clientX
      lastY = e.clientY
      try {
        canvas.setPointerCapture(e.pointerId)
      } catch {
        /* */
      }
      try {
        canvas.focus({ preventScroll: true })
      } catch {
        /* */
      }
    }
    const onPointerMove = (e: PointerEvent) => {
      if (lookPointerId !== e.pointerId) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true
      lastX = e.clientX
      lastY = e.clientY
      const sens = coarse ? 0.0065 : 0.0045
      yaw -= dx * sens
      pitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, pitch - dy * sens * 0.75))
    }
    const onPointerUp = (e: PointerEvent) => {
      if (lookPointerId !== e.pointerId) return
      lookPointerId = null
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

      if (resetReq.current) {
        resetReq.current = false
        px = spawnRef.current.x
        pz = spawnRef.current.z
        yaw = spawnRef.current.yaw
        pitch = 0.08
        vx = 0
        vz = 0
      }

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
      const fpsMode = viewModeRef.current === 'fps'
      avatar.visible = !fpsMode
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

      if (fpsMode) {
        camera.position.set(px, EYE, pz)
        camera.lookAt(
          px - Math.sin(yaw) * Math.cos(pitch),
          EYE + Math.sin(pitch),
          pz - Math.cos(yaw) * Math.cos(pitch),
        )
      } else {
        camera.position.set(
          px - Math.sin(yaw) * CAM_DIST_AVATAR * Math.cos(pitch),
          CAM_HEIGHT_AVATAR + Math.sin(pitch) * 0.5,
          pz - Math.cos(yaw) * CAM_DIST_AVATAR * Math.cos(pitch),
        )
        camera.lookAt(px, EYE * 0.9, pz)
      }
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
  }, [blueprint, paintings, pal, avatarSkin, open, toggleFullscreen])

  const btnCls =
    'min-h-[44px] min-w-[44px] rounded-full border px-3 py-2 text-[11px] font-semibold backdrop-blur-md transition active:scale-95'

  if (!open) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[var(--xa-text-muted)]">
          {isFr
            ? 'WebGL indisponible ou contexte perdu. Repli 2D.'
            : 'WebGL unavailable or context lost. 2D fallback.'}
        </p>
        <button type="button" className="xa-btn-primary" onClick={() => setOpen(true)}>
          {t('museum.enterImmersion') || (isFr ? 'Réessayer immersion' : 'Retry immersion')}
        </button>
      </div>
    )
  }

  return (
    <div
      ref={shellRef}
      className="fixed inset-0 z-[25] w-full h-full overflow-hidden bg-[#10120f]"
      role="application"
      aria-label={isFr ? 'Galerie immersive' : 'Immersive gallery'}
    >
      <div ref={mountRef} className="absolute inset-0" style={{ pointerEvents: 'auto' }} />

      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#10120f]/95">
          <p className="text-sm text-[var(--xa-accent)]">
            {t('museum.loading') || (isFr ? 'Chargement…' : 'Loading…')}
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto flex flex-wrap gap-2">
          <button
            type="button"
            className={btnCls}
            style={{ borderColor: 'var(--xa-border-strong)', background: 'rgba(16,18,15,0.8)', color: 'var(--xa-text)' }}
            onClick={() => setOpen(false)}
          >
            {isFr ? 'Quitter' : 'Exit'}
          </button>
          <button
            type="button"
            className={btnCls}
            style={{ borderColor: 'var(--xa-border-strong)', background: 'rgba(16,18,15,0.8)', color: 'var(--xa-text)' }}
            onClick={() => void toggleFullscreen()}
          >
            {fullscreen ? (isFr ? 'Réduire' : 'Exit FS') : isFr ? 'Plein écran' : 'Fullscreen'}
          </button>
          <button
            type="button"
            className={btnCls}
            style={{
              borderColor: 'var(--xa-accent)',
              background: viewMode === 'fps' ? 'var(--xa-accent-soft)' : 'rgba(16,18,15,0.8)',
              color: 'var(--xa-text)',
            }}
            onClick={() => setViewMode(m => (m === 'fps' ? 'avatar' : 'fps'))}
          >
            {viewMode === 'fps' ? 'FPS' : 'Avatar'}
          </button>
          <button
            type="button"
            className={btnCls}
            style={{ borderColor: 'var(--xa-border-strong)', background: 'rgba(16,18,15,0.8)', color: 'var(--xa-text)' }}
            onClick={() => {
              resetReq.current = true
            }}
          >
            Reset
          </button>
        </div>
        <div
          className="pointer-events-none max-w-[50%] rounded-full border px-3 py-1.5 text-[11px] text-[var(--xa-text-secondary)] backdrop-blur-md"
          style={{ borderColor: 'var(--xa-border)', background: 'rgba(16,18,15,0.75)' }}
        >
          {isFr ? 'WASD/ZQSD · glisser regard · E inspecter' : 'WASD · drag look · E inspect'}
        </div>
      </div>

      {paintings.length > 0 && (
        <div className="pointer-events-auto absolute bottom-28 right-3 z-20 flex flex-col gap-2 sm:bottom-8">
          <button
            type="button"
            className={btnCls}
            style={{ borderColor: 'var(--xa-accent)', background: 'rgba(16,18,15,0.85)', color: 'var(--xa-accent)' }}
            onClick={() => goArt(-1)}
            aria-label={isFr ? 'Œuvre précédente' : 'Previous artwork'}
          >
            ←
          </button>
          <button
            type="button"
            className={btnCls}
            style={{ borderColor: 'var(--xa-accent)', background: 'rgba(16,18,15,0.85)', color: 'var(--xa-accent)' }}
            onClick={() => goArt(1)}
            aria-label={isFr ? 'Œuvre suivante' : 'Next artwork'}
          >
            →
          </button>
        </div>
      )}

      {isCoarse && (
        <div className="absolute bottom-8 left-3 z-20 md:hidden">
          <VirtualJoystick
            onChange={(x, y) => {
              hold.current.left = x < -0.28
              hold.current.right = x > 0.28
              hold.current.up = y < -0.28
              hold.current.down = y > 0.28
            }}
          />
        </div>
      )}

      {nearTitle ? (
        <div
          className="pointer-events-none absolute bottom-36 left-1/2 z-20 -translate-x-1/2 rounded-full border px-4 py-1.5 text-[12px] text-[var(--xa-text)] backdrop-blur-md sm:bottom-24"
          style={{ borderColor: 'var(--xa-border-strong)', background: 'rgba(16,18,15,0.8)' }}
        >
          {nearTitle} · {t('museum.tapToEnlarge') || (isFr ? 'toucher pour agrandir' : 'tap to enlarge')}
        </div>
      ) : null}

      {inspect && (
        <ArtworkDetailsModal
          frame={inspect}
          onClose={() => setInspect(null)}
          onBuy={allowBuy ? () => void onBuy(inspect) : undefined}
        />
      )}

      <NavReticle />
    </div>
  )
}
