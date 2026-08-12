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
import UserWalletGuard from './UserWalletGuard'
import { canListBuyNft, isLiaOpsWallet, NFT_MARKET_FEE_BPS } from '../config/scStatus'
import { signBlockReason } from '../lib/txCapability'
import { resolveListingIdForNft } from '../lib/resolveListingId'

interface Props {
  nft: NFT | null
  onClose: () => void
  initialAction?: 'buy' | 'sell' | 'offer' | 'bid' | null
  initialListingId?: number | null
}

function feeSplit(price: number, feeBps: number) {
  const fee = (price * feeBps) / 10_000
  return { fee, toSeller: price - fee, feeBps }
}

export default function NFTDetailModal({
  nft,
  onClose,
  initialAction = null,
  initialListingId = null,
}: Props) {
  const { isLoggedIn, address, method } = useWeb3()
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
  const [indexHint, setIndexHint] = useState<string | null>(null)
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
      setIndexHint('from activity / parent')
    }
  }, [initialListingId, nft?.identifier])

  // Auto-resolve listing id from published index (token + nonce)
  useEffect(() => {
    if (!nft) return
    let cancelled = false
    ;(async () => {
      const hit = await resolveListingIdForNft(nft.collection, nft.nonce)
      if (cancelled || !hit) return
      setListingId(String(hit.listingId))
      if (hit.priceEgld) {
        setBuyPrice(hit.priceEgld)
        setListPrice(hit.priceEgld)
      }
      setIndexHint(`index id=${hit.listingId}`)
    })()
    return () => {
      cancelled = true
    }
  }, [nft?.identifier, nft?.collection, nft?.nonce])

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
  const live = canListBuyNft()
  const signBlock = signBlockReason(method)
  const priceN = parseFloat(buyPrice) || 0
  const split = feeSplit(priceN, NFT_MARKET_FEE_BPS)
  const royaltyBps = royalties != null ? royalties * 100 : 500
  const royaltyPlusFee = royaltyBps + NFT_MARKET_FEE_BPS

  const guard = (fn: () => Promise<unknown>) => async () => {
    setTxMsg(null)
    if (!live) {
      setTxMsg('Marketplace SC non live (codeHash) — List/Buy/Bid désactivés')
      return
    }
    if (!isLoggedIn || !address) {
      setTxMsg('Connecte ton wallet utilisateur (pas LIA ops)')
      return
    }
    if (isLiaOpsWallet(address)) {
      setTxMsg('Wallet protocole LIA interdit pour List/Buy — utilise ton wallet')
      return
    }
    if (signBlock) {
      setTxMsg(signBlock)
      return
    }
    try {
      await fn()
      setTxMsg('TX soumise — confirme dans le wallet si demandé')
    } catch (e: unknown) {
      setTxMsg(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const txDisabled = pending || !live || !!signBlock

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in"
      role="dialog"
    >
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
              {nft.collection_name} · {nonceLabel(nft)} · royalties {royalties ?? '—'}% ·{' '}
              {typeLabel(nft.type)}
            </p>
            <TxCapabilityBanner />
            {!live && (
              <p className="text-[10px] text-red-300/90">
                SC marketplace non live (codeHash null) — TX on-chain bloquées jusqu’au deploy +
                verify.
              </p>
            )}
            <UserWalletGuard address={address} action="List / Buy / Bid" />

            <div className="flex flex-wrap gap-1">
              {(['buy', 'sell', 'bid', 'manage', 'offer'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                    tab === t
                      ? 'bg-purple-600 text-white'
                      : t === 'offer'
                        ? 'bg-[#15151f] border border-dashed border-gray-600 text-gray-500'
                        : 'bg-[#15151f] border border-[#2a2a3a] text-gray-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="text-[10px] mono text-gray-500">
              SC {marketplaceAddress ? `${marketplaceAddress.slice(0, 18)}…` : '— (not live)'}
            </p>

            <label className="flex flex-col gap-1 text-[10px] uppercase text-gray-500">
              Listing ID
              <input
                type="number"
                min={0}
                value={listingId}
                onChange={e => {
                  setListingId(e.target.value)
                  setIndexHint('manual')
                }}
                className="rounded-lg border border-[#2a2a3a] bg-[#15151f] px-2 py-1.5 text-sm text-white"
              />
              <span className="normal-case text-gray-600">
                {indexHint
                  ? `Source: ${indexHint}`
                  : 'P1: index listings (token+nonce) ou activité SC'}
              </span>
            </label>

            {(tab === 'buy' || tab === 'sell') && priceN > 0 && (
              <div className="rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-2 text-[11px] text-gray-400 space-y-1">
                <p>
                  Fee market estimé {(NFT_MARKET_FEE_BPS / 100).toFixed(1)}% →{' '}
                  <span className="text-amber-200">{split.fee.toFixed(4)} EGLD</span> · seller ≈{' '}
                  <span className="text-teal-300">{split.toSeller.toFixed(4)} EGLD</span>
                </p>
                {royaltyPlusFee > 10_000 && (
                  <p className="text-red-300">
                    Attention: royalty+fee &gt; 100% — SC doit rejeter (cap P0).
                  </p>
                )}
              </div>
            )}

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
                  disabled={txDisabled}
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
                  disabled={txDisabled}
                  className="btn-primary text-sm"
                  onClick={guard(() =>
                    listNft({
                      tokenId: nft.collection,
                      nonce: nft.nonce,
                      priceEgld: parseFloat(listPrice),
                    })
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
                  disabled={txDisabled}
                  className="btn-primary text-sm"
                  onClick={guard(() => placeBid({ listingId: id, amountEgld: parseFloat(bidPrice) }))}
                >
                  Place bid
                </button>
                <button
                  type="button"
                  disabled={txDisabled}
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
                  disabled={txDisabled}
                  className="btn-secondary text-sm"
                  onClick={guard(() => acceptBid(id))}
                >
                  Accept bid
                </button>
                <button
                  type="button"
                  disabled={txDisabled}
                  className="btn-secondary text-sm"
                  onClick={guard(() => cancelListing(id))}
                >
                  Cancel listing
                </button>
              </div>
            )}

            {tab === 'offer' && (
              <div className="rounded-xl border border-dashed border-gray-600 bg-[#0a0a0f] px-3 py-3 text-xs text-gray-400 space-y-2">
                <p>
                  <strong className="text-gray-300">Offer</strong> n’a pas d’endpoint on-chain (V2
                  escrow).
                </p>
                <p>Utilise Bid si le listing est live.</p>
              </div>
            )}

            {(txMsg || error) && (
              <p className={`text-xs ${error ? 'text-red-400' : 'text-green-400'}`}>{txMsg || error}</p>
            )}
            {lastTx && (
              <a
                className="text-xs text-purple-300 underline"
                href={`${LINKS.explorer}/transactions/${lastTx}`}
                target="_blank"
                rel="noreferrer"
              >
                Voir TX explorer
              </a>
            )}

            <div className="flex gap-3 text-xs mt-2">
              <a
                href={EXPLORER_NFT(nft.identifier)}
                target="_blank"
                rel="noreferrer"
                className="text-purple-300"
              >
                Explorer
              </a>
              <a
                href={XOXNO_COLLECTION(nft.collection)}
                target="_blank"
                rel="noreferrer"
                className="text-gray-400"
              >
                XOXNO
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
