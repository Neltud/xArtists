/**
 * CSS 3D corridor gallery — no Three.js dep (CI-safe).
 * Frames = real NFT thumbs from catalog or user wallet.
 */
import { useMemo, useState } from 'react'
import type { UserNft } from '../../hooks/useUserAccount'

export type FrameItem = {
  id: string
  title: string
  subtitle?: string
  image?: string
  href?: string
}

function thumb(n: UserNft): string | undefined {
  if (n.url && /^https?:\/\//i.test(n.url)) return n.url
  const m = n.media?.[0]?.url
  if (m && /^https?:\/\//i.test(m)) return m
  return undefined
}

export function framesFromUserNfts(nfts: UserNft[]): FrameItem[] {
  return nfts.slice(0, 24).map(n => ({
    id: n.identifier,
    title: n.name || n.identifier,
    subtitle: n.collection,
    image: thumb(n),
    href: `https://explorer.multiversx.com/nfts/${n.identifier}`,
  }))
}

export default function MuseumCorridor({
  frames,
  theme = 'cyber',
  emptyLabel = 'Aucune œuvre à afficher',
}: {
  frames: FrameItem[]
  theme?: 'cyber' | 'sanctuary' | 'void' | 'globe'
  emptyLabel?: string
}) {
  const [focus, setFocus] = useState(0)
  const list = useMemo(() => frames, [frames])
  const f = list[focus] || null

  const bg =
    theme === 'sanctuary'
      ? 'from-[#1a1210] via-[#0f0c0a] to-black'
      : theme === 'globe'
        ? 'from-[#0a1628] via-[#0a0e18] to-black'
        : theme === 'void'
          ? 'from-[#050508] via-[#0a0a12] to-black'
          : 'from-[#0e0e18] via-[#0a0a12] to-black'

  const wall =
    theme === 'sanctuary'
      ? 'border-amber-500/20 bg-gradient-to-b from-amber-950/40 to-black/80'
      : 'border-white/10 bg-gradient-to-b from-white/[0.06] to-black/60'

  if (!list.length) {
    return (
      <div
        className={`relative min-h-[320px] rounded-2xl border border-white/10 bg-gradient-to-br ${bg} flex items-center justify-center`}
      >
        <p className="text-sm text-zinc-500 px-4 text-center">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${bg}`}>
      <div
        className="relative h-[360px] sm:h-[420px] flex items-center justify-center"
        style={{ perspective: '900px' }}
      >
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 opacity-40"
          style={{
            background:
              'linear-gradient(to top, rgba(34,211,238,0.12), transparent), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.04) 41px)',
          }}
        />
        <div
          className="flex gap-4 sm:gap-6 items-end px-4 transition-transform duration-500"
          style={{
            transform: `translateX(${(list.length / 2 - focus) * 28}px) rotateX(8deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {list.map((item, idx) => {
            const active = idx === focus
            const dist = Math.abs(idx - focus)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFocus(idx)}
                className={`relative shrink-0 rounded-lg border ${wall} overflow-hidden transition-all duration-300 focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  active ? 'scale-110 z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'scale-90 opacity-70'
                }`}
                style={{
                  width: active ? 140 : 100,
                  height: active ? 180 : 130,
                  transform: `translateZ(${active ? 40 : -dist * 20}px)`,
                }}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={e => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-3xl opacity-40">🖼</div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1.5">
                  <p className="text-[10px] text-white truncate font-medium">{item.title}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-3 py-2 bg-black/40">
        <div className="min-w-0">
          <p className="text-sm text-white font-medium truncate">{f?.title}</p>
          {f?.subtitle && <p className="text-[10px] text-zinc-500 mono truncate">{f.subtitle}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            className="btn-secondary text-[11px] py-1 px-2"
            disabled={focus <= 0}
            onClick={() => setFocus(x => Math.max(0, x - 1))}
          >
            ←
          </button>
          <span className="text-[11px] text-zinc-500 self-center mono">
            {focus + 1}/{list.length}
          </span>
          <button
            type="button"
            className="btn-secondary text-[11px] py-1 px-2"
            disabled={focus >= list.length - 1}
            onClick={() => setFocus(x => Math.min(list.length - 1, x + 1))}
          >
            →
          </button>
          {f?.href && (
            <a href={f.href} target="_blank" rel="noreferrer" className="btn-secondary text-[11px] py-1 px-2">
              Explorer ↗
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
