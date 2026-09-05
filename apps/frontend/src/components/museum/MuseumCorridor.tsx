/**
 * Types + corridor CSS (fallback). Fiche œuvre exhaustive partagée WebGL.
 */
import { useEffect, useMemo, useState } from 'react'
import type { UserNft } from '../../hooks/useUserAccount'
import { canListBuyNft } from '../../config/scStatus'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'

export type ArtworkKind = 'painting' | 'sculpture' | 'nft' | 'mixed' | 'unknown'
export type ArtworkMedium = 'physical' | 'digital' | 'hybrid'

export type FrameItem = {
  id: string
  title: string
  subtitle?: string
  image?: string
  href?: string
  collection?: string
  description?: string
  type?: string
  /** Affichage prix */
  priceLabel?: string
  artist?: string
  date?: string
  technique?: string
  dimensions?: string
  medium?: ArtworkMedium
  kind?: ArtworkKind
  onSale?: boolean
  priceEur?: number
  currency?: string
  provenance?: string
  license?: string
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
    artist: 'Créateur on-chain',
    medium: 'digital',
    kind: 'nft',
    technique: 'NFT MultiversX',
    onSale: false,
    license: 'On-chain ownership',
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

/** Fiche œuvre complète (modal partagée) */
export function ArtworkDossier({
  frame,
  allowBuy,
  marketLive,
  onBuy,
  onClose,
}: {
  frame: FrameItem
  allowBuy?: boolean
  marketLive?: boolean
  onBuy?: () => void
  onClose: () => void
}) {
  const medium =
    frame.medium === 'digital'
      ? 'Œuvre numérique'
      : frame.medium === 'hybrid'
        ? 'Hybride (physique + numérique)'
        : frame.medium === 'physical'
          ? 'Œuvre physique'
          : 'Non précisé'
  const sale =
    frame.onSale === true
      ? frame.priceLabel ||
        (frame.priceEur != null ? `${frame.priceEur} ${frame.currency || '€'}` : 'En vente')
      : frame.onSale === false
        ? 'Pas en vente'
        : frame.priceLabel || '—'

  const rows: { k: string; v: string }[] = [
    { k: 'Titre', v: frame.title },
    { k: 'Artiste', v: frame.artist || frame.subtitle || '—' },
    { k: 'Date', v: frame.date || '—' },
    { k: 'Technique', v: frame.technique || frame.type || '—' },
    { k: 'Support', v: medium },
    { k: 'Genre', v: frame.kind || '—' },
    { k: 'Dimensions', v: frame.dimensions || '—' },
    { k: 'Collection', v: frame.collection || '—' },
    { k: 'Prix / statut', v: sale },
    { k: 'Licence', v: frame.license || '—' },
  ]
  if (frame.provenance) rows.push({ k: 'Provenance', v: frame.provenance })

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-3"
      role="dialog"
      aria-modal
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0c0c14] p-4 shadow-2xl space-y-3 max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex gap-3">
          <div className="w-28 sm:w-36 shrink-0 aspect-[4/5] rounded-lg overflow-hidden border border-white/10 bg-black">
            {frame.image ? (
              <img src={frame.image} alt="" className="w-full h-full object-cover" decoding="async" />
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-600 text-xs">
                {frame.kind === 'sculpture' ? 'Sculpture' : '◈'}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-white leading-snug">{frame.title}</p>
            <p className="text-[12px] text-zinc-400 mt-1">{frame.artist || frame.subtitle}</p>
            {frame.description && (
              <p className="text-xs text-zinc-500 mt-2 line-clamp-4 leading-relaxed">
                {frame.description}
              </p>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-1.5 text-[12px] border-t border-white/[0.06] pt-3">
          {rows.map(r => (
            <div key={r.k} className="flex gap-2 justify-between">
              <dt className="text-zinc-600 shrink-0">{r.k}</dt>
              <dd className="text-zinc-300 text-right">{r.v}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-wrap gap-2 pt-1">
          {allowBuy && frame.onSale !== false && (
            <button type="button" className="btn-primary text-xs" onClick={onBuy}>
              {marketLive ? 'Acheter…' : 'Intention d’achat'}
            </button>
          )}
          {frame.href && (
            <a href={frame.href} target="_blank" rel="noreferrer" className="btn-secondary text-xs">
              Source ↗
            </a>
          )}
          <button type="button" className="btn-ghost text-xs" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
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
  const [inspect, setInspect] = useState(false)
  const [buyMsg, setBuyMsg] = useState<string | null>(null)
  const list = useMemo(() => frames, [frames])
  const f = list[Math.min(focus, Math.max(0, list.length - 1))] || null
  const marketLive = canListBuyNft()
  const { connected } = useWallet()

  useEffect(() => {
    setFocus(0)
    setInspect(false)
    setBuyMsg(null)
  }, [frames])

  const onBuy = () => {
    if (!f) return
    if (!connected) {
      requestOpenConnect()
      setBuyMsg('Connecte ton wallet pour préparer une intention d’achat.')
      return
    }
    dispatchBuyIntent(f)
    setBuyMsg(
      marketLive
        ? 'Intention BUY_NFT → Guardian. Signature requise.'
        : 'Intention paper — SC market non live.'
    )
  }

  if (!list.length) {
    return (
      <div className="min-h-[280px] rounded-2xl border border-white/10 flex items-center justify-center text-sm text-zinc-500">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10">
      <div className="p-4 space-y-3 bg-zinc-950">
        <p className="text-sm text-white font-medium">{f?.title}</p>
        <p className="text-[11px] text-zinc-500">{f?.artist || f?.subtitle}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary text-xs" onClick={() => setInspect(true)}>
            Fiche complète
          </button>
          <button type="button" className="btn-primary text-xs" onClick={onBuy}>
            Intention d’achat
          </button>
        </div>
        {buyMsg && <p className="text-[11px] text-amber-200">{buyMsg}</p>}
      </div>
      {inspect && f && (
        <ArtworkDossier
          frame={f}
          allowBuy
          marketLive={marketLive}
          onBuy={onBuy}
          onClose={() => setInspect(false)}
        />
      )}
    </div>
  )
}
