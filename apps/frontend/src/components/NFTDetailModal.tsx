import { useEffect, useState } from 'react'
import type { NFT } from '../types/nft'
import {
  nftImageUrl,
  nftRoyalties,
  typeLabel,
  nonceLabel,
  EXPLORER_NFT,
  XOXNO_COLLECTION,
} from '../types/nft'
import { useMarketplaceTx } from '../hooks/useMarketplaceTx'
import { useWeb3 } from '../hooks/useWeb3'
import { LINKS } from '../config/links'
import TxCapabilityBanner from './TxCapabilityBanner'

interface Props {
  nft: NFT | null
  onClose: () => void
  initialAction?: 'buy' | 'sell' | 'offer' | 'bid' | null
  /** From marketplace activity index click */
  initialListingId?: number | null
}

export default function NFTDetailModal({
  nft,
  onClose,
  initialAction = null,
  initialListingId = null,
}: Props) {
  const { isLoggedIn } = useWeb3()
  const {
    listNft,
    buyNft,
    placeBid,
    acceptBid,
    withdrawBid,
    cancelListing,
    pending,
    error,
    lastTx,
    marketplaceAddress,
  } = useMarketplaceTx()
  const [listPrice, setListPrice] = useState('1')
  const [buyPrice, setBuyPrice] = useState('1')
  const [bidPrice, setBidPrice] = useState('0.5')
  const [listingId, setListingId] = useState('1')
  const [txMsg, setTxMsg] = useState<string | null>(null)
  const [tab, setTab] = useState<'buy' | 'sell' | 'offer' | 'bid' | 'manage'>(
    initialAction === 'offer' ? 'offer' : initialAction || 'buy'
  )

  useEffect(() => {
    if (initialAction) setTab(initialAction === 'offer' ? 'offer' : initialAction)
  }, [initialAction, nft?.identifier])

  useEffect(() => {
    if (initialListingId != null && initialListingId >= 0) {
      setListingId(String(initialListingId))
    }
  }, [initialListingId, nft?.identifier])

  useEffect(() => {
    if (!nft) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [nft, onClose])

  if (!nft) return null

  const img = nftImageUrl(nft)
  const royalties = nftRoyalties(nft)
  const id = parseInt(listingId, 10)

  const guard = (fn: () => Promise<unknown>) => async () => {
    setTxMsg(null)
    if (!isLoggedIn) {
      setTxMsg('Connecte ton wallet')
      return
    }
    try {
      await fn()
      setTxMsg('TX soumise — confirme dans le wallet si demandé')
    } catch (e: unknown) {
      setTxMsg(e instanceof Error ? e.message : 'Erreur')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in" role="dialog">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[#2a2a3a] bg-[#12121a]/95">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 h-9 w-9 rounded-full border border-[#2a2a3a]"
        >
          ✕
        </button>
        <div className="grid md:grid-cols-2">
          <div className="aspect-square bg-[#0a0a0f]">
            {img ? (
              <img src={img} alt={nft.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl">🎨</div>
            )}
          </div>
          <div className="flex flex-col gap-3 p-6">
            <h2 className="text-2xl font-black">{nft.name || 'Untitled'}</h2>
            <p className="mono text-xs text-gray-500">{nft.identifier}</p>
            <p className="text-xs text-gray-400">
              {nft.collection_name} · {nonceLabel(nft)} · royalties {royalties ?? '—'}% · {typeLabel(nft.type)}
            </p>
            <TxCapabilityBanner />
            <p className="text-[10px] text-red-300/90">
              SC marketplace non déployé (codeHash null) — TX on-chain échoueront jusqu’au P0 deploy.
            </p>

            <div className="flex flex-wrap gap-1">
              {(['buy', 'sell', 'bid', 'manage', 'offer'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                    tab === t ? 'bg-purple-600 text-white' : 'bg-[#15151f] border border-[#2a2a3a] text-gray-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="text-[10px] mono text-gray-500">SC {marketplaceAddress.slice(0, 18)}…</p>

            <label className="flex flex-col gap-1 text-[10px] uppercase text-gray-500">
              Listing ID
              <input
                type="number"
                min={0}
                value={listingId}
                onChange={e => setListingId(e.target.value)}
                className="w-28 rounded-lg border border-[#2a2a3a] bg-[#15151f] px-2 py-1.5 text-sm text-white"
              />
            </label>

            {tab === 'buy' && (
              <div className="flex flex-wrap gap-2 items-end">
                <input
                  type="number"
                  value={buyPrice}
                  onChange={e => setBuyPrice(e.target.value)}
                  className="w-28 rounded-lg border border-[#2a2a3a] bg-[#15151f] px-2 py-1.5 text-sm"
                  placeholder="EGLD"
                />
                <button
                  type="button"
                  disabled={pending}
                  className="btn-primary text-sm"
                  onClick={guard(() => buyNft({ listingId: id, priceEgld: parseFloat(buyPrice) }))}
                >
                  Buy
                </button>
              </div>
            )}

            {tab === 'sell' && (
              <div className="flex flex-wrap gap-2 items-end">
                <input
                  type="number"
                  value={listPrice}
                  onChange={e => setListPrice(e.target.value)}
                  className="w-28 rounded-lg border border-[#2a2a3a] bg-[#15151f] px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  disabled={pending}
                  className="btn-primary text-sm"
                  onClick={guard(() =>
                    listNft({ tokenId: nft.collection, nonce: nft.nonce, priceEgld: parseFloat(listPrice) })
                  )}
                >
                  List / Sell
                </button>
              </div>
            )}

            {tab === 'bid' && (
              <div className="flex flex-wrap gap-2 items-end">
                <input
                  type="number"
                  value={bidPrice}
                  onChange={e => setBidPrice(e.target.value)}
                  className="w-28 rounded-lg border border-[#2a2a3a] bg-[#15151f] px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  disabled={pending}
                  className="btn-primary text-sm"
                  onClick={guard(() => placeBid({ listingId: id, amountEgld: parseFloat(bidPrice) }))}
                >
                  Place bid
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className="btn-secondary text-sm"
                  onClick={guard(() => withdrawBid(id))}
                >
                  Withdraw bid
                </button>
              </div>
            )}

            {tab === 'manage' && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  className="btn-primary text-sm"
                  onClick={guard(() => acceptBid(id))}
                >
                  Accept bid (seller)
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className="btn-secondary text-sm"
                  onClick={guard(() => cancelListing(id))}
                >
                  Cancel listing
                </button>
              </div>
            )}

            {tab === 'offer' && (
              <p className="text-xs text-amber-200/90 border border-amber-500/30 rounded-lg p-3">
                <strong>Offer</strong> : pas d’endpoint on-chain. Utilise <strong>Bid</strong> sur un listing
                existant.
              </p>
            )}

            {(txMsg || error || lastTx) && (
              <p className="text-[11px] text-amber-200">
                {txMsg || error}
                {lastTx ? ` · ${lastTx}` : ''}
              </p>
            )}

            <div className="mt-auto flex flex-col gap-2 pt-2">
              <a
                href={XOXNO_COLLECTION(nft.collection)}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-center text-sm"
              >
                XOXNO ↗
              </a>
              <a
                href={EXPLORER_NFT(nft.identifier)}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-center text-sm"
              >
                Explorer ↗
              </a>
              <a
                href={LINKS.xexchangeTroUsdc}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-center text-sm"
              >
                $TRO ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
