/**
 * Galerie murale immersive (CSS 3D) — œuvre au mur, zoom, intention d'achat.
 * Pas de Three.js (CI-safe). Achat = intent paper / Guardian — jamais fake SUCCESS.
 */
import { useEffect, useMemo, useState } from 'react'
import type { UserNft } from '../../hooks/useUserAccount'
import { canListBuyNft } from '../../config/scStatus'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'

export type FrameItem = {
  id: string
  title: string
  subtitle?: string
  image?: string
  href?: string
  collection?: string
  description?: string
  type?: string
  priceLabel?: string
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

function dispatchBuyIntent(frame: FrameItem) {
  const raw = `acheter NFT ${frame.id} ${frame.title}`
  window.dispatchEvent(
    new CustomEvent('lia-intent', {
      detail: {
        lip: {
          raw,
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
  const [zoom, setZoom] = useState(false)
  const [zoomScale, setZoomScale] = useState(1)
  const [buyMsg, setBuyMsg] = useState<string | null>(null)
  const list = useMemo(() => frames, [frames])
  const f = list[Math.min(focus, Math.max(0, list.length - 1))] || null
  const marketLive = canListBuyNft()
  const { connected } = useWallet()

  useEffect(() => {
    setFocus(0)
    setZoom(false)
    setZoomScale(1)
    setBuyMsg(null)
  }, [frames])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setZoom(false)
        setZoomScale(1)
      }
      if (e.key === 'ArrowLeft') setFocus(x => Math.max(0, x - 1))
      if (e.key === 'ArrowRight') setFocus(x => Math.min(list.length - 1, x + 1))
      if (e.key === '+' || e.key === '=') setZoomScale(s => Math.min(3, s + 0.25))
      if (e.key === '-') setZoomScale(s => Math.max(1, s - 0.25))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [list.length])

  const wallTone =
    theme === 'sanctuary'
      ? 'from-[#2a1f18] via-[#1a1210] to-[#0c0a08]'
      : theme === 'globe'
        ? 'from-[#0c1a2e] via-[#0a1220] to-[#060810]'
        : theme === 'void'
          ? 'from-[#12121a] via-[#0a0a10] to-black'
          : 'from-[#16161f] via-[#0e0e16] to-[#08080c]'

  const onBuy = () => {
    if (!f) return
    if (!connected) {
      requestOpenConnect()
      setBuyMsg('Connecte ton wallet pour préparer une intention d’achat.')
      return
    }
    dispatchBuyIntent(f)
    if (marketLive) {
      setBuyMsg(
        'Intention BUY_NFT émise → Guardian. Signature wallet requise pour toute TX réelle (SC live).'
      )
    } else {
      setBuyMsg(
        'Intention paper enregistrée (⌘K / Trading). Marketplace SC non live — aucun SUCCESS simulé, aucun prélèvement.'
      )
    }
  }

  if (!list.length) {
    return (
      <div
        className={`relative min-h-[320px] rounded-2xl border border-white/10 bg-gradient-to-b ${wallTone} flex items-center justify-center`}
      >
        <p className="text-sm text-zinc-500 px-4 text-center">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
      <div
        className={`relative h-[420px] sm:h-[520px] bg-gradient-to-b ${wallTone}`}
        style={{ perspective: '1200px' }}
      >
        <div
          className="absolute inset-x-0 top-0 h-[18%] opacity-80"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent), repeating-linear-gradient(90deg, transparent, transparent 64px, rgba(255,255,255,0.03) 65px)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[28%]"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.85), transparent), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 56px)',
            transform: 'rotateX(72deg)',
            transformOrigin: 'bottom center',
          }}
        />
        <div
          className="absolute inset-x-[6%] top-[12%] bottom-[22%] rounded-sm border border-white/[0.06]"
          style={{
            background:
              theme === 'sanctuary'
                ? 'linear-gradient(180deg, #3a2a22 0%, #241812 100%)'
                : 'linear-gradient(180deg, #1c1c28 0%, #12121a 100%)',
            boxShadow: 'inset 0 0 80px rgba(0,0,0,0.45)',
          }}
        >
          <div className="absolute inset-x-4 top-6 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          {f && (
            <button
              type="button"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[42%] group"
              style={{ width: 'min(42%, 220px)' }}
              onClick={() => {
                setZoom(true)
                setZoomScale(1.2)
              }}
              aria-label={`Voir ${f.title} en grand`}
            >
              <div
                className="relative aspect-[4/5] p-[7%] bg-gradient-to-br from-zinc-200/20 via-zinc-800 to-black border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.55)] group-hover:border-cyan-400/40 transition-colors"
                style={{
                  boxShadow:
                    '0 24px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.08)',
                }}
              >
                <div className="absolute inset-[7%] bg-black overflow-hidden">
                  {f.image ? (
                    <img
                      src={f.image}
                      alt={f.title}
                      className="h-full w-full object-cover"
                      loading="eager"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-3xl opacity-40">
                      🖼
                    </div>
                  )}
                </div>
              </div>
              <p className="mt-2 text-center text-[10px] text-zinc-400 truncate">{f.title}</p>
              <p className="text-center text-[9px] text-cyan-300/70 opacity-0 group-hover:opacity-100 transition-opacity">
                Cliquer pour zoomer
              </p>
            </button>
          )}
        </div>
        <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 px-2 overflow-x-auto">
          {list.slice(Math.max(0, focus - 4), focus + 5).map((item, idx) => {
            const realIdx = Math.max(0, focus - 4) + idx
            const active = realIdx === focus
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFocus(realIdx)}
                className={`shrink-0 w-11 h-14 rounded border overflow-hidden ${
                  active
                    ? 'border-cyan-400/60 ring-1 ring-cyan-400/30'
                    : 'border-white/10 opacity-70'
                }`}
              >
                {item.image ? (
                  <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-[10px] text-zinc-600">·</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/70 px-3 py-3 sm:px-4 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm sm:text-base text-white font-semibold truncate">{f?.title}</p>
            <p className="text-[11px] text-zinc-500 mono truncate">
              {f?.collection || f?.subtitle}
              {f?.type ? ` · ${f.type}` : ''}
              {f?.priceLabel ? ` · ${f.priceLabel}` : ''}
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
            <button
              type="button"
              className="btn-secondary text-[11px] py-1 px-2"
              onClick={() => {
                setZoom(true)
                setZoomScale(1.25)
              }}
            >
              Zoom
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
            <button type="button" className="btn-primary text-[11px] py-1 px-2.5" onClick={onBuy}>
              {marketLive ? 'Acheter…' : 'Intention d’achat'}
            </button>
          </div>
        </div>
        {buyMsg && (
          <p className="text-[11px] text-amber-200/90 leading-relaxed border border-amber-500/25 bg-amber-500/10 rounded-lg px-2.5 py-1.5">
            {buyMsg}
          </p>
        )}
        <p className="text-[10px] text-zinc-600">
          ← → naviguer · Zoom / + − · Esc ferme · achat = intent paper tant que SC market non vérifié
        </p>
      </div>

      {zoom && f && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal
          aria-label="Zoom œuvre"
          onClick={() => {
            setZoom(false)
            setZoomScale(1)
          }}
        >
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2 gap-2">
              <p className="text-sm text-white font-medium truncate">{f.title}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary text-[11px] py-1"
                  onClick={() => setZoomScale(s => Math.max(1, s - 0.25))}
                >
                  −
                </button>
                <button
                  type="button"
                  className="btn-secondary text-[11px] py-1"
                  onClick={() => setZoomScale(s => Math.min(3, s + 0.25))}
                >
                  +
                </button>
                <button
                  type="button"
                  className="btn-secondary text-[11px] py-1"
                  onClick={() => {
                    setZoom(false)
                    setZoomScale(1)
                  }}
                >
                  Fermer
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-[75vh] rounded-xl border border-white/15 bg-black">
              <div
                className="origin-center transition-transform duration-200 mx-auto"
                style={{ transform: `scale(${zoomScale})`, width: '100%' }}
              >
                {f.image ? (
                  <img src={f.image} alt={f.title} className="w-full h-auto object-contain" />
                ) : (
                  <p className="text-zinc-500 p-12 text-center">Pas d’image</p>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-primary text-xs" onClick={onBuy}>
                {marketLive ? 'Acheter…' : 'Intention d’achat (paper)'}
              </button>
              {f.href && (
                <a href={f.href} target="_blank" rel="noreferrer" className="btn-secondary text-xs">
                  Fiche Explorer
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
