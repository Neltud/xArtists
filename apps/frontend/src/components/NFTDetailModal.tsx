import {localizeChild as xaLocalize, renderChild as xaRender, usePhraseLocale as xaUsePhraseLocale} from '../i18n/phraseRuntime'
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
  xaUsePhraseLocale()

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
            {xaRender(img ? (
              <img src={img} alt={nft.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl">🎨</div>
            ))}
          </div>
          <div className="flex flex-col gap-3 p-6">
            <h2 className="text-2xl font-black">{xaRender(nft.name || 'Untitled')}</h2>
            <p className="mono text-xs text-gray-500">{xaRender(nft.identifier)}</p>
            <p className="text-xs text-gray-400">
              {xaRender(nft.collection_name)} · {xaRender(nonceLabel(nft))} {xaRender(" · royalties ")}{xaRender(royalties ?? '—')}% ·{xaRender(' ')}
              {xaRender(typeLabel(nft.type))}
            </p>
            <TxCapabilityBanner />
            {xaRender(!live && (
              <p className="text-[10px] text-red-300/90">
                {xaRender("SC marketplace non live (codeHash null) — TX on-chain bloquées jusqu’au deploy + verify. ")}</p>
            ))}
            <UserWalletGuard address={address} action="List / Buy / Bid" />

            <div className="flex flex-wrap gap-1">
              {xaRender((['buy', 'sell', 'bid', 'manage', 'offer'] as const).map(t => (
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
                  {xaRender(t)}
                </button>
              )))}
            </div>
            <p className="text-[10px] mono text-gray-500">
              SC {xaRender(marketplaceAddress ? `${marketplaceAddress.slice(0, 18)}…` : '— (not live)')}
            </p>

            <label className="flex flex-col gap-1 text-[10px] uppercase text-gray-500">
              {xaRender("Listing ID ")}<input
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
                {xaRender(indexHint
                  ? `Source: ${indexHint}`
                  : 'P1: index listings (token+nonce) ou activité SC')}
              </span>
            </label>

            {xaRender((tab === 'buy' || tab === 'sell') && priceN > 0 && (
              <div className="rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-2 text-[11px] text-gray-400 space-y-1">
                <p>
                  {xaRender("Fee market estimé ")}{xaRender((NFT_MARKET_FEE_BPS / 100).toFixed(1))}% →{xaRender(' ')}
                  <span className="text-amber-200">{xaRender(split.fee.toFixed(4))} {xaRender(" EGLD")}</span> {xaRender(" · seller ≈")}{xaRender(' ')}
                  <span className="text-teal-300">{xaRender(split.toSeller.toFixed(4))} {xaRender(" EGLD")}</span>
                </p>
                {xaRender(royaltyPlusFee > 10_000 && (
                  <p className="text-red-300">
                    {xaRender("Attention: royalty+fee &gt; 100% — SC doit rejeter (cap P0). ")}</p>
                ))}
              </div>
            ))}

            {xaRender(tab === 'buy' && (
              <div className="flex flex-wrap gap-2 items-end">
                <input
                  type="number"
                  value={buyPrice}
                  onChange={e => setBuyPrice(e.target.value)}
                  className="w-28 rounded-lg border border-[#2a2a3a] bg-[#15151f] px-2 py-1.5 text-sm"
                  placeholder={xaLocalize("EGLD")}
                />
                <button
                  type="button"
                  disabled={txDisabled}
                  className="btn-primary text-sm"
                  onClick={guard(() => buyNft({ listingId: id, priceEgld: parseFloat(buyPrice) }))}
                >
                  {xaRender("Buy ")}</button>
              </div>
            ))}

            {xaRender(tab === 'sell' && (
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
                  {xaRender("List / Sell ")}</button>
              </div>
            ))}

            {xaRender(tab === 'bid' && (
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
                  {xaRender("Place bid ")}</button>
                <button
                  type="button"
                  disabled={txDisabled}
                  className="btn-secondary text-sm"
                  onClick={guard(() => withdrawBid(id))}
                >
                  {xaRender("Withdraw bid ")}</button>
              </div>
            ))}

            {xaRender(tab === 'manage' && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={txDisabled}
                  className="btn-secondary text-sm"
                  onClick={guard(() => acceptBid(id))}
                >
                  {xaRender("Accept bid ")}</button>
                <button
                  type="button"
                  disabled={txDisabled}
                  className="btn-secondary text-sm"
                  onClick={guard(() => cancelListing(id))}
                >
                  {xaRender("Cancel listing ")}</button>
              </div>
            ))}

            {xaRender(tab === 'offer' && (
              <div className="rounded-xl border border-dashed border-gray-600 bg-[#0a0a0f] px-3 py-3 text-xs text-gray-400 space-y-2">
                <p>
                  <strong className="text-gray-300">{xaRender("Offer")}</strong> {xaRender(" n’a pas d’endpoint on-chain (V2 escrow). ")}</p>
                <p>{xaRender("Utilise Bid si le listing est live.")}</p>
              </div>
            ))}

            {xaRender((txMsg || error) && (
              <p className={`text-xs ${error ? 'text-red-400' : 'text-green-400'}`}>{xaRender(txMsg || error)}</p>
            ))}
            {xaRender(lastTx && (
              <a
                className="text-xs text-purple-300 underline"
                href={`${LINKS.explorer}/transactions/${lastTx}`}
                target="_blank"
                rel="noreferrer"
              >
                {xaRender("Voir TX explorer ")}</a>
            ))}

            <div className="flex gap-3 text-xs mt-2">
              <a
                href={EXPLORER_NFT(nft.identifier)}
                target="_blank"
                rel="noreferrer"
                className="text-purple-300"
              >
                {xaRender("Explorer ")}</a>
              <a
                href={XOXNO_COLLECTION(nft.collection)}
                target="_blank"
                rel="noreferrer"
                className="text-gray-400"
              >
                {xaRender("XOXNO ")}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
