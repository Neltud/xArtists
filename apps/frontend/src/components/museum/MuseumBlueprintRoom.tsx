/**
 * Salle 3D optimisée — caméra via refs (pas de setState/frame),
 * culling distance, textures en file limitée, pause si hors écran.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FrameItem } from './MuseumCorridor'
import type { Opening, RoomBlueprint, WallSeg } from '../../lib/roomBlueprint'
import { blueprintAreaM2 } from '../../lib/roomBlueprint'
import { pointInBlueprintFloor } from '../../lib/loadBlueprint'
import { canListBuyNft } from '../../config/scStatus'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'
import { preloadImages, preloadNear } from '../../lib/imagePreload'

const STEP = 0.09
const SCALE = 48
const MAX_FRAMES = 14
const CULL_DIST = 14 // mètres plan — au-delà pas de DOM image
const HUD_HZ = 8 // maj React HUD max 8×/s

type Theme = 'cyber' | 'stone' | 'gold' | 'white' | 'dark'

const THEME: Record<
  Theme,
  { wall: string; wallEdge: string; floor: string; ceil: string; fog: string; base: string; frame: string; plaque: string }
> = {
  cyber: {
    wall: 'linear-gradient(180deg,#252540,#0a0a16)',
    wallEdge: 'rgba(34,211,238,0.12)',
    floor: 'repeating-linear-gradient(0deg,rgba(34,211,238,0.05) 0 1px,transparent 1px 48px),#080812',
    ceil: '#0e0e1a',
    fog: '#05050c',
    base: '#1a1a28',
    frame: 'linear-gradient(145deg,#3a3a48,#12121c)',
    plaque: 'rgba(0,0,0,0.75)',
  },
  stone: {
    wall: 'linear-gradient(180deg,#5a4e42,#1e1814)',
    wallEdge: 'rgba(255,230,180,0.1)',
    floor: '#1c1612',
    ceil: '#2a221c',
    fog: '#100e0c',
    base: '#2a2218',
    frame: 'linear-gradient(145deg,#4a3e30,#1a1410)',
    plaque: 'rgba(20,14,10,0.85)',
  },
  gold: {
    wall: 'linear-gradient(180deg,#5a4a28,#1a140c)',
    wallEdge: 'rgba(212,175,55,0.2)',
    floor: '#18140c',
    ceil: '#2a2418',
    fog: '#100e0a',
    base: '#2a2010',
    frame: 'linear-gradient(145deg,#6a5a30,#2a2010)',
    plaque: 'rgba(30,24,12,0.9)',
  },
  white: {
    wall: 'linear-gradient(180deg,#f4f0e8,#c8c0b4)',
    wallEdge: 'rgba(0,0,0,0.06)',
    floor: '#b8b0a0',
    ceil: '#f8f4ec',
    fog: '#a8a090',
    base: '#d0c8b8',
    frame: 'linear-gradient(145deg,#f0ece4,#c8c0b0)',
    plaque: 'rgba(255,255,255,0.9)',
  },
  dark: {
    wall: 'linear-gradient(180deg,#2a221c,#080604)',
    wallEdge: 'rgba(255,255,255,0.05)',
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
    w: maxX - minX,
    d: maxY - minY,
  }
}

function openingOnWall(w: WallSeg, o: Opening) {
  const g = wallGeom(w)
  const t = (o.offset + o.width / 2) / g.len
  return {
    x: w.x1 + (w.x2 - w.x1) * t,
    y: w.y1 + (w.y2 - w.y1) * t,
    angle: g.angle,
    width: o.width,
    height: o.height,
    sill: o.sill,
    type: o.type,
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
  const list = useMemo(() => frames.slice(0, MAX_FRAMES), [frames])
  const anchors = blueprint.artAnchors || []
  const openings = useMemo(() => (blueprint.openings || []).slice(0, 8), [blueprint])
  const walls = useMemo(() => blueprint.walls.slice(0, 12), [blueprint])
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

  const worldRef = useRef<HTMLDivElement>(null)
  const hudNearRef = useRef<HTMLDivElement>(null)
  const hudPosRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const hold = useRef<Record<string, boolean>>({})
  const keys = useRef<Record<string, boolean>>({})
  const pos = useRef({ x: spawn.x, y: spawn.y, yaw: spawn.yaw })
  const raf = useRef(0)
  const lastHud = useRef(0)
  const nearestId = useRef<string | null>(null)
  const visible = useRef(true)

  const [inspect, setInspect] = useState<FrameItem | null>(null)
  const [buyMsg, setBuyMsg] = useState<string | null>(null)
  const [broken, setBroken] = useState<Record<string, boolean>>({})
  const [showDetails, setShowDetails] = useState(false)
  const [nearTitle, setNearTitle] = useState('WASD · approchez une œuvre')
  const { connected } = useWallet()
  const marketLive = canListBuyNft()

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

  // Précharge progressive : 4 premières, puis le reste
  useEffect(() => {
    const urls = list.map(f => f.image).filter(Boolean) as string[]
    preloadImages(urls.slice(0, 4), 4, 8)
    const t = window.setTimeout(() => preloadImages(urls.slice(4), 6, 3), 400)
    return () => clearTimeout(t)
  }, [list])

  useEffect(() => {
    pos.current = { x: spawn.x, y: spawn.y, yaw: spawn.yaw }
    const el = worldRef.current
    if (el) {
      el.style.transform = `translate(-50%, -50%) rotateX(86deg) rotateZ(${(-spawn.yaw * 180) / Math.PI}deg) translate(${-(spawn.x - b.cx) * SCALE}px, ${(spawn.y - b.cy) * SCALE}px)`
    }
  }, [spawn.x, spawn.y, spawn.yaw, b.cx, b.cy])

  // Pause quand hors viewport
  useEffect(() => {
    const root = viewportRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([e]) => {
        visible.current = e.isIntersecting
      },
      { threshold: 0.05 }
    )
    io.observe(root)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (
        ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'escape', 'i'].includes(
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
    window.addEventListener('keydown', down, { passive: false })
    window.addEventListener('keyup', up)

    const tick = (t: number) => {
      raf.current = requestAnimationFrame(tick)
      if (!visible.current && document.hidden) return

      const k = { ...keys.current, ...hold.current }
      let { x, y, yaw: y0 } = pos.current
      let moved = false
      if (k['a'] || k['arrowleft']) {
        y0 += 0.04
        moved = true
      }
      if (k['d'] || k['arrowright']) {
        y0 -= 0.04
        moved = true
      }
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
          moved = true
        } else if (pointInBlueprintFloor(blueprint, nx, y)) {
          x = nx
          moved = true
        } else if (pointInBlueprintFloor(blueprint, x, ny)) {
          y = ny
          moved = true
        }
      }
      pos.current = { x, y, yaw: y0 }

      // Caméra : DOM direct — zéro setState
      if (moved || true) {
        const el = worldRef.current
        if (el) {
          el.style.transform = `translate(-50%, -50%) rotateX(86deg) rotateZ(${(-y0 * 180) / Math.PI}deg) translate(${-(x - b.cx) * SCALE}px, ${(y - b.cy) * SCALE}px)`
        }
      }

      // HUD throttlé
      if (t - lastHud.current > 1000 / HUD_HZ) {
        lastHud.current = t
        let best: (typeof framed)[0] | null = null
        let bestD = 1.35
        for (const it of framed) {
          const d = Math.hypot(it.x - x, it.y - y)
          if (d < bestD) {
            bestD = d
            best = it
          }
        }
        const title = best ? best.frame.title : 'WASD · approchez une œuvre'
        if (hudNearRef.current && hudNearRef.current.textContent !== title) {
          hudNearRef.current.textContent = title
        }
        if (hudPosRef.current) {
          hudPosRef.current.textContent = `${x.toFixed(1)},${y.toFixed(1)}`
        }
        const nid = best?.frame.id || null
        if (nid !== nearestId.current) {
          nearestId.current = nid
          setNearTitle(title)
          if (best?.frame.image) preloadNear(best.frame.image)
        }
      }
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      cancelAnimationFrame(raf.current)
    }
  }, [blueprint, framed, b.cx, b.cy])

  const floorW = Math.max(b.w * SCALE, 200)
  const floorD = Math.max(b.d * SCALE, 200)

  const onBuy = useCallback(() => {
    if (!allowBuy) return
    const f =
      inspect ||
      framed.find(x => x.frame.id === nearestId.current)?.frame ||
      null
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
  }, [allowBuy, inspect, framed, connected, marketLive])

  if (!list.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-950 min-h-[280px] flex items-center justify-center text-sm text-zinc-500">
        {emptyLabel}
      </div>
    )
  }

  const lightText = room === 'white'
  const doors = openings.filter(o => o.type === 'door').length
  const windows = openings.filter(o => o.type === 'window').length

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-white">{roomName}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {blueprint.description || 'Plan 3D'}
            {details?.era ? ` · ${details.era}` : ''}
          </p>
        </div>
        <button
          type="button"
          className="text-[10px] uppercase tracking-wider text-zinc-500 border border-white/10 rounded-full px-2.5 py-1 hover:text-zinc-300"
          onClick={() => setShowDetails(s => !s)}
        >
          {showDetails ? 'Masquer' : 'Détails'} · I
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
              {walls.length} · h {blueprint.wallHeight} m
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
            <p className="text-zinc-600 uppercase tracking-wider text-[9px]">Ouvertures</p>
            <p className="text-zinc-200 mt-0.5">
              {doors}p · {windows}f
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
            <p className="text-zinc-600 uppercase tracking-wider text-[9px]">Œuvres</p>
            <p className="text-zinc-200 mt-0.5">{framed.length}</p>
          </div>
        </div>
      )}

      <div
        ref={viewportRef}
        className="relative overflow-hidden rounded-2xl border border-white/10 select-none touch-none"
        style={{
          height: 'min(72vh, 520px)',
          background: theme.fog,
          perspective: '900px',
          perspectiveOrigin: '50% 40%',
          contain: 'strict',
          contentVisibility: 'auto',
        }}
        tabIndex={0}
        role="application"
        aria-label={`Salle 3D · ${blueprint.name}`}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[32%]"
          style={{
            background: `linear-gradient(180deg, ${theme.ceil} 0%, transparent 100%)`,
            opacity: 0.85,
          }}
        />

        <div
          ref={worldRef}
          className="absolute left-1/2 top-[40%]"
          style={{
            width: floorW,
            height: floorD,
            transformStyle: 'preserve-3d',
            willChange: 'transform',
            transform: `translate(-50%, -50%) rotateX(86deg) rotateZ(0deg)`,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: theme.floor,
              boxShadow: 'inset 0 0 80px rgba(0,0,0,0.45)',
            }}
          />

          {walls.map(w => {
            const g = wallGeom(w)
            const left = (g.mx - b.cx) * SCALE - (g.len * SCALE) / 2
            const top = (g.my - b.cy) * SCALE
            const wallH = g.h * SCALE * 0.5
            return (
              <div
                key={w.id}
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
                  boxShadow: `inset 0 0 0 1px ${theme.wallEdge}`,
                }}
              >
                <div
                  className="absolute left-0 right-0 bottom-0 h-[8%]"
                  style={{ background: theme.base }}
                />
              </div>
            )
          })}

          {openings.map(o => {
            const wall = blueprint.walls.find(w => w.id === o.wallId)
            if (!wall) return null
            const op = openingOnWall(wall, o)
            const isDoor = o.type === 'door'
            return (
              <div
                key={o.id}
                className="absolute pointer-events-none"
                style={{
                  left: (op.x - b.cx) * SCALE + floorW / 2,
                  top: (op.y - b.cy) * SCALE + floorD / 2,
                  width: op.width * SCALE * 0.9,
                  height: op.height * SCALE * 0.42,
                  transform: `translate(-50%, -100%) translateY(-${op.sill * SCALE * 0.3}px) rotateZ(${(op.angle * 180) / Math.PI}deg) rotateX(-90deg)`,
                  transformOrigin: 'center bottom',
                  background: isDoor
                    ? 'linear-gradient(180deg,#14100c,#2a2018)'
                    : 'linear-gradient(180deg,rgba(140,190,230,0.3),rgba(80,120,160,0.15))',
                  border: isDoor ? '2px solid rgba(180,150,100,0.3)' : '1px solid rgba(180,220,255,0.2)',
                }}
              />
            )
          })}

          {framed.map((it, i) => {
            const left = (it.x - b.cx) * SCALE
            const top = (it.y - b.cy) * SCALE
            const lift = it.height * SCALE * 0.26
            // Images : loading lazy sauf les 4 premières
            const eager = i < 4
            return (
              <button
                key={it.frame.id + '-' + i}
                type="button"
                className="absolute focus:outline-none"
                data-art={it.frame.id}
                style={{
                  left: left + floorW / 2,
                  top: top + floorD / 2,
                  width: 52,
                  height: 68,
                  transform: `translate(-50%, -100%) translateY(-${lift}px) rotateZ(${(it.facing * 180) / Math.PI}deg) rotateX(-90deg)`,
                  transformOrigin: 'center bottom',
                  contentVisibility: 'auto',
                }}
                onClick={() => setInspect(it.frame)}
              >
                <div
                  className="h-full w-full border-[3px] p-[4%] border-amber-900/35"
                  style={{ background: theme.frame }}
                >
                  <div className="h-full w-full bg-black overflow-hidden">
                    {it.frame.image && !broken[it.frame.id] ? (
                      <img
                        src={it.frame.image}
                        alt=""
                        className="h-full w-full object-cover"
                        loading={eager ? 'eager' : 'lazy'}
                        decoding="async"
                        // @ts-expect-error fetchPriority
                        fetchPriority={eager ? 'high' : 'low'}
                        width={104}
                        height={136}
                        draggable={false}
                        onError={() => setBroken(br => ({ ...br, [it.frame.id]: true }))}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-[7px] text-zinc-600 px-0.5">
                        {it.frame.title.slice(0, 10)}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 border border-white/25 rounded-full" />
        </div>

        <div className="absolute top-2 left-2 right-2 flex justify-between gap-2 pointer-events-none">
          <div
            ref={hudNearRef}
            className={`rounded-lg px-2.5 py-1.5 text-[10px] backdrop-blur border max-w-[72%] truncate ${
              lightText
                ? 'bg-white/75 border-stone-300 text-stone-700'
                : 'bg-black/60 border-white/10 text-zinc-300'
            }`}
          >
            {nearTitle}
          </div>
          <div ref={hudPosRef} className="text-[9px] font-mono text-zinc-600 self-center">
            —
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
            onClick={() => {
              const f = framed.find(x => x.frame.id === nearestId.current)
              if (f) setInspect(f.frame)
            }}
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
                {inspect.image && !broken[inspect.id] ? (
                  <img
                    src={inspect.image}
                    alt=""
                    className="w-full h-full object-cover"
                    decoding="async"
                    // @ts-expect-error
                    fetchPriority="high"
                  />
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
