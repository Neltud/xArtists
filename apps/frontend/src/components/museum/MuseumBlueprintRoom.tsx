/**
 * Salle 3D réelle à partir d’un RoomBlueprint (murs + ancrages œuvres).
 * CSS perspective + translate3d — sans Three.js (build léger).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FrameItem } from './MuseumCorridor'
import type { RoomBlueprint, WallSeg } from '../../lib/roomBlueprint'
import { pointInBlueprintFloor } from '../../lib/loadBlueprint'
import { canListBuyNft } from '../../config/scStatus'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'
import { preloadImages } from '../../lib/imagePreload'

const STEP = 0.08
const EYE = 1.65
const SCALE = 48 // px par mètre plan

type Theme = 'cyber' | 'stone' | 'gold' | 'white' | 'dark'

const THEME: Record<Theme, { wall: string; floor: string; ceil: string; fog: string }> = {
  cyber: {
    wall: 'linear-gradient(180deg,#1e1e32,#0e0e18)',
    floor: '#0a0a12',
    ceil: '#12121c',
    fog: '#07070c',
  },
  stone: {
    wall: 'linear-gradient(180deg,#4a3e34,#1c1612)',
    floor: '#1a1410',
    ceil: '#2a221c',
    fog: '#100e0c',
  },
  gold: {
    wall: 'linear-gradient(180deg,#4a4028,#1a160e)',
    floor: '#18140c',
    ceil: '#2a2418',
    fog: '#100e0a',
  },
  white: {
    wall: 'linear-gradient(180deg,#f0ebe3,#c8c0b4)',
    floor: '#b0a898',
    ceil: '#f5f0e8',
    fog: '#a09888',
  },
  dark: {
    wall: 'linear-gradient(180deg,#221c18,#0c0a08)',
    floor: '#0a0806',
    ceil: '#141210',
    fog: '#080604',
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
  return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 }
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
  const list = useMemo(() => frames.slice(0, Math.max(8, blueprint.artAnchors?.length || 12)), [frames, blueprint])
  const anchors = blueprint.artAnchors || []

  const spawn = useMemo(() => {
    const door = blueprint.openings?.find(o => o.type === 'door')
    if (door) {
      const wall = blueprint.walls.find(w => w.id === door.wallId)
      if (wall) {
        const g = wallGeom(wall)
        const t = (door.offset + door.width / 2) / (g.len || 1)
        return {
          x: wall.x1 + (wall.x2 - wall.x1) * t,
          y: wall.y1 + (wall.y2 - wall.y1) * t,
          yaw: g.angle + Math.PI,
        }
      }
    }
    return { x: b.cx, y: b.cy, yaw: 0 }
  }, [blueprint, b])

  const [px, setPx] = useState(spawn.x)
  const [py, setPy] = useState(spawn.y)
  const [yaw, setYaw] = useState(spawn.yaw)
  const [inspect, setInspect] = useState<FrameItem | null>(null)
  const [buyMsg, setBuyMsg] = useState<string | null>(null)
  const [broken, setBroken] = useState<Record<string, boolean>>({})
  const keys = useRef<Record<string, boolean>>({})
  const hold = useRef<Record<string, boolean>>({})
  const raf = useRef(0)
  const { connected } = useWallet()
  const marketLive = canListBuyNft()

  useEffect(() => {
    setPx(spawn.x)
    setPy(spawn.y)
    setYaw(spawn.yaw)
  }, [spawn.x, spawn.y, spawn.yaw])

  useEffect(() => {
    preloadImages(
      list.map(f => f.image).filter(Boolean) as string[],
      8
    )
  }, [list])

  const tryMove = useCallback(
    (nx: number, ny: number) => {
      if (pointInBlueprintFloor(blueprint, nx, ny)) {
        setPx(nx)
        setPy(ny)
      }
    },
    [blueprint]
  )

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e', 'escape'].includes(k)) {
        e.preventDefault()
        keys.current[k] = true
      }
      if (k === 'escape') setInspect(null)
    }
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    const tick = () => {
      const k = { ...keys.current, ...hold.current }
      let dyaw = 0
      if (k['a'] || k['arrowleft']) dyaw += 0.035
      if (k['d'] || k['arrowright']) dyaw -= 0.035
      if (dyaw) setYaw(y => y + dyaw)

      setYaw(y => {
        const cos = Math.cos(y)
        const sin = Math.sin(y)
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
          // apply via functional px/py
          setPx(prevX => {
            setPy(prevY => {
              const nx = prevX + mx
              const ny = prevY + my
              if (pointInBlueprintFloor(blueprint, nx, ny)) return ny
              return prevY
            })
            const nx = prevX + mx
            const ny = py + my
            if (pointInBlueprintFloor(blueprint, nx, py)) return nx
            return prevX
          })
        }
        return y
      })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      cancelAnimationFrame(raf.current)
    }
  }, [blueprint, py, tryMove])

  const worldW = (b.maxX - b.minX) * SCALE
  const worldD = (b.maxY - b.minY) * SCALE
  const floorW = Math.max(worldW, 200)
  const floorD = Math.max(worldD, 200)

  // Caméra : monde centré sur joueur, tourné -yaw
  const camTransform = `translate(-50%, -50%) rotateX(88deg) rotateZ(${(-yaw * 180) / Math.PI}deg) translate(${-(px - b.cx) * SCALE}px, ${(py - b.cy) * SCALE}px)`

  const framed = useMemo(() => {
    return list.map((f, i) => {
      const a = anchors[i % Math.max(1, anchors.length)]
      if (!a) {
        // fallback along long axis
        const t = (i + 1) / (list.length + 1)
        return {
          frame: f,
          x: b.minX + (b.maxX - b.minX) * t,
          y: b.minY + 0.3,
          facing: Math.PI / 2,
        }
      }
      return { frame: f, x: a.x, y: a.y, facing: a.facing }
    })
  }, [list, anchors, b])

  const nearest = useMemo(() => {
    let best: (typeof framed)[0] | null = null
    let bestD = 1.2
    for (const it of framed) {
      const d = Math.hypot(it.x - px, it.y - py)
      if (d < bestD) {
        bestD = d
        best = it
      }
    }
    return best
  }, [framed, px, py])

  const onBuy = () => {
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
  }

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
          {blueprint.name} · {blueprint.walls.length} murs · {framed.length} œuvres
        </span>
        <span className="mono text-zinc-600 text-[10px]">
          {px.toFixed(1)}, {py.toFixed(1)}
        </span>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 select-none touch-none"
        style={{
          height: 'min(72vh, 560px)',
          background: theme.fog,
          perspective: '900px',
          perspectiveOrigin: '50% 42%',
        }}
        tabIndex={0}
        role="application"
        aria-label={`Salle 3D · ${blueprint.name}`}
      >
        {/* Horizon / plafond hint */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[38%]"
          style={{
            background: `linear-gradient(180deg, ${theme.ceil} 0%, transparent 100%)`,
            opacity: 0.85,
          }}
        />

        <div
          className="absolute left-1/2 top-[42%]"
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
              background: `
                radial-gradient(ellipse at center, rgba(255,255,255,0.04), transparent 60%),
                repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 48px),
                repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 48px),
                ${theme.floor}`,
              boxShadow: 'inset 0 0 80px rgba(0,0,0,0.45)',
            }}
          />

          {/* Murs */}
          {blueprint.walls.map(w => {
            const g = wallGeom(w)
            const left = (g.mx - b.cx) * SCALE - (g.len * SCALE) / 2
            const top = (g.my - b.cy) * SCALE
            return (
              <div
                key={w.id}
                className="absolute origin-bottom"
                style={{
                  left: left + floorW / 2,
                  top: top + floorD / 2,
                  width: g.len * SCALE,
                  height: g.h * SCALE * 0.55,
                  background: theme.wall,
                  transform: `translateY(-100%) rotateZ(${(g.angle * 180) / Math.PI}deg) rotateX(-90deg)`,
                  transformOrigin: 'center bottom',
                  backfaceVisibility: 'hidden',
                  boxShadow: 'inset 0 20px 40px rgba(0,0,0,0.25)',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              />
            )
          })}

          {/* Œuvres sur ancrages */}
          {framed.map((it, i) => {
            const left = (it.x - b.cx) * SCALE
            const top = (it.y - b.cy) * SCALE
            const isNear = nearest?.frame.id === it.frame.id
            const imgBroken = broken[it.frame.id]
            return (
              <button
                key={it.frame.id + i}
                type="button"
                className="absolute focus:outline-none"
                style={{
                  left: left + floorW / 2,
                  top: top + floorD / 2,
                  width: 56,
                  height: 72,
                  transform: `translate(-50%, -100%) translateY(-${EYE * 8}px) rotateZ(${(it.facing * 180) / Math.PI}deg) rotateX(-90deg)`,
                  transformOrigin: 'center bottom',
                  zIndex: isNear ? 20 : 10,
                }}
                onClick={() => setInspect(it.frame)}
              >
                <div
                  className={`h-full w-full border-2 p-1 ${
                    isNear ? 'border-cyan-400/70 shadow-[0_0_20px_rgba(34,211,238,0.35)]' : 'border-white/25'
                  }`}
                  style={{
                    background: 'linear-gradient(145deg,#2a2a32,#121218)',
                  }}
                >
                  <div className="h-full w-full bg-black overflow-hidden">
                    {it.frame.image && !imgBroken ? (
                      <img
                        src={it.frame.image}
                        alt={it.frame.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        onError={() => setBroken(b => ({ ...b, [it.frame.id]: true }))}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-[8px] text-zinc-500 px-0.5">
                        {it.frame.title.slice(0, 12)}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Crosshair */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 border border-white/30 rounded-full" />
        </div>

        <div className="absolute top-2 left-2 right-2 flex justify-between gap-2 pointer-events-none">
          <div className="rounded-lg px-2 py-1 text-[10px] backdrop-blur border bg-black/55 border-white/10 text-zinc-400 max-w-[70%] truncate">
            {nearest ? nearest.frame.title : 'WASD · approchez une œuvre'}
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
