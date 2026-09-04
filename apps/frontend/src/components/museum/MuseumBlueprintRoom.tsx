/**
 * Salle 3D depuis RoomBlueprint — murs, ouvertures, plinthes, œuvres, HUD détails.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FrameItem } from './MuseumCorridor'
import type { Opening, RoomBlueprint, WallSeg } from '../../lib/roomBlueprint'
import { blueprintAreaM2 } from '../../lib/roomBlueprint'
import { pointInBlueprintFloor } from '../../lib/loadBlueprint'
import { canListBuyNft } from '../../config/scStatus'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'
import { preloadImages } from '../../lib/imagePreload'

const STEP = 0.09
const SCALE = 52

type Theme = 'cyber' | 'stone' | 'gold' | 'white' | 'dark'

const THEME: Record<
  Theme,
  {
    wall: string
    wallEdge: string
    floor: string
    ceil: string
    fog: string
    base: string
    frame: string
    plaque: string
  }
> = {
  cyber: {
    wall: 'linear-gradient(180deg,#252540 0%,#12122a 55%,#0a0a16 100%)',
    wallEdge: 'rgba(34,211,238,0.15)',
    floor:
      'repeating-linear-gradient(0deg,rgba(34,211,238,0.06) 0 1px,transparent 1px 40px),repeating-linear-gradient(90deg,rgba(34,211,238,0.06) 0 1px,transparent 1px 40px),#080812',
    ceil: '#0e0e1a',
    fog: '#05050c',
    base: '#1a1a28',
    frame: 'linear-gradient(145deg,#3a3a48,#12121c)',
    plaque: 'rgba(0,0,0,0.75)',
  },
  stone: {
    wall: 'linear-gradient(180deg,#5a4e42 0%,#3a3228 40%,#1e1814 100%)',
    wallEdge: 'rgba(255,230,180,0.12)',
    floor:
      'repeating-linear-gradient(90deg,rgba(0,0,0,0.12) 0 1px,transparent 1px 64px),repeating-linear-gradient(0deg,rgba(0,0,0,0.08) 0 1px,transparent 1px 64px),#1c1612',
    ceil: '#2a221c',
    fog: '#100e0c',
    base: '#2a2218',
    frame: 'linear-gradient(145deg,#4a3e30,#1a1410)',
    plaque: 'rgba(20,14,10,0.85)',
  },
  gold: {
    wall: 'linear-gradient(180deg,#5a4a28 0%,#3a3018 45%,#1a140c 100%)',
    wallEdge: 'rgba(212,175,55,0.25)',
    floor:
      'radial-gradient(ellipse at 50% 50%,rgba(212,175,55,0.08),transparent 55%),#18140c',
    ceil: '#2a2418',
    fog: '#100e0a',
    base: '#2a2010',
    frame: 'linear-gradient(145deg,#6a5a30,#2a2010)',
    plaque: 'rgba(30,24,12,0.9)',
  },
  white: {
    wall: 'linear-gradient(180deg,#f4f0e8 0%,#e0d8cc 50%,#c8c0b4 100%)',
    wallEdge: 'rgba(0,0,0,0.08)',
    floor:
      'repeating-linear-gradient(90deg,rgba(0,0,0,0.04) 0 1px,transparent 1px 48px),#b8b0a0',
    ceil: '#f8f4ec',
    fog: '#a8a090',
    base: '#d0c8b8',
    frame: 'linear-gradient(145deg,#f0ece4,#c8c0b0)',
    plaque: 'rgba(255,255,255,0.9)',
  },
  dark: {
    wall: 'linear-gradient(180deg,#2a221c 0%,#14100c 55%,#080604 100%)',
    wallEdge: 'rgba(255,255,255,0.06)',
    floor: '#0a0806',
    ceil: '#12100c',
    fog: '#060402',
    base: '#1a1410',
    frame: 'linear-gradient(145deg,#2a221c,#0c0a08)',
    plaque: 'rgba(0,0,0,0.8)',
  },
}

function wallGeom(w: WallSeg) {
  const dx = w.x2 - w.x1
  const dy = w.y2 - w.y1
  const len = Math.hypot(dx, dy) || 0.01
  const angle = Math.atan2(dy, dx)
  const mx = (w.x1 + w.x2) / 2
  const my = (w.y1 + w.y2) / 2
  return { len, angle, mx, my, h: w.height || 3.5 }
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
    w: maxX - minX,
    d: maxY - minY,
  }
}

function openingOnWall(w: WallSeg, o: Opening) {
  const g = wallGeom(w)
  const t = (o.offset + o.width / 2) / g.len
  const x = w.x1 + (w.x2 - w.x1) * t
  const y = w.y1 + (w.y2 - w.y1) * t
  return { x, y, angle: g.angle, width: o.width, height: o.height, sill: o.sill, type: o.type }
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

export default function MuseumBlueprintRoom({
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
  const b = useMemo(() => bounds(blueprint), [blueprint])
  const theme = THEME[room] || THEME.stone
  const area = useMemo(() => Math.round(blueprintAreaM2(blueprint)), [blueprint])
  const list = useMemo(
    () => frames.slice(0, Math.max(12, blueprint.artAnchors?.length || 16)),
    [frames, blueprint]
  )
  const anchors = blueprint.artAnchors || []
  const openings = blueprint.openings || []
  const doors = openings.filter(o => o.type === 'door').length
  const windows = openings.filter(o => o.type === 'window').length
  const roomName = blueprint.rooms?.[0]?.name || blueprint.name
  const details = blueprint.details

  const spawn = useMemo(() => {
    const door = openings.find(o => o.type === 'door')
    if (door) {
      const wall = blueprint.walls.find(w => w.id === door.wallId)
      if (wall) {
        const g = wallGeom(wall)
        const t = (door.offset + door.width / 2) / (g.len || 1)
        const nx = Math.cos(g.angle + Math.PI / 2) * 1.2
        const ny = Math.sin(g.angle + Math.PI / 2) * 1.2
        return {
          x: wall.x1 + (wall.x2 - wall.x1) * t + nx,
          y: wall.y1 + (wall.y2 - wall.y1) * t + ny,
          yaw: g.angle + Math.PI / 2,
        }
      }
    }
    return { x: b.cx, y: b.cy, yaw: 0 }
  }, [blueprint, openings, b])

  const [px, setPx] = useState(spawn.x)
  const [py, setPy] = useState(spawn.y)
  const [yaw, setYaw] = useState(spawn.yaw)
  const [inspect, setInspect] = useState<FrameItem | null>(null)
  const [buyMsg, setBuyMsg] = useState<string | null>(null)
  const [broken, setBroken] = useState<Record<string, boolean>>({})
  const [showDetails, setShowDetails] = useState(true)
  const hold = useRef<Record<string, boolean>>({})
  const keys = useRef<Record<string, boolean>>({})
  const pos = useRef({ x: spawn.x, y: spawn.y, yaw: spawn.yaw })
  const raf = useRef(0)
  const { connected } = useWallet()
  const marketLive = canListBuyNft()

  useEffect(() => {
    pos.current = { x: spawn.x, y: spawn.y, yaw: spawn.yaw }
    setPx(spawn.x)
    setPy(spawn.y)
    setYaw(spawn.yaw)
  }, [spawn.x, spawn.y, spawn.yaw])

  useEffect(() => {
    preloadImages(list.map(f => f.image).filter(Boolean) as string[], 10)
  }, [list])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (
        ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e', 'escape', 'i'].includes(
          k
        )
      ) {
        e.preventDefault()
        keys.current[k] = true
      }
      if (k === 'escape') setInspect(null)
      if (k === 'i') setShowDetails(s => !s)
    }
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)

    const tick = () => {
      const k = { ...keys.current, ...hold.current }
      let { x, y, yaw: y0 } = pos.current
      if (k['a'] || k['arrowleft']) y0 += 0.04
      if (k['d'] || k['arrowright']) y0 -= 0.04
      const cos = Math.cos(y0)
      const sin = Math.sin(y0)
      let mx = 0
      let my = 0
      if (k['w'] || k['arrowup']) {
        mx += cos * STEP
        my += sin * STEP
      }
      if (k['s'] || k['arrowdown']) {
        mx -= cos * STEP
        my -= sin * STEP
      }
      if (mx || my) {
        const nx = x + mx
        const ny = y + my
        if (pointInBlueprintFloor(blueprint, nx, ny)) {
          x = nx
          y = ny
        } else if (pointInBlueprintFloor(blueprint, nx, y)) {
          x = nx
        } else if (pointInBlueprintFloor(blueprint, x, ny)) {
          y = ny
        }
      }
      pos.current = { x, y, yaw: y0 }
      setPx(x)
      setPy(y)
      setYaw(y0)
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      cancelAnimationFrame(raf.current)
    }
  }, [blueprint])

  const floorW = Math.max(b.w * SCALE, 220)
  const floorD = Math.max(b.d * SCALE, 220)

  const camTransform = `translate(-50%, -50%) rotateX(86deg) rotateZ(${(-yaw * 180) / Math.PI}deg) translate(${-(px - b.cx) * SCALE}px, ${(py - b.cy) * SCALE}px)`

  const framed = useMemo(() => {
    return list.map((f, i) => {
      const a = anchors[i % Math.max(1, anchors.length)]
      if (!a) {
        const t = (i + 1) / (list.length + 1)
        return {
          frame: f,
          x: b.minX + b.w * t,
          y: b.minY + 0.35,
          facing: Math.PI / 2,
          height: 1.55,
          plaque: undefined as string | undefined,
        }
      }
      return {
        frame: f,
        x: a.x,
        y: a.y,
        facing: a.facing,
        height: a.height ?? 1.55,
        plaque: a.plaque,
      }
    })
  }, [list, anchors, b])

  const nearest = useMemo(() => {
    let best: (typeof framed)[0] | null = null
    let bestD = 1.35
    for (const it of framed) {
      const d = Math.hypot(it.x - px, it.y - py)
      if (d < bestD) {
        bestD = d
        best = it
      }
    }
    return best
  }, [framed, px, py])

  const onBuy = useCallback(() => {
    if (!allowBuy) return
    const f = inspect || nearest?.frame
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
  }, [allowBuy, inspect, nearest, connected, marketLive])

  if (!list.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-950 min-h-[280px] flex items-center justify-center text-sm text-zinc-500">
        {emptyLabel}
      </div>
    )
  }

  const lightText = room === 'white'

  return (
    <div className="space-y-2">
      {/* Fiche salle */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-white">{roomName}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {blueprint.description || 'Plan 3D'}
            {details?.era ? ` · ${details.era}` : ''}
            {details?.city ? ` · ${details.city}` : ''}
          </p>
        </div>
        <button
          type="button"
          className="text-[10px] uppercase tracking-wider text-zinc-500 border border-white/10 rounded-full px-2.5 py-1 hover:text-zinc-300"
          onClick={() => setShowDetails(s => !s)}
        >
          {showDetails ? 'Masquer détails' : 'Détails salle'} · I
        </button>
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
            <p className="text-zinc-600 uppercase tracking-wider text-[9px]">Surface</p>
            <p className="text-zinc-200 tabular-nums mt-0.5">{area} m²</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
            <p className="text-zinc-600 uppercase tracking-wider text-[9px]">Murs</p>
            <p className="text-zinc-200 mt-0.5">
              {blueprint.walls.length} · h {blueprint.wallHeight} m
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
            <p className="text-zinc-600 uppercase tracking-wider text-[9px]">Ouvertures</p>
            <p className="text-zinc-200 mt-0.5">
              {doors} portes · {windows} fenêtres
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
            <p className="text-zinc-600 uppercase tracking-wider text-[9px]">Œuvres</p>
            <p className="text-zinc-200 mt-0.5">
              {framed.length} · {anchors.length} ancrages
            </p>
          </div>
          {(details?.lighting || details?.ambient) && (
            <div className="col-span-2 sm:col-span-4 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-zinc-400">
              {details.lighting ? (
                <span className="text-zinc-300">Éclairage {details.lighting}</span>
              ) : null}
              {details.ambient ? (
                <span className="ml-2">— {details.ambient}</span>
              ) : null}
            </div>
          )}
        </div>
      )}

      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 select-none touch-none"
        style={{
          height: 'min(72vh, 560px)',
          background: theme.fog,
          perspective: '920px',
          perspectiveOrigin: '50% 40%',
        }}
        tabIndex={0}
        role="application"
        aria-label={`Salle 3D · ${blueprint.name}`}
      >
        {/* Plafond / lumière haute */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[36%]"
          style={{
            background: `linear-gradient(180deg, ${theme.ceil} 0%, transparent 100%)`,
            opacity: 0.9,
          }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-[18%] -translate-x-1/2 w-[55%] h-16 rounded-full blur-3xl opacity-30"
          style={{
            background:
              room === 'cyber'
                ? 'radial-gradient(circle, #22d3ee, transparent 70%)'
                : room === 'gold'
                  ? 'radial-gradient(circle, #d4af37, transparent 70%)'
                  : 'radial-gradient(circle, #fff8e8, transparent 70%)',
          }}
        />

        <div
          className="absolute left-1/2 top-[40%]"
          style={{
            width: floorW,
            height: floorD,
            transformStyle: 'preserve-3d',
            transform: camTransform,
          }}
        >
          {/* Sol */}
          <div
            className="absolute inset-0"
            style={{
              background: theme.floor,
              boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)',
            }}
          />

          {/* Marquage central / axis */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              width: Math.min(floorW * 0.35, 120),
              height: 2,
              background: 'rgba(255,255,255,0.06)',
            }}
          />

          {/* Murs + plinthes */}
          {blueprint.walls.map(w => {
            const g = wallGeom(w)
            const left = (g.mx - b.cx) * SCALE - (g.len * SCALE) / 2
            const top = (g.my - b.cy) * SCALE
            const wallH = g.h * SCALE * 0.52
            return (
              <div key={w.id}>
                <div
                  className="absolute origin-bottom"
                  style={{
                    left: left + floorW / 2,
                    top: top + floorD / 2,
                    width: g.len * SCALE,
                    height: wallH,
                    background: theme.wall,
                    transform: `translateY(-100%) rotateZ(${(g.angle * 180) / Math.PI}deg) rotateX(-90deg)`,
                    transformOrigin: 'center bottom',
                    backfaceVisibility: 'hidden',
                    boxShadow: `inset 0 0 0 1px ${theme.wallEdge}, inset 0 24px 48px rgba(0,0,0,0.28)`,
                    borderTop: '2px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Corniche */}
                  <div
                    className="absolute left-0 right-0 top-0 h-[6%]"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  />
                  {/* Plinthe */}
                  <div
                    className="absolute left-0 right-0 bottom-0 h-[8%]"
                    style={{ background: theme.base, boxShadow: '0 -2px 0 rgba(0,0,0,0.25)' }}
                  />
                </div>
              </div>
            )
          })}

          {/* Portes / fenêtres */}
          {openings.map(o => {
            const wall = blueprint.walls.find(w => w.id === o.wallId)
            if (!wall) return null
            const op = openingOnWall(wall, o)
            const left = (op.x - b.cx) * SCALE
            const top = (op.y - b.cy) * SCALE
            const isDoor = o.type === 'door'
            return (
              <div
                key={o.id}
                className="absolute pointer-events-none"
                style={{
                  left: left + floorW / 2,
                  top: top + floorD / 2,
                  width: op.width * SCALE * 0.95,
                  height: (isDoor ? op.height : op.height) * SCALE * 0.45,
                  transform: `translate(-50%, -100%) translateY(-${op.sill * SCALE * 0.35}px) rotateZ(${(op.angle * 180) / Math.PI}deg) rotateX(-90deg)`,
                  transformOrigin: 'center bottom',
                  background: isDoor
                    ? 'linear-gradient(180deg, rgba(20,16,12,0.95), rgba(40,32,24,0.85))'
                    : 'linear-gradient(180deg, rgba(140,190,230,0.35), rgba(80,120,160,0.2))',
                  border: isDoor
                    ? '2px solid rgba(180,150,100,0.35)'
                    : '1px solid rgba(180,220,255,0.25)',
                  boxShadow: isDoor
                    ? 'inset 0 0 20px rgba(0,0,0,0.5)'
                    : 'inset 0 0 30px rgba(120,180,220,0.15)',
                }}
              >
                {isDoor ? (
                  <div
                    className="absolute right-[12%] top-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ background: 'rgba(212,175,55,0.7)' }}
                  />
                ) : (
                  <div
                    className="absolute inset-[8%] grid grid-cols-2 gap-px opacity-40"
                    style={{ background: 'rgba(255,255,255,0.15)' }}
                  >
                    <span className="bg-transparent" />
                    <span className="bg-transparent" />
                    <span className="bg-transparent" />
                    <span className="bg-transparent" />
                  </div>
                )}
              </div>
            )
          })}

          {/* Œuvres */}
          {framed.map((it, i) => {
            const left = (it.x - b.cx) * SCALE
            const top = (it.y - b.cy) * SCALE
            const isNear = nearest?.frame.id === it.frame.id
            const imgBroken = broken[it.frame.id]
            const lift = it.height * SCALE * 0.28
            return (
              <button
                key={it.frame.id + '-' + i}
                type="button"
                className="absolute focus:outline-none"
                style={{
                  left: left + floorW / 2,
                  top: top + floorD / 2,
                  width: isNear ? 64 : 54,
                  height: isNear ? 82 : 70,
                  transform: `translate(-50%, -100%) translateY(-${lift}px) rotateZ(${(it.facing * 180) / Math.PI}deg) rotateX(-90deg)`,
                  transformOrigin: 'center bottom',
                  zIndex: isNear ? 30 : 12,
                }}
                onClick={() => setInspect(it.frame)}
              >
                {/* Spot au-dessus */}
                {isNear && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-3 rounded-full blur-md opacity-70 pointer-events-none"
                    style={{ background: 'rgba(255,248,220,0.55)' }}
                  />
                )}
                <div
                  className={`h-full w-full border-[3px] p-[5%] ${
                    isNear
                      ? 'border-cyan-400/65 shadow-[0_0_24px_rgba(34,211,238,0.4)]'
                      : 'border-amber-900/40'
                  }`}
                  style={{ background: theme.frame }}
                >
                  <div className="h-full w-full bg-black overflow-hidden ring-1 ring-black/40">
                    {it.frame.image && !imgBroken ? (
                      <img
                        src={it.frame.image}
                        alt={it.frame.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        onError={() => setBroken(br => ({ ...br, [it.frame.id]: true }))}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-[8px] text-zinc-500 px-0.5">
                        {it.frame.title.slice(0, 14)}
                      </div>
                    )}
                  </div>
                </div>
                {/* Plaque titre sous cadre */}
                {isNear && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-1.5 py-0.5 text-[7px] whitespace-nowrap max-w-[90px] truncate rounded"
                    style={{
                      background: theme.plaque,
                      color: lightText ? '#222' : '#ddd',
                    }}
                  >
                    {it.plaque || it.frame.title}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 border border-white/25 rounded-full" />
        </div>

        <div className="absolute top-2 left-2 right-2 flex justify-between gap-2 pointer-events-none">
          <div
            className={`rounded-lg px-2.5 py-1.5 text-[10px] backdrop-blur border max-w-[72%] ${
              lightText
                ? 'bg-white/75 border-stone-300 text-stone-700'
                : 'bg-black/60 border-white/10 text-zinc-300'
            }`}
          >
            {nearest ? (
              <>
                <span className="font-medium text-white">{nearest.frame.title}</span>
                {nearest.frame.subtitle ? (
                  <span className="text-zinc-500"> · {nearest.frame.subtitle}</span>
                ) : null}
              </>
            ) : (
              'WASD · approchez une œuvre · I détails'
            )}
          </div>
          <div className="text-[9px] font-mono text-zinc-600 self-center">
            {px.toFixed(1)},{py.toFixed(1)}
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
            className="rounded-full border border-cyan-400/40 bg-cyan-500/20 text-cyan-50 text-xs font-semibold px-4 py-2.5 active:scale-95 shadow-lg disabled:opacity-40"
            disabled={!nearest}
            onClick={() => nearest && setInspect(nearest.frame)}
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
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4"
          role="dialog"
          aria-modal
          onClick={() => setInspect(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0c0c14] p-4 shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex gap-3">
              <div className="w-24 sm:w-36 shrink-0 aspect-[4/5] rounded-lg overflow-hidden border border-white/10 bg-black">
                {inspect.image && !broken[inspect.id] ? (
                  <img src={inspect.image} alt="" className="w-full h-full object-cover" />
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
                <p className="text-[10px] text-zinc-600 mt-2">
                  Salle · {roomName} · {blueprint.name}
                </p>
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
