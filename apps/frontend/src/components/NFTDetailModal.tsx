import { useEffect } from 'react'
import type { NFT } from '../types/nft'
import {
  nftImageUrl,
  nftRoyalties,
  truncateAddr,
  typeLabel,
  nonceLabel,
  EXPLORER_NFT,
  XOXNO_COLLECTION,
} from '../types/nft'

interface Props {
  nft: NFT | null
  onClose: () => void
}

export default function NFTDetailModal({ nft, onClose }: Props) {
  // Close on Escape, lock scroll while open.
  useEffect(() => {
    if (!nft) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [nft, onClose])

  if (!nft) return null

  const img = nftImageUrl(nft)
  const royalties = nftRoyalties(nft)
  const isSFT = typeLabel(nft.type) === 'SFT'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`NFT detail: ${nft.name}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[#2a2a3a] bg-[#12121a]/95 backdrop-blur-xl shadow-2xl shadow-purple-900/30">
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[#2a2a3a] bg-[#15151f]/80 text-gray-300 hover:border-purple-500 hover:text-white transition-all duration-300"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="relative aspect-square md:aspect-auto md:h-full bg-gradient-to-br from-[#15151f] to-[#0a0a0f] overflow-hidden md:rounded-l-3xl">
            {img ? (
              <img
                src={img}
                alt={`NFT artwork: ${nft.name} from the ${nft.collection_name} collection`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-600/30 via-indigo-600/20 to-fuchsia-500/30">
                <span className="text-6xl opacity-60">🎨</span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5 md:rounded-l-3xl" />
          </div>

          {/* Details */}
          <div className="flex flex-col gap-5 p-6 sm:p-8">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300 border border-purple-500/20">
                  {nft.collection_name}
                </span>
                <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-gray-300 border border-[#2a2a3a]">
                  {isSFT ? 'SFT' : 'NFT'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">
                {nft.name || 'Untitled'}
              </h2>
              <p className="mono mt-1 text-xs text-gray-500">{nft.identifier}</p>
            </div>

            {nft.metadata?.description && (
              <p className="text-sm leading-relaxed text-gray-400 line-clamp-4">
                {nft.metadata.description}
              </p>
            )}

            {/* Meta grid */}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Meta label="Collection" value={nft.collection} mono />
              <Meta label="Nonce" value={nonceLabel(nft)} />
              <Meta label="Creator" value={truncateAddr(nft.creator)} mono />
              <Meta label="Owner" value={truncateAddr(nft.owner) || 'Unowned'} mono />
              <Meta
                label="Royalties"
                value={royalties !== null ? `${royalties}%` : '—'}
              />
              <Meta label="Type" value={typeLabel(nft.type)} />
            </dl>

            {/* Actions */}
            <div className="mt-auto flex flex-col gap-3 pt-2">
              <a
                href={EXPLORER_NFT(nft.identifier)}
                target="_blank"
                rel="noreferrer"
                className="btn-primary text-center text-sm"
              >
                View on MultiversX Explorer ↗
              </a>
              <a
                href={XOXNO_COLLECTION(nft.collection)}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-center text-sm"
              >
                Buy / Trade on XOXNO ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-[#2a2a3a] bg-[#15151f] px-3 py-2.5">
      <dt className="text-[10px] uppercase tracking-widest text-gray-500">{label}</dt>
      <dd className={`mt-0.5 truncate text-sm font-semibold text-gray-200 ${mono ? 'mono' : ''}`}>
        {value}
      </dd>
    </div>
  )
}
