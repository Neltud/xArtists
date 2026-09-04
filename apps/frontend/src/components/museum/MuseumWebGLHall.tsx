/**
 * Salle musée WebGL — visite type jeu (FPS léger / GTA foot).
 * Tableaux & NFT accrochés aux murs · pointer-lock · WASD + strafe · pad mobile.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import type { FrameItem } from './MuseumCorridor'
import type { RoomBlueprint, WallSeg } from '../../lib/roomBlueprint'
import { blueprintAreaM2 } from '../../lib/roomBlueprint'
import { pointInBlueprintFloor } from '../../lib/loadBlueprint'
import { canListBuyNft } from '../../config/scStatus'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'

const EYE = 1.62
const WALK = 3.2
const SPRINT = 5.6
const MAX_ART = 20
const TEX_CONCURRENT = 4
const LOOK_SENS = 0.0022
const PITCH_MAX = 1.15
const WALL_INSET = 0.12

type Theme = 'cyber' | 'stone' | 'gold' | 'white' | 'dark'

const PALETTE: Record<
  Theme,
  { wall: number; floor: number; ceil: number; fog: number; frame: number; emissive: number; trim: number }
> = {
  cyber: {
    wall: 0x141428,
    floor: 0x060610,
    ceil: 0x0a0a18,
    fog: 0x04040a,
    frame: 0x1e293b,
    emissive: 0x0e7490,
    trim: 0x22d3ee,
  },
  stone: {
    wall: 0x3d342c,
    floor: 0x1a1512,
    ceil: 0x2c241e,
    fog: 0x0e0c0a,
    frame: 0x5c4a38,
    emissive: 0x1c1408,
    trim: 0x8b7355,
  },
  gold: {
    wall: 0x3a3018,
    floor: 0x16120a,
    ceil: 0x2a2214,
    fog: 0x0e0c08,
    frame: 0x6b5528,
    emissive: 0x2a1e08,
    trim: 0xc9a227,
  },
  white: {
    wall: 0xe8e2d8,
    floor: 0xc4bdb0,
    ceil: 0xf4f0e8,
    fog: 0xb0a898,
    frame: 0xd4ccc0,
    emissive: 0x888070,
    trim: 0x9a9080,
  },
  dark: {
    wall: 0x181410,
    floor: 0x080604,
    ceil: 0x100e0c,
    fog: 0x040302,
    frame: 0x2a2218,
    emissive: 0x100c08,
    trim: 0x44403c,
  },
}

function wallGeom(w: WallSeg) {
  const dx = w.x2 - w.x1
  const dy = w.y2 - w.y1
  const len = Math.hypot(dx, dy) || 0.01
  return {
    len,
    angle: Math.atan2(dy, dx),
    mx: (w.x1 + w.x2) / 2,
    my: (w.y1 + w.y2) / 2,
    h: w.height || 3.5,
    nx: -Math.sin(Math.atan2(dy, dx)),
    nz: Math.cos(Math.atan2(dy, dx)),
  }
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
  return {
    minX,
    minY,
    maxX,
    maxY,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    w: Math.max(1, maxX - minX),
    d: Math.max(1, maxY - minY),
  }
}

/** Positions d’accrochage le long des murs (intérieur). */
function hangPoints(bp: RoomBlueprint, count: number) {
  const walls = bp.walls.filter(w => Math.hypot(w.x2 - w.x1, w.y2 - w.y1) > 2)
  const pts: { x: number; z: number; facing: number; hang: number }[] = []
  if (!walls.length || count <= 0) return pts

  const perWall = Math.max(1, Math.ceil(count / walls.length))
  for (const w of walls) {
    const g = wallGeom(w)
    for (let i = 0; i < perWall && pts.length < count; i++) {
      const t = (i + 1) / (perWall + 1)
      const x0 = w.x1 + (w.x2 - w.x1) * t
      const z0 = w.y1 + (w.y2 - w.y1) * t
      // normale intérieure approximative vers le centre
      const b = bounds(bp)
      let nx = b.cx - x0
      let nz = b.cy - z0
      const nl = Math.hypot(nx, nz) || 1
      nx /= nl
      nz /= nl
      pts.push({
        x: x0 + nx * WALL_INSET,
        z: z0 + nz * WALL_INSET,
        facing: Math.atan2(nx, nz),
        hang: 1.55 + (i % 3) * 0.05,
      })
    }
  }
  return pts
}

function dispatchBuy(frame: FrameItem) {
  window.dispatchEvent(
    new CustomEvent('lia-intent', {
      detail: {
        lip: {
          raw: `acheter NFT ${frame.id} ${frame.title}`,
          type: 'BUY_NFT',
          asset_id: frame.id,
          paper: true,
          collection: frame.collection,
          title: frame.title,
        },
      },
    })
  )
}

function Pad({ label, on }: { label: string; on: (v: boolean) => void }) {
  return (
    <button
      type="button"
      className="h-12 w-12 rounded-xl border border-white/20 bg-black/60 text-white text-sm font-bold active:bg-cyan-500/35 touch-manipulation select-none shadow-lg"
      aria-label={label}
      onPointerDown={e => {
        e.preventDefault()
        e.stopPropagation()
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

type ArtMesh = {
  mesh: THREE.Object3D
  frame: FrameItem
  x: number
  z: number
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
  const artRef = useRef<ArtMesh[]>([])
  const nearestRef = useRef<FrameItem | null>(null)
  const lockedRef = useRef(false)

  const [nearTitle, setNearTitle] = useState('Clic pour viser · WASD marcher')
  const [inspect, setInspect] = useState<FrameItem | null>(null)
  const [buyMsg, setBuyMsg] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [locked, setLocked] = useState(false)
  const [hint, setHint] = useState(true)

  const { connected } = useWallet()
  const marketLive = canListBuyNft()
  const list = useMemo(() => frames.slice(0, MAX_ART), [frames])
  const pal = PALETTE[room] || PALETTE.stone
  const area = useMemo(() => Math.round(blueprintAreaM2(blueprint)), [blueprint])
  const roomName = blueprint.rooms?.[0]?.name || blueprint.name

  const onBuy = useCallback(() => {
    if (!allowBuy) return
    const f = inspect || nearestRef.current
    if (!f) return
    if (!connected) {
      requestOpenConnect()
      setBuyMsg('Connectez votre wallet pour une intention d’achat.')
      return
    }
    dispatchBuy(f)
    setBuyMsg(
      marketLive
        ? 'Intention d’achat envoyée — signature wallet requise.'
        : 'Intention paper — marché on-chain pas encore live.'
    )
  }, [allowBuy, inspect, connected, marketLive])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || !list.length) return

    let disposed = false
    const b = bounds(blueprint)
    const palLocal = pal
    const wallH = blueprint.wallHeight || 4

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(palLocal.fog)
    scene.fog = new THREE.FogExp2(palLocal.fog, room === 'cyber' ? 0.035 : 0.028)

    const camera = new THREE.PerspectiveCamera(75, 1, 0.05, 120)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = false
    mount.appendChild(renderer.domElement)
    const canvas = renderer.domElement
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.touchAction = 'none'
    canvas.style.cursor = 'crosshair'

    scene.add(new THREE.AmbientLight(0xffffff, room === 'white' ? 0.9 : 0.38))
    const hemi = new THREE.HemisphereLight(0xfff8f0, 0x1a1210, room === 'cyber' ? 0.3 : 0.5)
    scene.add(hemi)
    const key = new THREE.DirectionalLight(0xfff0dd, 0.5)
    key.position.set(b.cx + 6, wallH + 2, b.cy + 3)
    scene.add(key)
    if (room === 'cyber') {
      const neon = new THREE.PointLight(0x22d3ee, 1.4, 32)
      neon.position.set(b.cx, 3.4, b.cy)
      scene.add(neon)
    }

    // Floor with subtle grid feel
    const floorMat = new THREE.MeshStandardMaterial({
      color: palLocal.floor,
      roughness: 0.9,
      metalness: room === 'cyber' ? 0.35 : 0.06,
    })
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(b.w + 1, b.d + 1, 8, 8), floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(b.cx, 0, b.cy)
    scene.add(floor)

    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(b.w + 1, b.d + 1),
      new THREE.MeshStandardMaterial({
        color: palLocal.ceil,
        roughness: 1,
        side: THREE.DoubleSide,
      })
    )
    ceil.rotation.x = Math.PI / 2
    ceil.position.set(b.cx, wallH, b.cy)
    scene.add(ceil)

    // Thick walls (boxes) — sensation de volume
    const wallMat = new THREE.MeshStandardMaterial({
      color: palLocal.wall,
      roughness: 0.86,
      metalness: 0.04,
    })
    const thick = blueprint.wallThickness || 0.28
    for (const w of blueprint.walls.slice(0, 16)) {
      const g = wallGeom(w)
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(g.len, g.h, thick), wallMat)
      mesh.position.set(g.mx, g.h / 2, g.my)
      mesh.rotation.y = -g.angle
      scene.add(mesh)

      // plinthe
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(g.len, 0.12, thick + 0.04),
        new THREE.MeshStandardMaterial({ color: palLocal.trim, roughness: 0.7 })
      )
      base.position.set(g.mx, 0.06, g.my)
      base.rotation.y = -g.angle
      scene.add(base)
    }

    // Art on walls
    const hangs = hangPoints(blueprint, list.length)
    const arts: ArtMesh[] = []
    const loader = new THREE.TextureLoader()
    loader.crossOrigin = 'anonymous'
    let texActive = 0
    const texQueue: { url: string; mat: THREE.MeshStandardMaterial }[] = []

    const pumpTex = () => {
      while (texActive < TEX_CONCURRENT && texQueue.length) {
        const job = texQueue.shift()!
        texActive += 1
        loader.load(
          job.url,
          tex => {
            if (disposed) {
              tex.dispose()
              texActive -= 1
              return
            }
            tex.colorSpace = THREE.SRGBColorSpace
            tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
            tex.minFilter = THREE.LinearMipmapLinearFilter
            tex.generateMipmaps = true
            job.mat.map = tex
            job.mat.color.set(0xffffff)
            job.mat.emissiveIntensity = 0.05
            job.mat.needsUpdate = true
            texActive -= 1
            pumpTex()
          },
          undefined,
          () => {
            texActive -= 1
            pumpTex()
          }
        )
      }
    }

    list.forEach((f, i) => {
      const h =
        hangs[i] ||
        ({
          x: b.minX + ((i + 1) / (list.length + 1)) * b.w,
          z: b.minY + 0.35,
          facing: Math.PI / 2,
          hang: 1.55,
        } as const)

      const group = new THREE.Group()
      group.position.set(h.x, h.hang, h.z)
      group.rotation.y = h.facing

      const frameMat = new THREE.MeshStandardMaterial({
        color: palLocal.frame,
        roughness: 0.55,
        metalness: room === 'gold' ? 0.45 : 0.18,
      })
      // cadre épais
      const outer = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.42, 0.08), frameMat)
      group.add(outer)
      const inner = new THREE.Mesh(
        new THREE.BoxGeometry(0.98, 1.26, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.95 })
      )
      inner.position.z = 0.03
      group.add(inner)

      const artMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.65,
        metalness: 0,
        emissive: palLocal.emissive,
        emissiveIntensity: 0.12,
      })
      const canvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.16), artMat)
      canvasMesh.position.z = 0.055
      group.add(canvasMesh)

      if (f.image && /^https?:\/\//i.test(f.image)) {
        texQueue.push({ url: f.image, mat: artMat })
      }

      const spot = new THREE.SpotLight(0xfff5e8, 2.2, 6, Math.PI / 7, 0.4, 1)
      spot.position.set(0, 1.1, 1.2)
      spot.target = canvasMesh
      group.add(spot)
      group.add(spot.target)

      scene.add(group)
      arts.push({ mesh: group, frame: f, x: h.x, z: h.z })
    })
    artRef.current = arts
    pumpTex()

    // Spawn
    let px = b.cx
    let pz = b.cy
    let yaw = 0
    let pitch = 0
    const door = blueprint.openings?.find(o => o.type === 'door')
    if (door) {
      const wall = blueprint.walls.find(w => w.id === door.wallId)
      if (wall) {
        const g = wallGeom(wall)
        const t = (door.offset + door.width / 2) / Math.max(g.len, 0.01)
        const inwardX = b.cx - (wall.x1 + (wall.x2 - wall.x1) * t)
        const inwardZ = b.cy - (wall.y1 + (wall.y2 - wall.y1) * t)
        const il = Math.hypot(inwardX, inwardZ) || 1
        px = wall.x1 + (wall.x2 - wall.x1) * t + (inwardX / il) * 1.8
        pz = wall.y1 + (wall.y2 - wall.y1) * t + (inwardZ / il) * 1.8
        yaw = Math.atan2(inwardX / il, inwardZ / il)
      }
    }
    camera.position.set(px, EYE, pz)

    const resize = () => {
      if (!mount) return
      const w = mount.clientWidth || 640
      const h = mount.clientHeight || 400
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    // —— Controls GTA / FPS ——
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (
        ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e', 'escape', 'shift'].includes(
          k
        )
      ) {
        e.preventDefault()
        keys.current[k] = true
      }
      if (k === 'escape') {
        setInspect(null)
        if (document.pointerLockElement === canvas) document.exitPointerLock()
      }
      if (k === 'e' && nearestRef.current) setInspect(nearestRef.current)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false
    }

    const onPointerLockChange = () => {
      lockedRef.current = document.pointerLockElement === canvas
      setLocked(lockedRef.current)
      if (lockedRef.current) setHint(false)
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!lockedRef.current) return
      yaw -= e.movementX * LOOK_SENS
      pitch -= e.movementY * LOOK_SENS
      pitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, pitch))
    }

    // Touch look (drag on canvas)
    let touchId: number | null = null
    let lastTx = 0
    let lastTy = 0
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchId = e.touches[0].identifier
        lastTx = e.touches[0].clientX
        lastTy = e.touches[0].clientY
        setHint(false)
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i]
        if (t.identifier === touchId) {
          const dx = t.clientX - lastTx
          const dy = t.clientY - lastTy
          lastTx = t.clientX
          lastTy = t.clientY
          yaw -= dx * LOOK_SENS * 1.4
          pitch -= dy * LOOK_SENS * 1.4
          pitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, pitch))
          e.preventDefault()
        }
      }
    }
    const onTouchEnd = () => {
      touchId = null
    }

    const requestLock = () => {
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock?.()
      }
      setHint(false)
    }

    canvas.addEventListener('click', requestLock)
    document.addEventListener('pointerlockchange', onPointerLockChange)
    document.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)
    window.addEventListener('keydown', onKeyDown, { passive: false })
    window.addEventListener('keyup', onKeyUp)

    let raf = 0
    let lastHud = 0
    const clock = new THREE.Clock()

    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (disposed) return
      if (document.hidden) return

      const dt = Math.min(clock.getDelta(), 0.05)
      const k = { ...keys.current, ...hold.current }

      // A/D = strafe ; arrows left/right = turn if not locked
      if (!lockedRef.current) {
        if (k['arrowleft'] || k['q']) yaw += 1.9 * dt
        if (k['arrowright']) yaw -= 1.9 * dt
      }

      const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw))
      const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw))
      const sprint = k['shift']
      const speed = (sprint ? SPRINT : WALK) * dt

      let mx = 0
      let mz = 0
      if (k['w'] || k['arrowup']) {
        mx += forward.x * speed
        mz += forward.z * speed
      }
      if (k['s'] || k['arrowdown']) {
        mx -= forward.x * speed
        mz -= forward.z * speed
      }
      if (k['a']) {
        mx -= right.x * speed
        mz -= right.z * speed
      }
      if (k['d']) {
        mx += right.x * speed
        mz += right.z * speed
      }

      if (mx || mz) {
        const nx = px + mx
        const nz = pz + mz
        if (pointInBlueprintFloor(blueprint, nx, nz)) {
          px = nx
          pz = nz
        } else if (pointInBlueprintFloor(blueprint, nx, pz)) {
          px = nx
        } else if (pointInBlueprintFloor(blueprint, px, nz)) {
          pz = nz
        }
      }

      // bob léger
      const moving = Boolean(mx || mz)
      const bob = moving ? Math.sin(performance.now() * 0.012) * 0.025 : 0
      camera.position.set(px, EYE + bob, pz)
      camera.rotation.order = 'YXZ'
      camera.rotation.y = yaw
      camera.rotation.x = pitch

      const now = performance.now()
      if (now - lastHud > 100) {
        lastHud = now
        let best: FrameItem | null = null
        let bestD = 2.4
        for (const a of arts) {
          const d = Math.hypot(a.x - px, a.z - pz)
          if (d < bestD) {
            bestD = d
            best = a.frame
          }
        }
        nearestRef.current = best
        setNearTitle(
          best
            ? `${best.title} · E inspecter`
            : lockedRef.current
              ? 'WASD · Shift sprint · E œuvre'
              : 'Clic pour viser · WASD · pad'
        )
      }

      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(loop)
    setReady(true)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
      document.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('click', requestLock)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      if (document.pointerLockElement === canvas) document.exitPointerLock()
      ro.disconnect()
      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose()
          const m = obj.material
          if (Array.isArray(m))
            m.forEach(mm => {
              if ((mm as THREE.MeshStandardMaterial).map)
                (mm as THREE.MeshStandardMaterial).map!.dispose()
              mm.dispose()
            })
          else if (m) {
            const sm = m as THREE.MeshStandardMaterial
            if (sm.map) sm.map.dispose()
            m.dispose()
          }
        }
      })
      renderer.dispose()
      if (canvas.parentNode === mount) mount.removeChild(canvas)
    }
  }, [blueprint, list, pal, room])

  if (!list.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-950 min-h-[280px] flex items-center justify-center text-sm text-zinc-500">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
        <span>
          {roomName} · 3D · {area} m² · {list.length} tableaux
        </span>
        <span className="text-[10px] uppercase tracking-wider text-cyan-500/80">
          {locked ? 'Visée ON' : 'Jeu'}
        </span>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/60"
        style={{ height: 'min(78vh, 580px)' }}
      >
        <div ref={mountRef} className="absolute inset-0" />

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
            Chargement salle 3D…
          </div>
        )}

        {hint && ready && (
          <button
            type="button"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[2px] text-center px-6"
            onClick={() => setHint(false)}
          >
            <p className="text-lg font-semibold text-white tracking-tight">Entrer dans la salle</p>
            <p className="text-[13px] text-zinc-400 mt-2 max-w-xs leading-relaxed">
              Clic = viser (souris) · WASD = marcher · A/D latéral · Shift = courir · E = œuvre
            </p>
            <p className="text-[11px] text-zinc-600 mt-3">Mobile : glisser pour regarder · pad pour bouger</p>
          </button>
        )}

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-white/50 shadow" />
        </div>

        <div className="absolute top-2 left-2 right-2 flex justify-between gap-2 pointer-events-none z-10">
          <div className="rounded-lg px-2.5 py-1.5 text-[10px] backdrop-blur border bg-black/65 border-white/10 text-zinc-300 max-w-[80%] truncate">
            {nearTitle}
          </div>
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
          <div className="flex flex-col gap-2 items-end">
            <button
              type="button"
              className="rounded-full border border-white/20 bg-black/50 text-zinc-200 text-[11px] font-semibold px-3 py-2"
              onClick={() => (hold.current['shift'] = !hold.current['shift'])}
            >
              Sprint
            </button>
            <button
              type="button"
              className="rounded-full border border-cyan-400/40 bg-cyan-500/25 text-cyan-50 text-xs font-semibold px-4 py-2.5 active:scale-95 shadow-lg"
              onClick={() => nearestRef.current && setInspect(nearestRef.current)}
            >
              Inspecter
            </button>
          </div>
        </div>
      </div>

      {buyMsg && (
        <p className="text-[11px] text-zinc-400 border border-white/10 bg-white/[0.03] rounded-lg px-2.5 py-1.5">
          {buyMsg}
        </p>
      )}

      {inspect && (
        <div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-3"
          role="dialog"
          aria-modal
          onClick={() => setInspect(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0c0c14] p-4 shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex gap-3">
              <div className="w-32 shrink-0 aspect-[4/5] rounded-lg overflow-hidden border border-white/10 bg-black">
                {inspect.image ? (
                  <img src={inspect.image} alt="" className="w-full h-full object-cover" decoding="async" />
                ) : (
                  <div className="h-full flex items-center justify-center opacity-40">◈</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-white">{inspect.title}</p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {inspect.subtitle || inspect.collection}
                </p>
                {inspect.description && (
                  <p className="text-xs text-zinc-400 mt-2 line-clamp-5">{inspect.description}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {allowBuy && (
                <button type="button" className="btn-primary text-xs" onClick={onBuy}>
                  {marketLive ? 'Acheter…' : 'Intention d’achat'}
                </button>
              )}
              {inspect.href && (
                <a href={inspect.href} target="_blank" rel="noreferrer" className="btn-secondary text-xs">
                  Source ↗
                </a>
              )}
              <button type="button" className="btn-ghost text-xs" onClick={() => setInspect(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
