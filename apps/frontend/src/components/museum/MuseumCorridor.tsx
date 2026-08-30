/**
 * CSS 3D corridor — real MultiversX artwork frames (no Three.js).
 */
import { useEffect, useMemo, useState } from 'react'
import type { UserNft } from '../../hooks/useUserAccount'

export type FrameItem = {
  id: string
  title: string
  subtitle?: string
  image?: string
  href?: string
  collection?: string
  description?: string
  type?: string
}

function thumb(n: UserNft): string | undefined {
  if (n.url && /^https?:\/\//i.test(n.url)) return n.url
  const m = n.media?.[0]
  if (m?.thumbnailUrl && /^https?:\/\//i.test(m.thumbnailUrl)) return m.thumbnailUrl
  if (m?.url && /^https?:\/\//i.test(m.url)) return m.url
  return undefined
}

export function framesFromUserNfts(nfts: UserNft[]): FrameItem[] {
  return nfts.slice(0, 48).map(n => ({
    id: n.identifier,
    title: n.name || n.identifier,
    subtitle: n.collection,
    collection: n.collection,
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
  const f = list[Math.min(focus, Math.max(0, list.length - 1))] || null

  useEffect(() => {
    setFocus(0)
  }, [frames])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setFocus(x => Math.max(0, x - 1))
      if (e.key === 'ArrowRight') setFocus(x => Math.min(list.length - 1, x + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [list.length])

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
        className="relative h-[380px] sm:h-[460px] flex items-center justify-center"
        style={{ perspective: '1000px' }}
      >
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 opacity-50"
          style={{
            background:
              'linear-gradient(to top, rgba(34,211,238,0.14), transparent), repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(255,255,255,0.04) 49px)',
          }}
        />
        <div className="absolute inset-x-[10%] top-6 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

        <div
          className="flex gap-3 sm:gap-5 items-end px-4 transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(${(Math.min(list.length, 12) / 2 - focus) * 36}px) rotateX(6deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {list.map((item, idx) => {
            const active = idx === focus
            const dist = Math.abs(idx - focus)
            if (dist > 6) return null
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFocus(idx)}
                className={`relative shrink-0 rounded-lg border ${wall} overflow-hidden transition-all duration-300 focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  active
                    ? 'scale-110 z-10 shadow-[0_24px_60px_rgba(0,0,0,0.55)] border-cyan-400/30'
                    : 'scale-90 opacity-65'
                }`}
                style={{
                  width: active ? 168 : 108,
                  height: active ? 210 : 140,
                  transform: `translateZ(${active ? 48 : -dist * 18}px)`,
                }}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    loading={dist < 3 ? 'eager' : 'lazy'}
                    onError={e => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-3xl opacity-40">
                    🖼
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1.5">
                  <p className="text-[10px] text-white truncate font-medium">{item.title}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/50 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm sm:text-base text-white font-semibold truncate">{f?.title}</p>
            <p className="text-[11px] text-zinc-500 mono truncate">
              {f?.collection || f?.subtitle}
              {f?.type ? ` · ${f.type}` : ''}
            </p>
            {f?.description && (
              <p className="text-xs text-zinc-400 mt-1 line-clamp-2 max-w-xl">{f.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0 items-center">
            <button
              type="button"
              className="btn-secondary text-[11px] py-1 px-2"
              disabled={focus <= 0}
              onClick={() => setFocus(x => Math.max(0, x - 1))}
            >
              ←
            </button>
            <span className="text-[11px] text-zinc-500 mono">
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
              <a
                href={f.href}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-[11px] py-1 px-2"
              >
                Explorer ↗
              </a>
            )}
            {f?.collection && (
              <a
                href={`https://xoxno.com/collection/${f.collection}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-[11px] py-1 px-2"
              >
                XOXNO
              </a>
            )}
          </div>
        </div>
        <p className="text-[10px] text-zinc-600 mt-2">← → clavier · œuvres MultiversX mainnet</p>
      </div>
    </div>
  )
}
