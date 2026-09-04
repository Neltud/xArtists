/**
 * Salle 3D détaillée depuis RoomBlueprint : murs, plinthes, ouvertures, sol, plafonds, ancrages.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FrameItem } from './MuseumCorridor'
import type { Opening, RoomBlueprint, WallSeg } from '../../lib/roomBlueprint'
import { pointInBlueprintFloor } from '../../lib/loadBlueprint'
import { canListBuyNft } from '../../config/scStatus'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'
import { preloadImages } from '../../lib/imagePreload'

const STEP = 0.09
const TURN = 0.04
const SCALE = 52

type Theme = 'cyber' | 'stone' | 'gold' | 'white' | 'dark'

type ThemePack = {
  wall: string
  wallTop: string
  floor: string
  ceil: string
  fog: string
  plinth: string
  molding: string
  glass: string
  light: string
  text: string
}

const THEME: Record<Theme, ThemePack> = {
  cyber: {
    wall: 'linear-gradient(180deg,#22223a 0%,#14142a 40%,#0c0c18 100%)',
    wallTop: '#2a2a48',
    floor:
      'repeating-linear-gradient(0deg,rgba(34,211,238,0.06) 0 1px,transparent 1px 40px),repeating-linear-gradient(90deg,rgba(34,211,238,0.06) 0 1px,transparent 1px 40px),#080810',
    ceil: 'linear-gradient(180deg,#1a1a2e,#0a0a14)',
    fog: '#06060c',
    plinth: '#0a0a14',
    molding: 'rgba(34,211,238,0.35)',
    glass: 'rgba(34,211,238,0.18)',
    light: 'rgba(34,211,238,0.45)',
    text: '#a5f3fc',
  },
  stone: {
    wall: 'linear-gradient(180deg,#5a4e42 0%,#3a3228 45%,#221c16 100%)',
    wallTop: '#6a5e50',
    floor:
      'repeating-linear-gradient(45deg,rgba(255,255,255,0.03) 0 2px,transparent 2px 28px),#1a1410',
    ceil: 'linear-gradient(180deg,#3a3228,#1c1612)',
    fog: '#100c0a',
    plinth: '#14100c',
    molding: 'rgba(212,175,120,0.4)',
    glass: 'rgba(200,220,255,0.2)',
    light: 'rgba(255,230,180,0.35)',
    text: '#e8dcc8',
  },
  gold: {
    wall: 'linear-gradient(180deg,#5a4a28 0%,#3a3018 50%,#1c160c 100%)',
    wallTop: '#7a6a38',
    floor:
      'radial-gradient(ellipse at center,rgba(212,175,55,0.08),transparent 55%),#18140c',
    ceil: 'linear-gradient(180deg,#4a3c20,#1a140c)',
    fog: '#100c08',
    plinth: '#120e08',
    molding: 'rgba(212,175,55,0.55)',
    glass: 'rgba(255,240,200,0.18)',
    light: 'rgba(255,210,120,0.4)',
    text: '#f5e6c0',
  },
  white: {
    wall: 'linear-gradient(180deg,#f5f0e8 0%,#e0d8cc 50%,#c8c0b4 100%)',
    wallTop: '#fff',
    floor:
      'repeating-linear-gradient(90deg,rgba(0,0,0,0.04) 0 1px,transparent 1px 48px),#b8b0a4',
    ceil: 'linear-gradient(180deg,#faf6f0,#e8e0d4)',
    fog: '#a8a098',
    plinth: '#9a9288',
    molding: 'rgba(80,70,60,0.25)',
    glass: 'rgba(180,210,255,0.25)',
    light: 'rgba(255,255,255,0.5)',
    text: '#3a342c',
  },
  dark: {
    wall: 'linear-gradient(180deg,#2a241e 0%,#161210 50%,#0a0806 100%)',
    wallTop: '#3a3228',
    floor: 'radial-gradient(ellipse at center,rgba(255,255,255,0.03),transparent 50%),#0c0a08',
    ceil: 'linear-gradient(180deg,#1c1814,#080604)',
    fog: '#060404',
    plinth: '#080604',
    molding: 'rgba(180,160,140,0.25)',
    glass: 'rgba(160,180,220,0.15)',
    light: 'rgba(255,220,180,0.3)',
    text: '#d4c8b8',
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

function floorLabel(floor?: string) {
  if (floor === 'stone') return 'Pierre'
  if (floor === 'wood') return 'Parquet'
  if (floor === 'marble') return 'Marbre'
  if (floor === 'concrete') return 'Béton'
  if (floor === 'cyber') return 'Dalle tech'
  return floor || 'Sol'
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
  const list = useMemo(
    () => frames.slice(0, Math.max(8, blueprint.artAnchors?.length || 12)),
    [frames, blueprint]
  )
  const anchors = blueprint.artAnchors || []
  const openings = blueprint.openings || []
  const mainRoom = blueprint.rooms?.[0]

  const spawn = useMemo(() => {
    const door = openings.find(o => o.type === 'door')
    if (door) {
      const wall = blueprint.walls.find(w => w.id === door.wallId)
      if (wall) {
        const g = wallGeom(wall)
        const t = (door.offset + door.width / 2) / g.len
        const nx = wall.x1 + (wall.x2 - wall.x1) * t
        const ny = wall.y1 + (wall.y2 - wall.y1) * t
        // step inside along wall normal
        const inward = g.angle + Math.PI / 2
        return {
          x: nx + Math.cos(inward) * 1.2,
          y: ny + Math.sin(inward) * 1.2,
          yaw: g.angle + Math.PI,
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
  const [showDetails, setShowDetails] = useState(false)
  const keys = useRef<Record<string, boolean>>({})
  const hold = useRef<Record<string, boolean>>({})
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
        ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e', 'escape'].includes(
          k
        )
      ) {
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
      let { x, y, yaw: y0 } = pos.current
      if (k['a'] || k['arrowleft']) y0 += TURN
      if (k['d'] || k['arrowright']) y0 -= TURN
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
          y: b.minY + 0.4,
          facing: Math.PI / 2,
          hangH: 1.55,
        }
      }
      return { frame: f, x: a.x, y: a.y, facing: a.facing, hangH: a.height ?? 1.55 }
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

  const doorCount = openings.filter(o => o.type === 'door').length
  const winCount = openings.filter(o => o.type === 'window').length
  const areaM2 = Math.round(b.w * b.d)

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
      {/* Bandeau détails salle */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-2 text-zinc-400">
          <span className="font-medium text-zinc-200">{blueprint.name}</span>
          <span className="text-zinc-600">·</span>
          <span>
            {b.w.toFixed(0)}×{b.d.toFixed(0)} m · ~{areaM2} m²
          </span>
          <span className="text-zinc-600">·</span>
          <span>
            {blueprint.walls.length} murs · {doorCount} portes · {winCount} fenêtres
          </span>
          {mainRoom?.floor && (
            <>
              <span className="text-zinc-600">·</span>
              <span>{floorLabel(mainRoom.floor)}</span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowDetails(v => !v)}
          className="text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300 border border-white/10 rounded-full px-2.5 py-0.5"
        >
          {showDetails ? 'Masquer' : 'Détails'}
        </button>
      </div>

      {showDetails && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[11px] text-zinc-400 space-y-1.5">
          {blueprint.description && <p className="text-zinc-300">{blueprint.description}</p>}
          <p>
            Hauteur murs : <span className="text-zinc-200">{blueprint.wallHeight} m</span>
            {' · '}
            Épaisseur : <span className="text-zinc-200">{blueprint.wallThickness} m</span>
          </p>
          <p>
            Ancrages œuvres : <span className="text-zinc-200">{anchors.length}</span>
            {' · '}
            Affichées : <span className="text-zinc-200">{framed.length}</span>
          </p>
          {mainRoom && (
            <p>
              Zone : <span className="text-zinc-200">{mainRoom.name}</span>
              {mainRoom.floor ? ` · sol ${floorLabel(mainRoom.floor)}` : ''}
            </p>
          )}
          {openings.length > 0 && (
            <ul className="flex flex-wrap gap-1.5 pt-1">
              {openings.map((o: Opening) => (
                <li
                  key={o.id}
                  className="rounded-md border border-white/10 bg-black/30 px-1.5 py-0.5 text-[10px] text-zinc-500"
                >
                  {o.type === 'door' ? 'Porte' : 'Fenêtre'} {o.width.toFixed(1)}×
                  {o.height.toFixed(1)} m
                </li>
              ))}
            </ul>
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
        {/* Ciel / plafond ambiant */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[36%]"
          style={{
            background: theme.ceil,
            opacity: 0.9,
          }}
        />
        {/* Soft light from windows */}
        {winCount > 0 && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 70% 40% at 50% 20%, ${theme.light}, transparent 70%)`,
              opacity: 0.35,
            }}
          />
        )}

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

          {/* Murs + plinthe + corniche */}
          {blueprint.walls.map(w => {
            const g = wallGeom(w)
            const left = (g.mx - b.cx) * SCALE - (g.len * SCALE) / 2
            const top = (g.my - b.cy) * SCALE
            const wallH = g.h * SCALE * 0.52
            const wallOpenings = openings.filter(o => o.wallId === w.id)
            return (
              <div
                key={w.id}
                className="absolute origin-bottom"
                style={{
                  left: left + floorW / 2,
                  top: top + floorD / 2,
                  width: g.len * SCALE,
                  height: wallH,
                  transform: `translateY(-100%) rotateZ(${(g.angle * 180) / Math.PI}deg) rotateX(-90deg)`,
                  transformOrigin: 'center bottom',
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                }}
              >
                {/* Face mur */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: theme.wall,
                    boxShadow: 'inset 0 30px 50px rgba(0,0,0,0.2)',
                    borderTop: `2px solid ${theme.molding}`,
                  }}
                />
                {/* Corniche haute */}
                <div
                  className="absolute left-0 right-0 top-0 h-[6%]"
                  style={{
                    background: `linear-gradient(180deg, ${theme.wallTop}, transparent)`,
                    opacity: 0.9,
                  }}
                />
                {/* Plinthe */}
                <div
                  className="absolute left-0 right-0 bottom-0 h-[8%]"
                  style={{
                    background: theme.plinth,
                    borderTop: `1px solid ${theme.molding}`,
                  }}
                />
                {/* Ouvertures (portes / fenêtres) */}
                {wallOpenings.map(o => {
                  const leftPct = (o.offset / g.len) * 100
                  const widthPct = (o.width / g.len) * 100
                  const bottomPct =
                    o.type === 'door' ? 0 : Math.min(40, (o.sill / g.h) * 100)
                  const heightPct = Math.min(85, (o.height / g.h) * 100)
                  return (
                    <div
                      key={o.id}
                      className="absolute"
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        bottom: `${bottomPct}%`,
                        height: `${heightPct}%`,
                        background:
                          o.type === 'window'
                            ? `linear-gradient(180deg, ${theme.glass}, rgba(255,255,255,0.05))`
                            : 'linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.75))',
                        boxShadow:
                          o.type === 'window'
                            ? `0 0 24px ${theme.light}, inset 0 0 12px rgba(255,255,255,0.15)`
                            : 'inset 0 0 20px rgba(0,0,0,0.6)',
                        border: `1px solid ${theme.molding}`,
                      }}
                      title={o.type === 'door' ? 'Porte' : 'Fenêtre'}
                    >
                      {o.type === 'window' && (
                        <div
                          className="absolute inset-[8%] grid grid-cols-2 gap-px opacity-40"
                          style={{ background: 'rgba(255,255,255,0.12)' }}
                        >
                          <div className="bg-transparent" />
                          <div className="bg-transparent" />
                          <div className="bg-transparent" />
                          <div className="bg-transparent" />
                        </div>
                      )}
                      {o.type === 'door' && (
                        <div
                          className="absolute right-[12%] top-1/2 w-1.5 h-1.5 rounded-full"
                          style={{ background: theme.molding }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}

          {/* Œuvres + spots */}
          {framed.map((it, i) => {
            const left = (it.x - b.cx) * SCALE
            const top = (it.y - b.cy) * SCALE
            const isNear = nearest?.frame.id === it.frame.id
            const imgBroken = broken[it.frame.id]
            return (
              <div key={it.frame.id + i} className="absolute" style={{ left: left + floorW / 2, top: top + floorD / 2 }}>
                {/* Spot au sol */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    width: 40,
                    height: 40,
                    transform: 'translate(-50%, -50%)',
                    background: `radial-gradient(circle, ${theme.light}, transparent 70%)`,
                    opacity: isNear ? 0.55 : 0.2,
                  }}
                />
                <button
                  type="button"
                  className="absolute focus:outline-none"
                  style={{
                    width: isNear ? 64 : 56,
                    height: isNear ? 80 : 70,
                    transform: `translate(-50%, -100%) translateY(-${it.hangH * 10}px) rotateZ(${(it.facing * 180) / Math.PI}deg) rotateX(-90deg)`,
                    transformOrigin: 'center bottom',
                    zIndex: isNear ? 20 : 10,
                  }}
                  onClick={() => setInspect(it.frame)}
                >
                  <div
                    className={`h-full w-full border-[3px] p-[4px] transition-shadow ${
                      isNear
                        ? 'border-cyan-400/80 shadow-[0_0_28px_rgba(34,211,238,0.4)]'
                        : 'border-amber-100/25'
                    }`}
                    style={{
                      background: 'linear-gradient(145deg,#3a342c,#1a1612)',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
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
                          onError={() => setBroken(prev => ({ ...prev, [it.frame.id]: true }))}
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-[8px] text-zinc-500 px-0.5">
                          {it.frame.title.slice(0, 14)}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            )
          })}
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 border border-white/25 rounded-full" />
        </div>

        <div className="absolute top-2 left-2 right-2 flex justify-between gap-2 pointer-events-none">
          <div className="rounded-lg px-2.5 py-1.5 text-[10px] backdrop-blur border bg-black/55 border-white/10 text-zinc-300 max-w-[72%] truncate">
            {nearest ? nearest.frame.title : 'Avancez vers une œuvre · WASD'}
          </div>
          <div className="rounded-lg px-2 py-1 text-[10px] mono bg-black/40 border border-white/10 text-zinc-500">
            {px.toFixed(1)} · {py.toFixed(1)}
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
