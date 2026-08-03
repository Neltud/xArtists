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
import { LINKS } from '../config/links'

interface Props {
  nft: NFT | null
  onClose: () => void
  initialAction?: 'buy' | 'sell' | 'offer' | 'bid' | null
}

export default function NFTDetailModal({ nft, onClose, initialAction = null }: Props) {
  const { isLoggedIn } = useWeb3()
  const { listNft, buyNft, pending, error, lastTx, marketplaceAddress } = useMarketplaceTx()
  const [listPrice, setListPrice] = useState('1')
  const [buyPrice, setBuyPrice] = useState('1')
  const [offerPrice, setOfferPrice] = useState('0.5')
  const [bidPrice, setBidPrice] = useState('0.5')
  const [listingId, setListingId] = useState('1')
  const [txMsg, setTxMsg] = useState<string | null>(null)
  const [tab, setTab] = useState<'buy' | 'sell' | 'offer' | 'bid'>(initialAction || 'buy')

  useEffect(() => {
    if (initialAction) setTab(initialAction)
  }, [initialAction, nft?.identifier])

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

  const onList = async () => {
    setTxMsg(null)
    if (!isLoggedIn) {
      setTxMsg('Connecte ton wallet pour vendre (list).')
      return
    }
    const price = parseFloat(listPrice)
    if (!(price > 0)) {
      setTxMsg('Prix EGLD invalide')
      return
    }
    try {
      const res = await listNft({
        tokenId: nft.collection,
        nonce: nft.nonce,
        priceEgld: price,
      })
      setTxMsg(res?.error || 'Listing soumis — confirme dans le wallet.')
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
      const res = await buyNft({ listingId: id, priceEgld: price })
      setTxMsg(res?.error || 'Achat soumis — confirme dans le wallet.')
    } catch (e: unknown) {
      setTxMsg(e instanceof Error ? e.message : 'Erreur achat')
    }
  }

  const onOfferOrBid = (kind: 'offer' | 'bid') => {
    setTxMsg(null)
    if (!isLoggedIn) {
      setTxMsg(`Connecte ton wallet pour ${kind}.`)
      return
    }
    const p = parseFloat(kind === 'offer' ? offerPrice : bidPrice)
    if (!(p > 0)) {
      setTxMsg('Montant invalide')
      return
    }
    // SC marketplace actuel: list/buy only — offer/bid = UI ready, endpoint later
    setTxMsg(
      `${kind === 'offer' ? 'Offer' : 'Bid'} ${p} EGLD enregistré localement — endpoint on-chain offer/bid à venir sur le SC. Utilise Buy avec listing ID pour l’instant.`
    )
  }

  const tabs: { id: typeof tab; label: string }[] = [
    { id: 'buy', label: 'Buy' },
    { id: 'sell', label: 'Sell' },
    { id: 'offer', label: 'Offer' },
    { id: 'bid', label: 'Bid' },
  ]

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
          className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[#2a2a3a] bg-[#15151f]/80 text-gray-300 hover:border-purple-500 hover:text-white"
        >
          ✕
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative aspect-square md:aspect-auto md:h-full bg-gradient-to-br from-[#15151f] to-[#0a0a0f] overflow-hidden md:rounded-l-3xl">
            {img ? (
              <img src={img} alt={nft.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-6xl opacity-60">🎨</div>
            )}
          </div>

          <div className="flex flex-col gap-4 p-6 sm:p-8">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300 border border-purple-500/20">
                  {nft.collection_name}
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs border border-[#2a2a3a]">
                  {isSFT ? 'SFT' : 'NFT'}
                </span>
              </div>
              <h2 className="text-2xl font-black">{nft.name || 'Untitled'}</h2>
              <p className="mono mt-1 text-xs text-gray-500">{nft.identifier}</p>
            </div>

            <dl className="grid grid-cols-2 gap-2 text-sm">
              <Meta label="Nonce" value={nonceLabel(nft)} />
              <Meta label="Royalties" value={royalties !== null ? `${royalties}%` : '—'} />
              <Meta label="Creator" value={truncateAddr(nft.creator)} mono />
              <Meta label="Owner" value={truncateAddr(nft.owner) || '—'} mono />
            </dl>

            {/* Buy / Sell / Offer / Bid */}
            <div className="rounded-xl border border-purple-500/25 bg-purple-500/5 p-3 space-y-3">
              <div className="flex flex-wrap gap-1">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      tab === t.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#15151f] text-gray-400 hover:text-white border border-[#2a2a3a]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] mono text-gray-500">SC {marketplaceAddress.slice(0, 18)}…</p>

              {tab === 'buy' && (
                <div className="flex flex-wrap items-end gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase text-gray-500">Listing ID</span>
                    <input
                      type="number"
                      min={0}
                      value={listingId}
                      onChange={e => setListingId(e.target.value)}
                      className="w-24 rounded-lg border border-[#2a2a3a] bg-[#15151f] px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase text-gray-500">Pay EGLD</span>
                    <input
                      type="number"
                      min={0.001}
                      step={0.01}
                      value={buyPrice}
                      onChange={e => setBuyPrice(e.target.value)}
                      className="w-28 rounded-lg border border-[#2a2a3a] bg-[#15151f] px-2 py-1.5 text-sm"
                    />
                  </label>
                  <button type="button" disabled={pending} onClick={onBuy} className="btn-primary text-sm disabled:opacity-50">
                    {pending ? '…' : 'Buy'}
                  </button>
                </div>
              )}

              {tab === 'sell' && (
                <div className="flex flex-wrap items-end gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase text-gray-500">List price EGLD</span>
                    <input
                      type="number"
                      min={0.001}
                      step={0.01}
                      value={listPrice}
                      onChange={e => setListPrice(e.target.value)}
                      className="w-28 rounded-lg border border-[#2a2a3a] bg-[#15151f] px-2 py-1.5 text-sm"
                    />
                  </label>
                  <button type="button" disabled={pending} onClick={onList} className="btn-primary text-sm disabled:opacity-50">
                    {pending ? '…' : 'Sell / List'}
                  </button>
                </div>
              )}

              {tab === 'offer' && (
                <div className="flex flex-wrap items-end gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase text-gray-500">Offer EGLD</span>
                    <input
                      type="number"
                      min={0.001}
                      step={0.01}
                      value={offerPrice}
                      onChange={e => setOfferPrice(e.target.value)}
                      className="w-28 rounded-lg border border-[#2a2a3a] bg-[#15151f] px-2 py-1.5 text-sm"
                    />
                  </label>
                  <button type="button" onClick={() => onOfferOrBid('offer')} className="btn-secondary text-sm">
                    Make offer
                  </button>
                </div>
              )}

              {tab === 'bid' && (
                <div className="flex flex-wrap items-end gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase text-gray-500">Bid EGLD</span>
                    <input
                      type="number"
                      min={0.001}
                      step={0.01}
                      value={bidPrice}
                      onChange={e => setBidPrice(e.target.value)}
                      className="w-28 rounded-lg border border-[#2a2a3a] bg-[#15151f] px-2 py-1.5 text-sm"
                    />
                  </label>
                  <button type="button" onClick={() => onOfferOrBid('bid')} className="btn-secondary text-sm">
                    Place bid
                  </button>
                </div>
              )}

              {(txMsg || error || lastTx) && (
                <p className="text-[11px] text-amber-200/90">
                  {txMsg || error}
                  {lastTx ? ` · ${lastTx}` : ''}
                </p>
              )}
              {!isLoggedIn && (
                <p className="text-[11px] text-gray-500">Wallet requis pour Buy / Sell on-chain.</p>
              )}
            </div>

            <div className="mt-auto flex flex-col gap-2 pt-2">
              <a
                href={XOXNO_COLLECTION(nft.collection)}
                target="_blank"
                rel="noreferrer"
                className="btn-primary text-center text-sm"
              >
                Voir sur XOXNO ↗
              </a>
              <a
                href={LINKS.xexchangeTroUsdc}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-center text-sm"
              >
                Get $TRO ↗
              </a>
              <a
                href={EXPLORER_NFT(nft.identifier)}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-center text-sm"
              >
                Explorer ↗
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
      <dd className={`mt-0.5 truncate text-sm font-semibold ${mono ? 'mono' : ''}`}>{value}</dd>
    </div>
  )
}
