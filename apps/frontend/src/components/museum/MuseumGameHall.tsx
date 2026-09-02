/**
 * Salle 3D CSS — murs / sol / plafond, exploration mobile + desktop.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FrameItem } from './MuseumCorridor'
import { canListBuyNft } from '../../config/scStatus'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'
import InfoTip from '../InfoTip'

const STEP = 0.05
const LOOK_MAX = 32

type RoomTheme = 'cyber' | 'stone' | 'gold' | 'white' | 'dark'

const ROOM: Record<RoomTheme, { wall: string; floor: string; ceiling: string; fog: string }> = {
  cyber: {
    wall: 'linear-gradient(180deg, #1a1a2e 0%, #12121c 55%, #0a0a12 100%)',
    floor: '#0a0a10',
    ceiling: '#0c0c14',
    fog: 'radial-gradient(ellipse 90% 55% at 50% 42%, #1a1a32 0%, #07070c 72%)',
  },
  stone: {
    wall: 'linear-gradient(180deg, #3d342c 0%, #2a221c 50%, #1a1512 100%)',
    floor: '#1c1612',
    ceiling: '#241e1a',
    fog: 'radial-gradient(ellipse 90% 55% at 50% 42%, #3a3028 0%, #12100e 72%)',
  },
  gold: {
    wall: 'linear-gradient(180deg, #3a3220 0%, #2a2418 50%, #1a160e 100%)',
    floor: '#1a1610',
    ceiling: '#2a2418',
    fog: 'radial-gradient(ellipse 90% 55% at 50% 42%, #3a3228 0%, #100e0a 72%)',
  },
  white: {
    wall: 'linear-gradient(180deg, #e8e4dc 0%, #d4cfc4 50%, #c4bdb0 100%)',
    floor: '#b8b0a4',
    ceiling: '#f0ece4',
    fog: 'radial-gradient(ellipse 90% 55% at 50% 42%, #e8e4dc 0%, #a8a098 72%)',
  },
  dark: {
    wall: 'linear-gradient(180deg, #1c1814 0%, #12100e 50%, #0a0806 100%)',
    floor: '#0c0a08',
    ceiling: '#141210',
    fog: 'radial-gradient(ellipse 90% 55% at 50% 42%, #221c18 0%, #080604 72%)',
  },
}

function dispatchBuyIntent(frame: FrameItem) {
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

function PadBtn({ label, onPress }: { label: string; onPress: (on: boolean) => void }) {
  return (
    <button
      type="button"
      className="h-11 w-11 rounded-xl border border-white/15 bg-black/55 text-white text-sm font-bold active:bg-cyan-500/30 touch-manipulation select-none"
      aria-label={label}
      onPointerDown={e => {
        e.preventDefault()
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        onPress(true)
      }}
      onPointerUp={() => onPress(false)}
      onPointerCancel={() => onPress(false)}
      onPointerLeave={() => onPress(false)}
    >
      {label}
    </button>
  )
}

export default function MuseumGameHall({
  frames,
  emptyLabel = 'Aucune œuvre',
  room = 'cyber',
  allowBuy = true,
}: {
  frames: FrameItem[]
  emptyLabel?: string
  room?: RoomTheme
  allowBuy?: boolean
}) {
  const list = useMemo(() => frames.slice(0, 36), [frames])
  const maxZ = Math.max(1.2, list.length * 0.5)
  const [z, setZ] = useState(0.12)
  const [lookY, setLookY] = useState(0)
  const [inspect, setInspect] = useState<FrameItem | null>(null)
  const [buyMsg, setBuyMsg] = useState<string | null>(null)
  const keys = useRef<Record<string, boolean>>({})
  const hold = useRef<Record<string, boolean>>({})
  const raf = useRef(0)
  const marketLive = canListBuyNft()
  const { connected } = useWallet()
  const theme = ROOM[room] || ROOM.cyber
  const lightText = room === 'white'

  const nearest = useMemo(() => {
    if (!list.length) return null
    let best = list[0]
    let bestD = Infinity
    list.forEach((item, i) => {
      const artZ = (i + 1) * (maxZ / (list.length + 1))
      const d = Math.abs(artZ - z)
      if (d < bestD) {
        bestD = d
        best = item
      }
    })
    return bestD < 0.5 ? best : null
  }, [list, z, maxZ])

  const setKey = (k: string, on: boolean) => {
    keys.current[k] = on
    hold.current[k] = on
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e'].includes(k)) {
        e.preventDefault()
        keys.current[k] = true
      }
      if (k === 'e' && nearest) setInspect(nearest)
      if (k === 'escape') setInspect(null)
    }
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    const tick = () => {
      const k = { ...keys.current, ...hold.current }
      setZ(prev => {
        let n = prev
        if (k['w'] || k['arrowup']) n += STEP
        if (k['s'] || k['arrowdown']) n -= STEP
        return Math.max(0, Math.min(maxZ, n))
      })
      setLookY(prev => {
        let n = prev
        if (k['a'] || k['arrowleft']) n = Math.min(LOOK_MAX, n + 1.4)
        if (k['d'] || k['arrowright']) n = Math.max(-LOOK_MAX, n - 1.4)
        if (!k['a'] && !k['arrowleft'] && !k['d'] && !k['arrowright']) n *= 0.9
        return n
      })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      cancelAnimationFrame(raf.current)
    }
  }, [maxZ, nearest])

  const onBuy = useCallback(() => {
    if (!allowBuy) return
    const f = inspect || nearest
    if (!f) return
    if (!connected) {
      requestOpenConnect()
      setBuyMsg('Connecte ton wallet pour une intention d’achat.')
      return
    }
    dispatchBuyIntent(f)
    setBuyMsg(
      marketLive
        ? 'Intention BUY_NFT → Guardian. Signature wallet pour TX réelle.'
        : 'Intention paper — SC market non live. Pas de SUCCESS simulé.'
    )
  }, [inspect, nearest, connected, marketLive, allowBuy])

  if (!list.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-950 min-h-[280px] flex items-center justify-center text-sm text-zinc-500 px-4 text-center">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
        <span className="inline-flex items-center gap-1">
          Visite virtuelle
          <InfoTip k="museumGame" />
        </span>
        <span className="mono text-zinc-600 text-[10px]">{Math.round((z / maxZ) * 100)}%</span>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 select-none touch-none"
        style={{ height: 'min(72vh, 520px)', background: theme.fog }}
        tabIndex={0}
        role="application"
        aria-label="Galerie 3D mobile et desktop"
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `perspective(1000px) rotateY(${lookY}deg)`,
            transformOrigin: '50% 50%',
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-[22%]"
            style={{
              background: theme.ceiling,
              transform: 'perspective(700px) rotateX(-55deg)',
              transformOrigin: 'center top',
            }}
          />
          <div
            className="absolute left-0 top-[10%] bottom-[18%] w-[22%]"
            style={{
              background: theme.wall,
              transform: 'perspective(800px) rotateY(58deg)',
              transformOrigin: 'left center',
            }}
          />
          <div
            className="absolute right-0 top-[10%] bottom-[18%] w-[22%]"
            style={{
              background: theme.wall,
              transform: 'perspective(800px) rotateY(-58deg)',
              transformOrigin: 'right center',
            }}
          />
          <div
            className="absolute left-[18%] right-[18%] top-[12%] bottom-[22%]"
            style={{ background: theme.wall, boxShadow: 'inset 0 0 60px rgba(0,0,0,0.35)' }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-[28%]"
            style={{
              background: `linear-gradient(to top, rgba(0,0,0,0.5), transparent),
                repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 40px),
                ${theme.floor}`,
              transform: 'perspective(700px) rotateX(58deg)',
              transformOrigin: 'center bottom',
            }}
          />

          {list.map((item, i) => {
            const artZ = (i + 1) * (maxZ / (list.length + 1))
            const rel = artZ - z
            if (rel < -0.2 || rel > 2.6) return null
            const scale = Math.max(0.32, 1.2 - rel * 0.38)
            const opacity = Math.max(0.12, 1 - rel * 0.38)
            const side = i % 2 === 0 ? -1 : 1
            const xPct = 50 + side * (16 + rel * 5)
            const yPct = 40 - rel * 2.5
            const isNear = nearest?.id === item.id
            return (
              <button
                key={item.id}
                type="button"
                className="absolute focus:outline-none"
                style={{
                  left: `${xPct}%`,
                  top: `${yPct}%`,
                  width: `${Math.round(92 * scale)}px`,
                  opacity,
                  zIndex: Math.round(120 - rel * 35),
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={() => setInspect(item)}
              >
                <div
                  className={`relative aspect-[4/5] p-[5%] border-2 ${
                    isNear ? 'border-cyan-400/55' : lightText ? 'border-stone-600/40' : 'border-white/20'
                  }`}
                  style={{
                    background: lightText
                      ? 'linear-gradient(145deg, #f5f0e6, #ddd5c8)'
                      : 'linear-gradient(145deg, #2a2a32, #121218)',
                    boxShadow: isNear ? '0 0 28px rgba(34,211,238,0.3)' : '0 14px 28px rgba(0,0,0,0.45)',
                  }}
                >
                  <div className="absolute inset-[5%] bg-black overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        loading={rel < 1.2 ? 'eager' : 'lazy'}
                        draggable={false}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center opacity-40">🖼</div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className={`w-2.5 h-2.5 border rounded-full ${lightText ? 'border-stone-700/40' : 'border-white/30'}`} />
        </div>

        <div className="absolute top-2 left-2 right-2 flex justify-between gap-2 pointer-events-none">
          <div
            className={`rounded-lg px-2 py-1 text-[10px] backdrop-blur border ${
              lightText
                ? 'bg-white/70 border-stone-300 text-stone-700'
                : 'bg-black/55 border-white/10 text-zinc-400'
            }`}
          >
            {nearest ? nearest.title : 'Avancez vers une œuvre'}
          </div>
          <div className="h-1.5 w-20 self-center rounded-full bg-black/30 overflow-hidden">
            <div className="h-full bg-cyan-400/80" style={{ width: `${(z / maxZ) * 100}%` }} />
          </div>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 z-10">
          <div className="grid grid-cols-3 gap-1 w-[7.5rem]">
            <span />
            <PadBtn label="↑" onPress={on => setKey('w', on)} />
            <span />
            <PadBtn label="←" onPress={on => setKey('a', on)} />
            <PadBtn label="↓" onPress={on => setKey('s', on)} />
            <PadBtn label="→" onPress={on => setKey('d', on)} />
          </div>
          <button
            type="button"
            className="rounded-full border border-cyan-400/40 bg-cyan-500/20 text-cyan-50 text-xs font-semibold px-4 py-2.5 active:scale-95 shadow-lg"
            disabled={!nearest}
            onClick={() => nearest && setInspect(nearest)}
          >
            Inspecter
          </button>
        </div>
      </div>

      {buyMsg && (
        <p className="text-[11px] text-amber-200/90 border border-amber-500/25 bg-amber-500/10 rounded-lg px-2.5 py-1.5">
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
                {inspect.image ? (
                  <img src={inspect.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center opacity-40">🖼</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-white">{inspect.title}</p>
                <p className="text-[11px] text-zinc-500 mt-1">{inspect.subtitle || inspect.collection}</p>
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
              {!allowBuy && (
                <span className="text-[10px] text-zinc-500 self-center">Domaine public — visite libre</span>
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
