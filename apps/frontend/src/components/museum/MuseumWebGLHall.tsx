/**
 * Salle musée WebGL (Three.js) — plan RoomBlueprint + œuvres texturées.
 * Mouvement WASD / pad · collision sol · dispose propre.
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

const EYE = 1.65
const STEP = 0.11
const MAX_ART = 16
const TEX_CONCURRENT = 3

type Theme = 'cyber' | 'stone' | 'gold' | 'white' | 'dark'

const PALETTE: Record<
  Theme,
  { wall: number; floor: number; ceil: number; fog: number; frame: number; emissive: number }
> = {
  cyber: { wall: 0x1a1a32, floor: 0x080812, ceil: 0x0e0e1a, fog: 0x05050c, frame: 0x2a2a38, emissive: 0x0a2a32 },
  stone: { wall: 0x3a3228, floor: 0x1c1612, ceil: 0x2a221c, fog: 0x100e0c, frame: 0x4a3e30, emissive: 0x1a1208 },
  gold: { wall: 0x3a3018, floor: 0x18140c, ceil: 0x2a2418, fog: 0x100e0a, frame: 0x6a5a30, emissive: 0x2a2008 },
  white: { wall: 0xe0d8cc, floor: 0xb8b0a0, ceil: 0xf0ece4, fog: 0xa8a090, frame: 0xd8d0c4, emissive: 0x888070 },
  dark: { wall: 0x1a1410, floor: 0x0a0806, ceil: 0x12100c, fog: 0x060402, frame: 0x2a221c, emissive: 0x100c08 },
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

type ArtMesh = {
  mesh: THREE.Mesh
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

  const [nearTitle, setNearTitle] = useState('WASD · WebGL')
  const [inspect, setInspect] = useState<FrameItem | null>(null)
  const [buyMsg, setBuyMsg] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(palLocal.fog)
    scene.fog = new THREE.FogExp2(palLocal.fog, 0.045)

    const camera = new THREE.PerspectiveCamera(70, 1, 0.08, 80)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = false
    mount.appendChild(renderer.domElement)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.touchAction = 'none'

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, room === 'white' ? 0.85 : 0.45))
    const hemi = new THREE.HemisphereLight(0xfff5e6, 0x1a1410, room === 'cyber' ? 0.35 : 0.55)
    scene.add(hemi)
    const key = new THREE.DirectionalLight(0xfff0dd, 0.55)
    key.position.set(b.cx + 4, 8, b.cy + 2)
    scene.add(key)
    if (room === 'cyber') {
      const neon = new THREE.PointLight(0x22d3ee, 1.2, 28)
      neon.position.set(b.cx, 3.2, b.cy)
      scene.add(neon)
    }

    // Floor
    const floorGeo = new THREE.PlaneGeometry(b.w + 0.4, b.d + 0.4)
    const floorMat = new THREE.MeshStandardMaterial({
      color: palLocal.floor,
      roughness: 0.92,
      metalness: room === 'cyber' ? 0.25 : 0.05,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(b.cx, 0, b.cy)
    scene.add(floor)

    // Ceiling
    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(b.w + 0.4, b.d + 0.4),
      new THREE.MeshStandardMaterial({ color: palLocal.ceil, roughness: 1, side: THREE.DoubleSide })
    )
    ceil.rotation.x = Math.PI / 2
    ceil.position.set(b.cx, blueprint.wallHeight || 4, b.cy)
    scene.add(ceil)

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: palLocal.wall,
      roughness: 0.88,
      metalness: 0.04,
      side: THREE.DoubleSide,
    })
    for (const w of blueprint.walls.slice(0, 14)) {
      const g = wallGeom(w)
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(g.len, g.h), wallMat)
      mesh.position.set(g.mx, g.h / 2, g.my)
      mesh.rotation.y = -g.angle
      scene.add(mesh)
    }

    // Art frames
    const anchors = blueprint.artAnchors || []
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
            tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())
            tex.minFilter = THREE.LinearMipmapLinearFilter
            tex.generateMipmaps = true
            job.mat.map = tex
            job.mat.color.set(0xffffff)
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
      const a = anchors[i % Math.max(1, anchors.length)]
      let x = a?.x ?? b.minX + ((i + 1) / (list.length + 1)) * b.w
      let z = a?.y ?? b.minY + 0.4
      const facing = a?.facing ?? Math.PI / 2
      const hang = a?.height ?? 1.55

      const frameMat = new THREE.MeshStandardMaterial({
        color: palLocal.frame,
        roughness: 0.6,
        metalness: 0.15,
      })
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.35, 0.06), frameMat)
      frame.position.set(x, hang, z)
      frame.rotation.y = -facing
      scene.add(frame)

      const artMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.7,
        metalness: 0,
        emissive: palLocal.emissive,
        emissiveIntensity: 0.15,
      })
      const art = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 1.18), artMat)
      art.position.set(0, 0, 0.04)
      frame.add(art)

      if (f.image && /^https?:\/\//i.test(f.image)) {
        texQueue.push({ url: f.image, mat: artMat })
      }

      // Spot discret
      const spot = new THREE.PointLight(0xfff5e0, 0.35, 4)
      spot.position.set(0, 0.9, 0.3)
      frame.add(spot)

      arts.push({ mesh: frame, frame: f, x, z })
    })
    artRef.current = arts
    pumpTex()

    // Spawn near door or center
    let px = b.cx
    let pz = b.cy
    let yaw = 0
    const door = blueprint.openings?.find(o => o.type === 'door')
    if (door) {
      const wall = blueprint.walls.find(w => w.id === door.wallId)
      if (wall) {
        const g = wallGeom(wall)
        const t = (door.offset + door.width / 2) / g.len
        const nx = Math.cos(g.angle + Math.PI / 2) * 1.4
        const nz = Math.sin(g.angle + Math.PI / 2) * 1.4
        px = wall.x1 + (wall.x2 - wall.x1) * t + nx
        pz = wall.y1 + (wall.y2 - wall.y1) * t + nz
        yaw = g.angle + Math.PI / 2
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

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e', 'escape'].includes(k)) {
        e.preventDefault()
        keys.current[k] = true
      }
      if (k === 'escape') setInspect(null)
      if (k === 'e' && nearestRef.current) setInspect(nearestRef.current)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false
    }
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
      if (k['a'] || k['arrowleft']) yaw += 1.8 * dt
      if (k['d'] || k['arrowright']) yaw -= 1.8 * dt

      const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw))
      const speed = STEP * 60 * dt
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

      camera.position.set(px, EYE, pz)
      camera.rotation.order = 'YXZ'
      camera.rotation.y = yaw
      camera.rotation.x = 0

      const now = performance.now()
      if (now - lastHud > 120) {
        lastHud = now
        let best: FrameItem | null = null
        let bestD = 2.2
        for (const a of arts) {
          const d = Math.hypot(a.x - px, a.z - pz)
          if (d < bestD) {
            bestD = d
            best = a.frame
          }
        }
        nearestRef.current = best
        const title = best ? best.title : 'WASD · approchez une œuvre · E inspecter'
        setNearTitle(title)
      }

      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(loop)
    setReady(true)
    setError(null)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      ro.disconnect()
      // dispose
      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose()
          const m = obj.material
          if (Array.isArray(m)) m.forEach(mm => {
            if (mm.map) mm.map.dispose()
            mm.dispose()
          })
          else if (m) {
            if ((m as THREE.MeshStandardMaterial).map) {
              ;(m as THREE.MeshStandardMaterial).map!.dispose()
            }
            m.dispose()
          }
        }
      })
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement)
      }
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
          {roomName} · WebGL · {area} m² · {list.length} œuvres
        </span>
        <span className="text-[10px] uppercase tracking-wider text-cyan-500/80">Three.js</span>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-black"
        style={{ height: 'min(72vh, 540px)' }}
      >
        <div ref={mountRef} className="absolute inset-0" />

        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
            Initialisation WebGL…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-amber-200 px-4 text-center">
            {error}
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 border border-white/30 rounded-full" />
        </div>

        <div className="absolute top-2 left-2 right-2 flex justify-between gap-2 pointer-events-none">
          <div className="rounded-lg px-2.5 py-1.5 text-[10px] backdrop-blur border bg-black/60 border-white/10 text-zinc-300 max-w-[75%] truncate">
            {nearTitle}
          </div>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 z-10">
          <div className="grid grid-cols-3 gap-1 w-[7.5rem]">
            <span />
            <Pad label="↑" on={v => (hold.current['w'] = v)} />
            <span />
            <Pad label="←" on={v => (hold.current['a'] = v)} />
            <Pad label="↓" on={v => (hold.current['s'] = v)} />
            <Pad label="→" on={v => (hold.current['d'] = v)} />
          </div>
          <button
            type="button"
            className="rounded-full border border-cyan-400/40 bg-cyan-500/20 text-cyan-50 text-xs font-semibold px-4 py-2.5 active:scale-95 shadow-lg"
            onClick={() => nearestRef.current && setInspect(nearestRef.current)}
          >
            Inspecter
          </button>
        </div>
      </div>

      {buyMsg && (
        <p className="text-[11px] text-zinc-400 border border-white/10 bg-white/[0.03] rounded-lg px-2.5 py-1.5">
          {buyMsg}
        </p>
      )}

      {inspect && (
        <div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-3"
          role="dialog"
          aria-modal
          onClick={() => setInspect(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0c0c14] p-4 shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex gap-3">
              <div className="w-28 shrink-0 aspect-[4/5] rounded-lg overflow-hidden border border-white/10 bg-black">
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
                  <p className="text-xs text-zinc-400 mt-2 line-clamp-4">{inspect.description}</p>
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
