/**
 * Musée « jeu » — WASD / flèches, œuvres aux murs, inspecter (E / clic).
 * CSS only — pas de Three.js.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FrameItem } from './MuseumCorridor'
import { canListBuyNft } from '../../config/scStatus'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'
import InfoTip from '../InfoTip'

const STEP = 0.045
const LOOK_MAX = 28

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

export default function MuseumGameHall({
  frames,
  emptyLabel = 'Aucune œuvre',
}: {
  frames: FrameItem[]
  emptyLabel?: string
}) {
  const list = useMemo(() => frames.slice(0, 32), [frames])
  const maxZ = Math.max(1, list.length * 0.55)
  const [z, setZ] = useState(0.15)
  const [lookY, setLookY] = useState(0)
  const [inspect, setInspect] = useState<FrameItem | null>(null)
  const [buyMsg, setBuyMsg] = useState<string | null>(null)
  const keys = useRef<Record<string, boolean>>({})
  const raf = useRef(0)
  const marketLive = canListBuyNft()
  const { connected } = useWallet()

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
    return bestD < 0.45 ? best : null
  }, [list, z, maxZ])

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
      const k = keys.current
      setZ(prev => {
        let n = prev
        if (k['w'] || k['arrowup']) n += STEP
        if (k['s'] || k['arrowdown']) n -= STEP
        return Math.max(0, Math.min(maxZ, n))
      })
      setLookY(prev => {
        let n = prev
        if (k['a'] || k['arrowleft']) n = Math.min(LOOK_MAX, n + 1.2)
        if (k['d'] || k['arrowright']) n = Math.max(-LOOK_MAX, n - 1.2)
        if (!k['a'] && !k['arrowleft'] && !k['d'] && !k['arrowright']) n *= 0.92
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
  }, [inspect, nearest, connected, marketLive])

  if (!list.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-950 min-h-[360px] flex items-center justify-center text-sm text-zinc-500">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
        <span className="inline-flex items-center gap-1">
          Mode exploration
          <InfoTip k="museumGame" />
        </span>
        <span className="mono text-zinc-600">
          pos {z.toFixed(2)} / {maxZ.toFixed(2)}
        </span>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#07070c] select-none"
        style={{ height: 'min(70vh, 560px)' }}
        tabIndex={0}
        role="application"
        aria-label="Galerie 3D — WASD pour se déplacer"
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 40%, #141428 0%, #07070c 70%)',
            transform: `perspective(900px) rotateY(${lookY}deg)`,
            transformOrigin: '50% 50%',
          }}
        >
          <div
            className="absolute inset-x-0 bottom-0 h-[42%]"
            style={{
              background: `linear-gradient(to top, #050508 0%, transparent 100%),
                repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 48px),
                repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 48px)`,
              transform: 'perspective(600px) rotateX(58deg)',
              transformOrigin: 'center bottom',
            }}
          />

          {list.map((item, i) => {
            const artZ = (i + 1) * (maxZ / (list.length + 1))
            const rel = artZ - z
            if (rel < -0.15 || rel > 2.8) return null
            const scale = Math.max(0.35, 1.15 - rel * 0.35)
            const opacity = Math.max(0.15, 1 - rel * 0.35)
            const side = i % 2 === 0 ? -1 : 1
            const xPct = 50 + side * (18 + rel * 4)
            const yPct = 38 - rel * 3
            const isNear = nearest?.id === item.id

            return (
              <button
                key={item.id}
                type="button"
                className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                style={{
                  left: `${xPct}%`,
                  top: `${yPct}%`,
                  width: `${Math.round(100 * scale)}px`,
                  opacity,
                  zIndex: Math.round(100 - rel * 30),
                  transform: `translate(-50%, -50%) scale(${scale})`,
                }}
                onClick={() => setInspect(item)}
              >
                <div
                  className={`relative aspect-[4/5] p-[6%] border transition-colors ${
                    isNear
                      ? 'border-cyan-400/50 shadow-[0_0_24px_rgba(34,211,238,0.25)]'
                      : 'border-white/15'
                  }`}
                  style={{
                    background: 'linear-gradient(145deg, #2a2a32, #121218)',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.55)',
                  }}
                >
                  <div className="absolute inset-[6%] bg-black overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        loading={rel < 1 ? 'eager' : 'lazy'}
                        draggable={false}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xl opacity-40">
                        🖼
                      </div>
                    )}
                  </div>
                </div>
                {isNear && (
                  <p className="mt-1 text-center text-[9px] text-cyan-200/90 truncate max-w-[120px]">
                    {item.title} · E
                  </p>
                )}
              </button>
            )
          })}
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 border border-white/25 rounded-full" />
        </div>

        <div className="absolute left-3 bottom-3 right-3 flex flex-wrap items-end justify-between gap-2 pointer-events-none">
          <div className="rounded-lg border border-white/10 bg-black/60 px-2.5 py-1.5 text-[10px] text-zinc-400 backdrop-blur">
            <span className="text-zinc-300 font-medium">WASD</span> move ·{' '}
            <span className="text-zinc-300 font-medium">E</span> inspect
            {nearest && (
              <span className="block text-cyan-200/90 mt-0.5 truncate max-w-[200px]">
                Proche : {nearest.title}
              </span>
            )}
          </div>
          <div className="h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-cyan-400/70 transition-[width]"
              style={{ width: `${(z / maxZ) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2 sm:hidden">
        {(['forward', 'back', 'left', 'right'] as const).map(dir => (
          <button
            key={dir}
            type="button"
            className="btn-secondary text-xs min-w-[3rem]"
            onTouchStart={e => {
              e.preventDefault()
              if (dir === 'forward') keys.current['w'] = true
              if (dir === 'back') keys.current['s'] = true
              if (dir === 'left') keys.current['a'] = true
              if (dir === 'right') keys.current['d'] = true
            }}
            onTouchEnd={() => {
              keys.current = {}
            }}
          >
            {dir === 'forward' ? '↑' : dir === 'back' ? '↓' : dir === 'left' ? '←' : '→'}
          </button>
        ))}
        <button
          type="button"
          className="btn-primary text-xs"
          disabled={!nearest}
          onClick={() => nearest && setInspect(nearest)}
        >
          Inspecter
        </button>
      </div>

      {buyMsg && (
        <p className="text-[11px] text-amber-200/90 border border-amber-500/25 bg-amber-500/10 rounded-lg px-2.5 py-1.5">
          {buyMsg}
        </p>
      )}

      {inspect && (
        <div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal
          onClick={() => setInspect(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0c0c14] p-4 shadow-2xl space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex gap-3">
              <div className="w-28 sm:w-36 shrink-0 aspect-[4/5] rounded-lg overflow-hidden border border-white/10 bg-black">
                {inspect.image ? (
                  <img src={inspect.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center opacity-40">🖼</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-white leading-snug">{inspect.title}</p>
                <p className="text-[11px] text-zinc-500 mono mt-1 truncate">
                  {inspect.collection || inspect.subtitle}
                </p>
                {inspect.description && (
                  <p className="text-xs text-zinc-400 mt-2 line-clamp-4">{inspect.description}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-primary text-xs" onClick={onBuy}>
                {marketLive ? 'Acheter…' : 'Intention d’achat'}
              </button>
              {inspect.href && (
                <a href={inspect.href} target="_blank" rel="noreferrer" className="btn-secondary text-xs">
                  Explorer ↗
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
