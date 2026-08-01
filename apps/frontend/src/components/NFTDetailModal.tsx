import { useEffect, useState } from 'react'
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
import { useMarketplaceTx } from '../hooks/useMarketplaceTx'
import { useWeb3 } from '../hooks/useWeb3'

interface Props {
  nft: NFT | null
  onClose: () => void
}

export default function NFTDetailModal({ nft, onClose }: Props) {
  const { isLoggedIn } = useWeb3()
  const { listNft, buyNft, pending, error, lastTx, marketplaceAddress } = useMarketplaceTx()
  const [listPrice, setListPrice] = useState('1')
  const [buyPrice, setBuyPrice] = useState('1')
  const [listingId, setListingId] = useState('1')
  const [txMsg, setTxMsg] = useState<string | null>(null)

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
  const marketplaceReady = marketplaceAddress.startsWith('erd1')

  const onList = async () => {
    setTxMsg(null)
    if (!isLoggedIn) {
      setTxMsg('Connecte ton wallet (xPortal / extension) pour lister.')
      return
    }
    const price = parseFloat(listPrice)
    if (!(price > 0)) {
      setTxMsg('Prix EGLD invalide')
      return
    }
    try {
      await listNft({ tokenId: nft.collection, nonce: nft.nonce, priceEgld: price })
      setTxMsg('Listing soumis — confirme dans le wallet.')
    } catch (e: unknown) {
      setTxMsg(e instanceof Error ? e.message : 'Erreur listing')
    }
  }

  const onBuy = async () => {
    setTxMsg(null)
    if (!isLoggedIn) {
      setTxMsg('Connecte ton wallet pour acheter.')
      return
    }
    const price = parseFloat(buyPrice)
    const id = parseInt(listingId, 10)
    if (!(price > 0) || !(id >= 0)) {
      setTxMsg('Listing ID / prix invalides')
      return
    }
    try {
      await buyNft({ listingId: id, priceEgld: price })
      setTxMsg('Achat soumis — confirme dans le wallet.')
    } catch (e: unknown) {
      setTxMsg(e instanceof Error ? e.message : 'Erreur achat')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`NFT detail: ${nft.name}`}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[#2a2a3a] bg-[#12121a]/95 backdrop-blur-xl shadow-2xl shadow-purple-900/30">
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

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Meta label="Collection" value={nft.collection} mono />
              <Meta label="Nonce" value={nonceLabel(nft)} />
              <Meta label="Creator" value={truncateAddr(nft.creator)} mono />
              <Meta label="Owner" value={truncateAddr(nft.owner) || 'Unowned'} mono />
              <Meta label="Royalties" value={royalties !== null ? `${royalties}%` : '—'} />
              <Meta label="Type" value={typeLabel(nft.type)} />
            </dl>

            {/* On-chain List / Buy */}
            <div className="rounded-xl border border-purple-500/25 bg-purple-500/5 px-3 py-3 text-xs text-gray-300 space-y-3">
              <p className="font-semibold text-purple-200">Marketplace on-chain (xArtists)</p>
              <p className="text-[10px] text-gray-500 mono">
                {marketplaceReady ? `SC: ${marketplaceAddress.slice(0, 16)}…` : 'SC marketplace indisponible'}
              </p>

              <div className="flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase text-gray-500">List price (EGLD)</span>
                  <input
                    type="number"
                    min="0.001"
                    step="0.01"
                    value={listPrice}
                    onChange={(e) => setListPrice(e.target.value)}
                    className="w-28 rounded-lg border border-[#2a2a3a] bg-[#15151f] px-2 py-1.5 text-sm text-white"
                  />
                </label>
                <button
                  type="button"
                  disabled={pending || !marketplaceReady}
                  onClick={onList}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {pending ? '…' : 'List NFT'}
                </button>
              </div>

              <div className="flex flex-wrap items-end gap-2 border-t border-[#2a2a3a] pt-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase text-gray-500">Listing ID</span>
                  <input
                    type="number"
                    min="0"
                    value={listingId}
                    onChange={(e) => setListingId(e.target.value)}
                    className="w-24 rounded-lg border border-[#2a2a3a] bg-[#15151f] px-2 py-1.5 text-sm text-white"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase text-gray-500">Pay (EGLD)</span>
                  <input
                    type="number"
                    min="0.001"
                    step="0.01"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    className="w-28 rounded-lg border border-[#2a2a3a] bg-[#15151f] px-2 py-1.5 text-sm text-white"
                  />
                </label>
                <button
                  type="button"
                  disabled={pending || !marketplaceReady}
                  onClick={onBuy}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  {pending ? '…' : 'Buy NFT'}
                </button>
              </div>

              {(txMsg || error || lastTx) && (
                <p className="text-[11px] text-amber-200/90">
                  {txMsg || error}
                  {lastTx ? ` · tx ${lastTx}` : ''}
                </p>
              )}
              {!isLoggedIn && (
                <p className="text-[11px] text-gray-500">Wallet requis pour List / Buy on-chain.</p>
              )}
              {!marketplaceReady && (
                <p className="text-[11px] text-orange-300">Marketplace désactivée — adresse contrat absente.</p>
              )}
            </div>

            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-3 py-2.5 text-xs text-gray-400">
              <p className="font-semibold text-orange-300/90 mb-1">Règles marketplace</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Escrow phygital → vente bloquée jusqu’unlock</li>
                <li>Commission : 2,5 % vendeur + 0,5 % acheteur (voir LEGAL.md)</li>
                <li>Paiement cible : EGLD / USDC / WEGLD / $TRO</li>
              </ul>
            </div>

            <div className="mt-auto flex flex-col gap-2 pt-2">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Marchés externes</p>
              <a
                href={XOXNO_COLLECTION(nft.collection)}
                target="_blank"
                rel="noreferrer"
                className="btn-primary text-center text-sm"
              >
                Buy on XOXNO ↗
              </a>
              <a
                href="https://xexchange.com/swap/USDC-c76f1f/TRO-94c925"
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-center text-sm"
              >
                Get $TRO (xExchange) ↗
              </a>
              <a
                href={EXPLORER_NFT(nft.identifier)}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-center text-sm"
              >
                View on Explorer ↗
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
